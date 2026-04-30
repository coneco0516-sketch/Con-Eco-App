import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.environ.get("DATABASE_URL")

def migrate_google_auth():
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()
        
        print("Starting migration for Google Auth support...")
        
        # 1. Make password_hash nullable (Google users don't have a local password initially)
        cursor.execute("ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL")
        print("Success: password_hash is now nullable.")
        
        # 2. Make phone nullable (Google might not provide it)
        cursor.execute("ALTER TABLE users ALTER COLUMN phone DROP NOT NULL")
        print("Success: phone is now nullable.")
        
        conn.commit()
        cursor.close()
        conn.close()
        print("Migration complete!")
        
    except Exception as e:
        print(f"Error during migration: {e}")

if __name__ == "__main__":
    migrate_google_auth()
