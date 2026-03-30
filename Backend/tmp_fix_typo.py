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

def fix_typo():
    try:
        conn = mysql.connector.connect(**dbconfig)
        cursor = conn.cursor()
        
        # Check if tmarennavar093@gamil.com exists
        cursor.execute("SELECT user_id, email FROM Users WHERE email = 'tmarennavar093@gamil.com'")
        user = cursor.fetchone()
        
        if user:
            print(f"Found user with typo: {user}")
            # Fix it to gmail.com
            cursor.execute("UPDATE Users SET email = 'tmarennavar093@gmail.com' WHERE user_id = %s", (user[0],))
            conn.commit()
            print("Successfully updated email to tmarennavar093@gmail.com")
        else:
            print("No user found with tmarennavar093@gamil.com")
            
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    fix_typo()
