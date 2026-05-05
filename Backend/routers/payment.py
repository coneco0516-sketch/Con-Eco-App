import os
import hmac
import hashlib
import razorpay
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Request, BackgroundTasks
from pydantic import BaseModel
from dotenv import load_dotenv
from database import get_db_connection
from routers.auth import get_current_user_from_cookie

from email_service import send_order_confirmation, send_vendor_notification_email, get_notification_preferences

load_dotenv()



RAZORPAY_KEY_ID     = os.environ.get("RAZORPAY_KEY_ID", "")
RAZORPAY_KEY_SECRET = os.environ.get("RAZORPAY_KEY_SECRET", "")

router = APIRouter()


def check_user(user=Depends(get_current_user_from_cookie)):
    if not user:
        raise HTTPException(status_code=401, detail="Not logged in")
    return user

from database import get_db_connection, get_platform_setting


# ── 1. Create Razorpay Order ─────────────────────────────────────────────────
class CreateOrderRequest(BaseModel):
    amount_paise: int   # Amount in paise (₹1 = 100 paise)
    currency: str = "INR"

@router.post("/create_order")
def create_razorpay_order(data: CreateOrderRequest, user=Depends(check_user)):
    """
    Called by Customers or Vendors before launching the Razorpay popup.
    """
    if not RAZORPAY_KEY_ID or not RAZORPAY_KEY_SECRET:
        raise HTTPException(
            status_code=503,
            detail="Payment gateway not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env"
        )

    client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))
    order = client.order.create({
        "amount":   data.amount_paise,
        "currency": data.currency,
        "payment_capture": 1   # Auto-capture payment
    })
    return {"status": "success", "order_id": order["id"], "key_id": RAZORPAY_KEY_ID}


# ── 2. Verify Razorpay Payment for Commissions (Vendor) ──────────────────────
class VerifyInvoiceRequest(BaseModel):
    invoice_id:          int
    razorpay_order_id:   str
    razorpay_payment_id: str
    razorpay_signature:  str

@router.post("/verify_invoice")
def verify_invoice_payment(data: VerifyInvoiceRequest, user=Depends(get_current_user_from_cookie)):
    if user['role'] != 'Vendor':
        raise HTTPException(status_code=403, detail="Vendor only")

    # Signature verification
    body        = f"{data.razorpay_order_id}|{data.razorpay_payment_id}"
    expected_sig= hmac.new(
        RAZORPAY_KEY_SECRET.encode("utf-8"),
        body.encode("utf-8"),
        hashlib.sha256
    ).hexdigest()

    if expected_sig != data.razorpay_signature:
        raise HTTPException(status_code=400, detail="Signature failed.")

    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        # 1. Update invoice status
        cursor.execute(
            "UPDATE weekly_invoices SET status='Paid' WHERE invoice_id=%s AND vendor_id=%s",
            (data.invoice_id, user["user_id"])
        )
        
        # 2. Reset strikes and verify account if it was unverified due to strikes
        cursor.execute("UPDATE Vendors SET commission_strikes = 0, verification_status='Verified' WHERE vendor_id=%s", (user["user_id"],))
        
        # 3. Mark all commissions in that period as 'Paid'
        # First get the period
        cursor.execute("SELECT billing_period_start, billing_period_end FROM weekly_invoices WHERE invoice_id=%s", (data.invoice_id,))
        inv = cursor.fetchone()
        if inv:
            cursor.execute("""
                UPDATE commissions SET status='Paid', settled_date=CURRENT_TIMESTAMP 
                WHERE vendor_id=%s AND status='Pending' AND created_at BETWEEN %s AND %s
            """, (user["user_id"], inv['billing_period_start'], inv['billing_period_end']))
        
        conn.commit()
        cursor.close()
        return {"status": "success", "message": "Commission paid successfully. Account status restored."}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

def check_customer(user=Depends(get_current_user_from_cookie)):
    if user["role"] != "Customer":
        raise HTTPException(status_code=403, detail="Forbidden")
    return user


