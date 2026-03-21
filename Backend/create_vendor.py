import mysql.connector
import os
import bcrypt
from dotenv import load_dotenv

load_dotenv()

dbconfig = {
    "database": os.environ.get("DB_NAME"),
    "user": os.environ.get("DB_USER"),
    "password": os.environ.get("DB_PASS"),
    "host": os.environ.get("DB_HOST"),
    "port": int(os.environ.get("DB_PORT", 3306))
}

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def create_vendor():
    try:
        conn = mysql.connector.connect(**dbconfig)
        cursor = conn.cursor()
        
        email = "vendor@coneco.com"
        name = "Test Vendor"
        phone = "1111111111"
        hashed = hash_password("vendor123")
        role = "Vendor"
        
        # Check if exists
        cursor.execute("SELECT user_id FROM Users WHERE email=%s", (email,))
        existing = cursor.fetchone()
        if existing:
            user_id = existing[0]
            print(f"Vendor {email} already exists.")
        else:
            cursor.execute("INSERT INTO Users (name, email, phone, password_hash, role) VALUES (%s, %s, %s, %s, %s)",
                           (name, email, phone, hashed, role))
            user_id = cursor.lastrowid
            
            # Add to Vendors table
            cursor.execute("INSERT INTO Vendors (vendor_id, company_name, city, state, verification_status) VALUES (%s, %s, %s, %s, %s)",
                           (user_id, "ConEco Vendor Store", "Sample City", "Sample State", "Verified"))
            conn.commit()
            print(f"✅ Created vendor user: {email} / vendor123")
            
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    create_vendor()
