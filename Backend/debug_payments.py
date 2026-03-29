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

def default(obj):
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError

conn = mysql.connector.connect(**config)
cursor = conn.cursor(dictionary=True)

# 1. Check if the complex join works
sql = """
SELECT DATE_FORMAT(p.transaction_date, '%d %b %Y') as date, p.txn_id, u_cust.name as customer_name,
       v.company_name as vendor_name, p.amount, (p.amount - o.base_amount) as commission, p.status, o.payment_method, COALESCE(o.vendor_credited, 0) as vendor_credited, o.order_id, o.base_amount
FROM Payments p
JOIN Orders o ON p.order_id = o.order_id
JOIN Customers c ON o.customer_id = c.customer_id
JOIN Users u_cust ON c.customer_id = u_cust.user_id
JOIN Vendors v ON o.vendor_id = v.vendor_id
"""
cursor.execute(sql)
txns = cursor.fetchall()
print(f"Transactions found: {len(txns)}")
for t in txns:
    print(t)

# 2. Check stats query
cursor.execute("SELECT SUM(p.amount) as s FROM Payments p JOIN Orders o ON p.order_id = o.order_id WHERE p.status IN ('Completed', 'Paid')")
res = cursor.fetchone()
print(f"Stats Revenue: {res['s']}")

cursor.close()
conn.close()