def finalize_order(cust_id, delivery_address, payment_method, payment_status, txn_id,
                   background_tasks=None):
    """
    Common logic to move items from cart to orders and record payments.
    Accepts optional BackgroundTasks for async email sending.
    """
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            """
            SELECT c.*, COALESCE(p.vendor_id, s.vendor_id) as vendor_id,
                         COALESCE(p.price,     s.price)     as price,
                         COALESCE(p.name,      s.name)      as item_name
            FROM Cart c
            LEFT JOIN Products p ON c.item_type='Product' AND c.item_id=p.product_id
            LEFT JOIN Services s ON c.item_type='Service' AND c.item_id=s.service_id
            WHERE c.customer_id=%s
            """,
            (cust_id,)
        )
        cart_items = cursor.fetchall()

        if not cart_items:
            return False, "Cart is empty"

        for item in cart_items:
            base_amount = float(item["price"]) * item["quantity"]
            gst_amount = round(base_amount * 0.18, 2)
            
            # Dynamic commission rate from platform settings
            comm_key = 'product_commission_pct' if item['item_type'] == 'Product' else 'service_commission_pct'
            commission_rate = get_platform_setting(comm_key, 3.0)
            
            commission_amount = round(base_amount * float(commission_rate) / 100, 2)
            total_amount = round(base_amount + gst_amount + commission_amount, 2)
            
            order_status = 'Pending' if payment_method == 'COD' else 'Processing'

            # Credit system due dates if PayLater
            stage1_due = None
            stage2_due = None
            if payment_method == 'PayLater':
                from datetime import timedelta
                stage1_due = (datetime.now() + timedelta(days=7)).date()
                stage2_due = (datetime.now() + timedelta(days=14)).date()

            cursor.execute(
                """INSERT INTO Orders 
                   (customer_id, vendor_id, order_type, item_id, quantity, amount, base_amount, gst_amount, commission_amount, total_amount, status, delivery_address, payment_method, credit_stage1_due, credit_stage2_due) 
                   VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                   RETURNING order_id""",
                (cust_id, item["vendor_id"], item["item_type"], item["item_id"], item["quantity"],
                 total_amount, base_amount, gst_amount, commission_amount, total_amount,
                 order_status, delivery_address, payment_method, stage1_due, stage2_due)
            )
            order_db_id = cursor.fetchone()['order_id']
            
            cursor.execute(
                "INSERT INTO Payments (txn_id, order_id, amount, status) VALUES (%s,%s,%s,%s)",
                (txn_id, order_db_id, total_amount, payment_status)
            )
            comm_status = 'Settled' if payment_status == 'Completed' else 'Pending'
            cursor.execute(
                """INSERT INTO commissions (order_id, vendor_id, commission_amount, commission_rate, status) 
                   VALUES (%s,%s,%s,%s,%s)""",
                (order_db_id, item["vendor_id"], commission_amount, commission_rate, comm_status)
            )

        cursor.execute("DELETE FROM Cart WHERE customer_id=%s", (cust_id,))
        conn.commit()

        # ── SEND EMAILS (non-blocking via BackgroundTasks if available) ──
        try:
            # 1. Customer Confirmation
            cursor.execute("SELECT name, email FROM Users WHERE user_id=%s", (cust_id,))
            user_data = cursor.fetchone()
            if user_data:
                prefs = get_notification_preferences(cust_id)
                if prefs.get('order_alerts', True):
                    order_summary = {
                        "order_id": txn_id,
                        "total_amount": sum(float(i["price"]) * i["quantity"] for i in cart_items), # Simplified total
                        "status": "Confirmed",
                        "customer_name": user_data['name'],
                        "date": datetime.now().strftime("%d %b %Y %H:%M")
                    }
                    if background_tasks:
                        background_tasks.add_task(send_order_confirmation, user_data['email'], user_data['name'], order_summary)
                    else:
                        send_order_confirmation(user_data['email'], user_data['name'], order_summary)

            # 2. Vendor Notifications (One per vendor in the cart)
            # Group items by vendor
            from collections import defaultdict
            vendor_groups = defaultdict(list)
            for item in cart_items:
                vendor_groups[item['vendor_id']].append(item)
            
            for v_id, v_items in vendor_groups.items():
                cursor.execute("SELECT name, email FROM Users WHERE user_id=%s", (v_id,))
                vendor_data = cursor.fetchone()
                if vendor_data:
                    # Notify vendor of this specific sub-order
                    for vi in v_items:
                        v_order_info = {
                            "order_id": txn_id,
                            "item_name": vi["name"],
                            "quantity": vi["quantity"],
                            "amount": vi["price"] * vi["quantity"],
                            "vendor_name": vendor_data['name']
                        }
                        if background_tasks:
                            background_tasks.add_task(send_vendor_notification_email, vendor_data['email'], v_order_info)
                        else:
                            send_vendor_notification_email(vendor_data['email'], v_order_info)

        except Exception as email_err:
            print(f"[payment] Could not queue order notifications: {email_err}")

        cursor.close()
        return True, "Orders placed successfully"
    except Exception as e:
        conn.rollback()
        return False, str(e)
    finally:
        conn.close()


