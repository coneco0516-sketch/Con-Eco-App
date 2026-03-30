import mysql.connector
import os
from dotenv import load_dotenv

load_dotenv()

dbconfig = {
    "database": os.environ.get("DB_NAME"),
    "user": os.environ.get("DB_USER"),
    "password": os.environ.get("DB_PASS"),
    "host": os.environ.get("DB_HOST"),
    "port": int(os.environ.get("DB_PORT", 3306))
}

def inspect_users_detailed():
    try:
        conn = mysql.connector.connect(**dbconfig)
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT user_id, name, email, phone, role, email_verified FROM Users")
        users = cursor.fetchall()
        
        print(f"DEBUG: Found {len(users)} users")
        for u in users:
            print(f"--- USER ID: {u['user_id']} ---")
            print(f"Name: {u['name']}")
            print(f"Email: {u['email']}")
            print(f"Phone: {u['phone']}")
            print(f"Role: {u['role']}")
            print(f"Email Verified: {u['email_verified']}")
            
            if u['role'] == 'Vendor':
                cursor.execute("SELECT verification_status FROM Vendors WHERE vendor_id=%s", (u['user_id'],))
                v = cursor.fetchone()
                if v: print(f"Vendor Status: {v['verification_status']}")
            elif u['role'] == 'Customer':
                cursor.execute("SELECT verification_status FROM Customers WHERE customer_id=%s", (u['user_id'],))
                c = cursor.fetchone()
                if c: print(f"Customer Status: {c['verification_status']}")
        
        conn.close()
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    inspect_users_detailed()
