import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.environ.get("DATABASE_URL")

def run_migration():
    if not DATABASE_URL:
        print("DATABASE_URL not found.")
        return

    try:
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()

        # Create ProjectSites table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS ProjectSites (
                site_id SERIAL PRIMARY KEY,
                customer_id INT REFERENCES Customers(customer_id),
                site_name VARCHAR(200) NOT NULL,
                site_address TEXT,
                city VARCHAR(100),
                state VARCHAR(100),
                budget DECIMAL(12,2),
                status VARCHAR(30) DEFAULT 'Active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        print("ProjectSites table created.")

        # Check if site_id column exists in Orders table
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='orders' AND column_name='site_id';
        """)
        if not cursor.fetchone():
            cursor.execute("""
                ALTER TABLE Orders ADD COLUMN site_id INT REFERENCES ProjectSites(site_id);
            """)
            print("Added site_id column to Orders table.")
        else:
            print("site_id column already exists in Orders table.")

        conn.commit()
        print("Migration successful.")
        
    except Exception as e:
        print(f"Error during migration: {e}")
    finally:
        if conn:
            cursor.close()
            conn.close()

if __name__ == "__main__":
    run_migration()