# ── 2. Verify Razorpay Payment Signature & Finalize ──────────────────────────
class VerifyPaymentRequest(BaseModel):
    razorpay_order_id:   str
    razorpay_payment_id: str
    razorpay_signature:  str
    delivery_address:    str = ""
    payment_method:      str = "Card"

@router.post("/verify")
def verify_razorpay_payment(data: VerifyPaymentRequest, user=Depends(check_customer),
                            background_tasks: BackgroundTasks = None):
    body         = f"{data.razorpay_order_id}|{data.razorpay_payment_id}"
    expected_sig = hmac.new(
        RAZORPAY_KEY_SECRET.encode("utf-8"),
        body.encode("utf-8"),
        hashlib.sha256
    ).hexdigest()

    if expected_sig != data.razorpay_signature:
        raise HTTPException(status_code=400, detail="Payment signature verification failed.")

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT customer_id FROM Customers WHERE customer_id=%s", (user["user_id"],))
    row = cursor.fetchone()
    cursor.close()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="Customer not found")

    success, message = finalize_order(
        row["customer_id"],
        data.delivery_address,
        data.payment_method,
        'Completed',
        data.razorpay_payment_id,
        background_tasks=background_tasks
    )

    if success:
        return {"status": "success", "message": message}
    else:
        raise HTTPException(status_code=500, detail=message)


# ── 3. Place Order Offline (COD / Pay Later) ─────────────────────────────────
class OfflineOrderRequest(BaseModel):
    delivery_address: str
    payment_method:   str # 'COD'

@router.post("/place_order_offline")
def place_order_offline(data: OfflineOrderRequest, user=Depends(check_customer),
                        background_tasks: BackgroundTasks = None):
    if data.payment_method != 'COD':
        raise HTTPException(status_code=400, detail="Invalid offline payment method.")

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT customer_id FROM Customers WHERE customer_id=%s", (user["user_id"],))
    row = cursor.fetchone()
    cursor.close()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="Customer not found")

    import random, string
    txn_id = f"COD-" + ''.join(random.choices(string.ascii_uppercase + string.digits, k=10))

    success, message = finalize_order(
        row["customer_id"],
        data.delivery_address,
        data.payment_method,
        'Pending',
        txn_id,
        background_tasks=background_tasks
    )

    if success:
        return {"status": "success", "message": message}
    else:
        raise HTTPException(status_code=500, detail=message)


# ── 4. Place Order Pay Later ─────────────────────────────────────────────────
class PayLaterOrderRequest(BaseModel):
    delivery_address: str

