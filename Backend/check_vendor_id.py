from database import get_db_connection
from dotenv import load_dotenv
load_dotenv()

try:
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT u.user_id, u.email, u.name, v.vendor_id FROM Users u LEFT JOIN Vendors v ON u.user_id = v.vendor_id WHERE u.role='Vendor'")
    rows = cursor.fetchall()
    for r in rows:
        print(r)
    cursor.close()
    conn.close()
except Exception as e:
    print(f"ERROR: {e}")
