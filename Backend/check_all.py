from database import get_db_connection
from dotenv import load_dotenv
load_dotenv()

try:
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    print("=== ALL USERS ===")
    cursor.execute("SELECT user_id, email, role FROM Users ORDER BY user_id")
    for r in cursor.fetchall():
        print(r)
    
    print("\n=== ALL VENDORS ===")
    cursor.execute("SELECT vendor_id, company_name, verification_status FROM Vendors")
    for r in cursor.fetchall():
        print(r)
    
    cursor.close()
    conn.close()
except Exception as e:
    print(f"ERROR: {e}")
