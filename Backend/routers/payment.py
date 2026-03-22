import os
import hmac
import hashlib
import razorpay
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from dotenv import load_dotenv
from database import get_db_connection
from routers.auth import get_current_user_from_cookie

load_dotenv()

RAZORPAY_KEY_ID     = os.environ.get("RAZORPAY_KEY_ID", "")
RAZORPAY_KEY_SECRET = os.environ.get("RAZORPAY_KEY_SECRET", "")

router = APIRouter()


def check_customer(user=Depends(get_current_user_from_cookie)):
    if user["role"] != "Customer":
        raise HTTPException(status_code=403, detail="Forbidden")
    return user


# ── 1. Create Razorpay Order ─────────────────────────────────────────────────
class CreateOrderRequest(BaseModel):
    amount_paise: int   # Amount in paise (₹1 = 100 paise)
    currency: str = "INR"

@router.post("/create_order")
def create_razorpay_order(data: CreateOrderRequest, user=Depends(check_customer)):
    """
    Called by the React Checkout page before launching the Razorpay popup.
    Returns a Razorpay 'order_id' that the frontend widget needs.
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


def finalize_order(cust_id, delivery_address, payment_method, payment_status, txn_id):
    """
    Common logic to move items from cart to orders and record payments.
    """
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        # Pull the cart
        cursor.execute(
            """
            SELECT c.*, COALESCE(p.vendor_id, s.vendor_id) as vendor_id,
                         COALESCE(p.price,     s.price)     as price
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
            # Calculate pricing with 5% platform commission
            base_amount = float(item["price"]) * item["quantity"]
            commission_rate = 5.0  # 5% platform commission
            commission_amount = round(base_amount * commission_rate / 100, 2)
            total_amount = round(base_amount + commission_amount, 2)
            
            # Insert order with commission breakdown, delivery address and payment method
            order_status = 'Pending' if payment_method in ['COD', 'Pay Later'] else 'Processing'
            if payment_method == 'Pay Later':
                order_status = 'Pending' # Credit request needs approval usually

            cursor.execute(
                """INSERT INTO Orders 
                   (customer_id, vendor_id, order_type, item_id, quantity, amount, base_amount, commission_amount, total_amount, status, delivery_address, payment_method) 
                   VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
                (cust_id, item["vendor_id"], item["item_type"], item["item_id"], item["quantity"], 
                 total_amount, base_amount, commission_amount, total_amount, order_status, delivery_address, payment_method)
            )
            order_db_id = cursor.lastrowid
            
            # Record payment with total amount
            cursor.execute(
                "INSERT INTO Payments (txn_id, order_id, amount, status) VALUES (%s,%s,%s,%s)",
                (txn_id, order_db_id, total_amount, payment_status)
            )
            
            # Track commission for financial reporting
            cursor.execute(
                """INSERT INTO commissions (order_id, vendor_id, commission_amount, commission_rate, status) 
                   VALUES (%s,%s,%s,%s,'Pending')""",
                (order_db_id, item["vendor_id"], commission_amount, commission_rate)
            )

        # Clear the cart
        cursor.execute("DELETE FROM Cart WHERE customer_id=%s", (cust_id,))
        conn.commit()
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
def verify_razorpay_payment(data: VerifyPaymentRequest, user=Depends(check_customer)):
    """
    Called after Razorpay popup completes.
    """
    # Signature verification
    body        = f"{data.razorpay_order_id}|{data.razorpay_payment_id}"
    expected_sig= hmac.new(
        RAZORPAY_KEY_SECRET.encode("utf-8"),
        body.encode("utf-8"),
        hashlib.sha256
    ).hexdigest()

    if expected_sig != data.razorpay_signature:
        raise HTTPException(status_code=400, detail="Payment signature verification failed.")

    # Get customer_id
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
        data.razorpay_payment_id
    )
    
    if success:
        return {"status": "success", "message": message}
    else:
        raise HTTPException(status_code=500, detail=message)


# ── 3. Place Order Offline (COD / Pay Later) ─────────────────────────────────
class OfflineOrderRequest(BaseModel):
    delivery_address: str
    payment_method:   str # 'COD' or 'Pay Later'

@router.post("/place_order_offline")
def place_order_offline(data: OfflineOrderRequest, user=Depends(check_customer)):
    """
    Handles COD and Pay Later (Request Credit) orders.
    """
    if data.payment_method not in ['COD', 'Pay Later']:
        raise HTTPException(status_code=400, detail="Invalid offline payment method.")

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT customer_id FROM Customers WHERE customer_id=%s", (user["user_id"],))
    row = cursor.fetchone()
    cursor.close()
    conn.close()
    
    if not row:
        raise HTTPException(status_code=404, detail="Customer not found")

    import random
    import string
    txn_id = f"{data.payment_method.upper().replace(' ', '_')}-" + ''.join(random.choices(string.ascii_uppercase + string.digits, k=10))
    
    success, message = finalize_order(
        row["customer_id"], 
        data.delivery_address, 
        data.payment_method, 
        'Pending', 
        txn_id
    )
    
    if success:
        return {"status": "success", "message": message}
    else:
        raise HTTPException(status_code=500, detail=message)
