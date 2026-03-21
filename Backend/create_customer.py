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

def create_customer():
    try:
        conn = mysql.connector.connect(**dbconfig)
        cursor = conn.cursor()
        
        email = "customer@coneco.com"
        name = "Test Customer"
        phone = "2222222222"
        hashed = hash_password("customer123")
        role = "Customer"
        
        # Check if exists
        cursor.execute("SELECT user_id FROM Users WHERE email=%s", (email,))
        existing = cursor.fetchone()
        if existing:
            user_id = existing[0]
            print(f"Customer {email} already exists.")
        else:
            cursor.execute("INSERT INTO Users (name, email, phone, password_hash, role) VALUES (%s, %s, %s, %s, %s)",
                           (name, email, phone, hashed, role))
            user_id = cursor.lastrowid
            
            # Add to Customers table
            cursor.execute("INSERT INTO Customers (customer_id, city, state, verification_status) VALUES (%s, %s, %s, %s)",
                           (user_id, "Customer City", "Customer State", "Verified"))
            conn.commit()
            print(f"✅ Created customer user: {email} / customer123")
            
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    create_customer()
