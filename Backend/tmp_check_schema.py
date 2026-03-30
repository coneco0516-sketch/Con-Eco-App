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

def check_users_schema():
    try:
        conn = mysql.connector.connect(**dbconfig)
        cursor = conn.cursor(dictionary=True)
        cursor.execute("DESCRIBE Users")
        columns = cursor.fetchall()
        print("COLUMNS IN Users:")
        for c in columns:
            print(f"- {c['Field']}: {c['Type']} (Null: {c['Null']}, Key: {c['Key']}, Default: {c['Default']})")
        conn.close()
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    check_users_schema()
