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


# ── 2. Verify Payment Signature & Finalize DB Records ────────────────────────
class VerifyPaymentRequest(BaseModel):
    razorpay_order_id:   str
    razorpay_payment_id: str
    razorpay_signature:  str

@router.post("/verify")
def verify_razorpay_payment(data: VerifyPaymentRequest, user=Depends(check_customer)):
    """
    Called by the React app after the Razorpay popup completes.
    Verifies the HMAC-SHA256 signature from Razorpay before clearing the cart.
    """
    # Signature verification ─ DO NOT skip this step in production!
    body        = f"{data.razorpay_order_id}|{data.razorpay_payment_id}"
    expected_sig= hmac.new(
        RAZORPAY_KEY_SECRET.encode("utf-8"),
        body.encode("utf-8"),
        hashlib.sha256
    ).hexdigest()

    if expected_sig != data.razorpay_signature:
        raise HTTPException(status_code=400, detail="Payment signature verification failed.")

    # Mark all cart items as orders in the database
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT customer_id FROM Customers WHERE customer_id=%s", (user["user_id"],))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Customer not found")
        cust_id = row["customer_id"]

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

        for item in cart_items:
            # Calculate pricing with 5% platform commission
            base_amount = float(item["price"]) * item["quantity"]
            commission_rate = 5.0  # 5% platform commission
            commission_amount = round(base_amount * commission_rate / 100, 2)
            total_amount = round(base_amount + commission_amount, 2)
            
            # Insert order with commission breakdown
            cursor.execute(
                """INSERT INTO Orders 
                   (customer_id, vendor_id, order_type, item_id, quantity, amount, base_amount, commission_amount, total_amount, status) 
                   VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,'Paid')""",
                (cust_id, item["vendor_id"], item["item_type"], item["item_id"], item["quantity"], 
                 total_amount, base_amount, commission_amount, total_amount)
            )
            order_db_id = cursor.lastrowid
            
            # Record payment with total amount
            cursor.execute(
                "INSERT INTO Payments (txn_id, order_id, amount, status) VALUES (%s,%s,%s,'Success')",
                (data.razorpay_payment_id, order_db_id, total_amount)
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
        return {"status": "success", "message": "Payment verified and orders placed."}
    finally:
        conn.close()
