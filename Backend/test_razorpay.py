import razorpay
import os
from dotenv import load_dotenv

load_dotenv()

KEY_ID = "rzp_test_Sp7ExHtOeBkAoT"
KEY_SECRET = "9S6614Am4ad1pT8fwQFzyEPJ"

try:
    client = razorpay.Client(auth=(KEY_ID, KEY_SECRET))
    order = client.order.create({
        "amount": 100,
        "currency": "INR",
        "receipt": "test_receipt"
    })
    print(f"SUCCESS: Order ID {order['id']}")
except Exception as e:
    print(f"FAILED: {str(e)}")
