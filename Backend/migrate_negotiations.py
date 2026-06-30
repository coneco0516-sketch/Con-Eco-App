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

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS NegotiationMessages (
                msg_id SERIAL PRIMARY KEY,
                order_id INT REFERENCES Orders(order_id) ON DELETE CASCADE,
                sender_role VARCHAR(20) NOT NULL,      -- 'Customer' or 'Vendor'
                sender_id INT NOT NULL,
                message TEXT,
                offer_price DECIMAL(10,2),             -- NULL for plain messages; populated for price offers
                is_accepted BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        print("NegotiationMessages table created.")

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
