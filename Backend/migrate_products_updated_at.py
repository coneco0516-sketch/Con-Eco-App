import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.environ.get("DATABASE_URL")

def migrate():
    if not DATABASE_URL:
        print("Error: DATABASE_URL not found in .env file.")
        return

    try:
        conn = psycopg2.connect(DATABASE_URL)
        conn.autocommit = True
        cursor = conn.cursor()

        print("Connected to database. Adding updated_at to products table...")
        
        # Check if column exists
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='products' and column_name='updated_at';
        """)
        
        if cursor.fetchone() is None:
            cursor.execute("ALTER TABLE products ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;")
            print("Column 'updated_at' added to 'products' table.")
            
            # Optionally update existing rows to have updated_at equal to created_at
            cursor.execute("UPDATE products SET updated_at = created_at WHERE updated_at IS NULL;")
            print("Set existing products updated_at to their created_at time.")
        else:
            print("Column 'updated_at' already exists in 'products' table.")

        cursor.close()
        conn.close()
        print("Migration complete.")
    except Exception as e:
        print(f"Error during migration: {e}")

if __name__ == "__main__":
    migrate()
