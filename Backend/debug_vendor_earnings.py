import mysql.connector
import os
from dotenv import load_dotenv

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

vendor_id = 40 # Based on my earlier check

sql_payments = """
    SELECT DATE_FORMAT(o.created_at, '%%d %%b %%Y') as date, 
           CONCAT('Order #', o.order_id) as description, 
           p.amount as gross,
           (o.amount - o.base_amount) as commission,
           o.base_amount as net,
           p.status,
           o.created_at as raw_date
    FROM Payments p
    JOIN Orders o ON p.order_id = o.order_id
    WHERE o.vendor_id=%s 
      AND (o.payment_method IN ('COD', 'Pay Later (Cash)') OR COALESCE(o.vendor_credited, 0) = 1)
"""

sql_payouts = """
    SELECT DATE_FORMAT(created_at, '%%d %%b %%Y') as date,
           'Bank Withdrawal' as description,
           amount as gross,
           0 as commission,
           -amount as net,
           status,
           created_at as raw_date
    FROM Payouts
    WHERE vendor_id=%s
"""

sql_combined = f"""
    SELECT * FROM (
        {sql_payments}
        UNION ALL
        {sql_payouts}
    ) as combined
    ORDER BY raw_date DESC
"""

try:
    cursor.execute(sql_combined, (vendor_id, vendor_id))
    print("Combined SQL Works!")
    for row in cursor.fetchall():
        print(row)
except Exception as e:
    print(f"Error in Combined SQL: {e}")
    
cursor.close()
conn.close()
