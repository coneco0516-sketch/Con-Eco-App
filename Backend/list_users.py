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

def list_users():
    try:
        conn = mysql.connector.connect(**dbconfig)
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT user_id, name, email, role FROM Users")
        users = cursor.fetchall()
        print("USERS IN DATABASE:")
        for u in users:
            print(f"- {u['email']} | Role: {u['role']} | Name: {u['name']}")
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    list_users()
