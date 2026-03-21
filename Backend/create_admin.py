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

def create_admin():
    try:
        conn = mysql.connector.connect(**dbconfig)
        cursor = conn.cursor()
        
        email = "admin@coneco.com"
        name = "System Admin"
        phone = "0000000000"
        hashed = hash_password("admin123")
        role = "Admin"
        
        # Check if exists
        cursor.execute("SELECT user_id FROM Users WHERE email=%s", (email,))
        if cursor.fetchone():
            print(f"Admin {email} already exists.")
        else:
            cursor.execute("INSERT INTO Users (name, email, phone, password_hash, role) VALUES (%s, %s, %s, %s, %s)",
                           (name, email, phone, hashed, role))
            conn.commit()
            print(f"✅ Created admin user: {email} / admin123")
            
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    create_admin()
