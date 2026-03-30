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

def inspect_users():
    try:
        conn = mysql.connector.connect(**dbconfig)
        cursor = conn.cursor(dictionary=True)
        cursor.execute("DESCRIBE Users")
        columns = [c['Field'] for c in cursor.fetchall()]
        has_email_verified = 'email_verified' in columns
        
        query = f"SELECT user_id, name, email, phone, role{', email_verified' if has_email_verified else ''} FROM Users"
        cursor.execute(query)
        users = cursor.fetchall()
        
        print(f"DEBUG: Found {len(users)} users")
        for u in users:
            verified = u.get('email_verified', 'N/A')
            print(f"USER: ID={u['user_id']} Email={u['email']} Phone={u['phone']} Role={u['role']} Verified={verified} Name={u['name']}")
            
            if u['role'] == 'Vendor':
                cursor.execute("SELECT verification_status FROM Vendors WHERE vendor_id=%s", (u['user_id'],))
                v = cursor.fetchone()
                if v:
                    print(f"  VENDOR_STATUS: {v['verification_status']}")
            
            if u['role'] == 'Customer':
                cursor.execute("SELECT verification_status FROM Customers WHERE customer_id=%s", (u['user_id'],))
                c = cursor.fetchone()
                if c:
                    print(f"  CUSTOMER_STATUS: {c['verification_status']}")
        
        conn.close()
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    inspect_users()
