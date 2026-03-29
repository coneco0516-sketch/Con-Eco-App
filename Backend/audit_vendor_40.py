import mysql.connector
import os
from dotenv import load_dotenv
from decimal import Decimal

load_dotenv()

config = {
    'host': os.environ.get('DB_HOST'),
    'user': os.environ.get('DB_USER'),
    'password': os.environ.get('DB_PASS'),
    'database': os.environ.get('DB_NAME'),
    'port': int(os.environ.get('DB_PORT', 3306))
}

conn = mysql.connector.connect(**config)
cursor = conn.cursor(dictionary=True)

vendor_id = 40 # Based on earlier check

def float_val(v):
    return float(v) if v is not None else 0

# 1. Stats verification
cursor.execute("SELECT wallet_balance FROM Vendors WHERE vendor_id=%s", (vendor_id,))
v_res = cursor.fetchone()
print(f"Wallet: {v_res}")

cursor.execute("""
    SELECT SUM(p.amount) as s 
    FROM Orders o 
    JOIN Payments p ON o.order_id = p.order_id 
    WHERE o.vendor_id=%s AND p.status IN ('Completed', 'Paid') AND o.payment_method IN ('COD', 'Pay Later (Cash)')
""", (vendor_id,))
cod_res = cursor.fetchone()
print(f"COD Total: {cod_res}")

cursor.execute("""
    SELECT SUM(o.base_amount) as s 
    FROM Orders o 
    JOIN Payments p ON o.order_id = p.order_id 
    WHERE o.vendor_id=%s AND p.status IN ('Completed', 'Paid') AND o.payment_method IN ('COD', 'Pay Later (Cash)')
""", (vendor_id,))
cod_net_res = cursor.fetchone()
print(f"COD Net (Vendor portion): {cod_net_res}")

# 2. Payment verification
cursor.execute("""
    SELECT p.txn_id, p.amount, p.status, o.payment_method, o.vendor_credited, o.order_id, o.base_amount
    FROM Payments p
    JOIN Orders o ON p.order_id = o.order_id
    WHERE o.vendor_id=%s
""", (vendor_id,))
print("\n--- PAYMENTS RAW ---")
for p in cursor.fetchall():
    print(p)

cursor.close()
conn.close()