@router.post("/place_order_pay_later")
def place_order_pay_later(data: PayLaterOrderRequest, user=Depends(check_customer),
                         background_tasks: BackgroundTasks = None):
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        # 1. Fetch customer's credit details
        cursor.execute("""
            SELECT credit_limit, credit_used, credit_status, credit_suspended_until 
            FROM Customers WHERE customer_id=%s
        """, (user["user_id"],))
        cust = cursor.fetchone()
        
        if not cust:
            raise HTTPException(status_code=404, detail="Customer record not found.")

        from datetime import date
        today = date.today()
        
        # 2. Check suspension
        if cust['credit_status'] == 'Suspended':
            if cust['credit_suspended_until'] and cust['credit_suspended_until'] > today:
                raise HTTPException(status_code=403, detail=f"Credit suspended until {cust['credit_suspended_until']}")
            else:
                # Suspension expired -> auto-lift
                default_limit = get_platform_setting('default_credit_limit', 5000)
                cursor.execute("""
                    UPDATE Customers SET credit_status='None', credit_limit=%s 
                    WHERE customer_id=%s
                """, (default_limit, user["user_id"]))
                cust['credit_status'] = 'None'
                cust['credit_limit'] = default_limit

        # 3. Check if credit is enabled
        if float(cust['credit_limit'] or 0) <= 0:
            raise HTTPException(status_code=403, detail="Pay Later is not enabled for your account.")

        # 4. Calculate cart total
        cursor.execute("""
            SELECT c.quantity, c.item_type, COALESCE(p.price, s.price) as price
            FROM Cart c
            LEFT JOIN Products p ON c.item_type='Product' AND c.item_id=p.product_id
            LEFT JOIN Services s ON c.item_type='Service' AND c.item_id=s.service_id
            WHERE c.customer_id=%s
        """, (user["user_id"],))
        items = cursor.fetchall()
        
        if not items:
             raise HTTPException(status_code=400, detail="Cart is empty.")

        total_order_amount = 0
        for item in items:
            item_base = float(item['price']) * item['quantity']
            item_gst = round(item_base * 0.18, 2)
            comm_key = 'product_commission_pct' if item['item_type'] == 'Product' else 'service_commission_pct'
            rate = float(get_platform_setting(comm_key, 3.0))
            item_comm = round(item_base * rate / 100, 2)
            total_order_amount += (item_base + item_gst + item_comm)

        total_order_amount = round(total_order_amount, 2)

        # 5. Check credit limit
        if float(cust['credit_used'] or 0) + total_order_amount > float(cust['credit_limit']):
            available = float(cust['credit_limit']) - float(cust['credit_used'] or 0)
            raise HTTPException(status_code=403, detail=f"Exceeds credit limit. Available: ₹{max(0, available)}")

        # 6. Finalize order
        import random, string
        txn_id = f"CRD-" + ''.join(random.choices(string.ascii_uppercase + string.digits, k=10))

        success, message = finalize_order(
            user["user_id"],
            data.delivery_address,
            'PayLater',
            'Pending',
            txn_id,
            background_tasks=background_tasks
        )

        if success:
            # 7. Update customer credit used
            cursor.execute("""
                UPDATE Customers 
                SET credit_used = credit_used + %s, credit_status = 'Active' 
                WHERE customer_id = %s
                RETURNING credit_used, credit_limit
            """, (total_order_amount, user["user_id"]))
            after = cursor.fetchone()
            
            # 8. Insert transaction record
            cursor.execute("SELECT order_id FROM Orders WHERE customer_id=%s AND payment_method='PayLater' ORDER BY created_at DESC LIMIT 1", (user["user_id"],))
            last_order = cursor.fetchone()
            order_id = last_order['order_id'] if last_order else None

            cursor.execute("""
                INSERT INTO credit_transactions (customer_id, order_id, txn_type, amount, credit_used_after, credit_limit_after, notes)
                VALUES (%s, %s, 'Debit', %s, %s, %s, %s)
            """, (user["user_id"], order_id, total_order_amount, after['credit_used'], after['credit_limit'], f"Order #{order_id} via Pay Later"))
            
            conn.commit()
            return {"status": "success", "message": "Order placed successfully using credit."}
        else:
            raise HTTPException(status_code=500, detail=message)

    except HTTPException:
        raise
    except Exception as e:
        if 'conn' in locals() and conn: conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if 'conn' in locals() and conn: conn.close()


# ── 4. Verify Settlement (Paying for Credit Orders) ──────────────────────────
class VerifySettlementRequest(BaseModel):
    order_id:            int
    razorpay_order_id:   str
    razorpay_payment_id: str
    razorpay_signature:  str

@router.post("/verify_settlement")
def verify_settlement(data: VerifySettlementRequest, user=Depends(check_customer)):
    """
    Called after settling an unpaid order (Pay Later) via Razorpay.
    """
    body        = f"{data.razorpay_order_id}|{data.razorpay_payment_id}"
    expected_sig= hmac.new(
        RAZORPAY_KEY_SECRET.encode("utf-8"),
        body.encode("utf-8"),
        hashlib.sha256
    ).hexdigest()

    if expected_sig != data.razorpay_signature:
        raise HTTPException(status_code=400, detail="Signature failed.")

    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        # Ensure the order belongs to this customer
        cursor.execute("SELECT order_id, payment_method, customer_id FROM Orders WHERE order_id=%s AND customer_id=%s", (data.order_id, user["user_id"]))
        order = cursor.fetchone()
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")

        # Update Payments table
        cursor.execute(
            "UPDATE Payments SET status='Completed', txn_id=%s WHERE order_id=%s",
            (data.razorpay_payment_id, data.order_id)
        )
        # Also update commissions to match
        cursor.execute("UPDATE commissions SET status='Paid' WHERE order_id=%s", (data.order_id,))
        
        conn.commit()
        cursor.close()
        
        
        return {"status": "success", "message": "Payment settled successfully"}
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


