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

        # Create ServiceMilestones table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS ServiceMilestones (
                milestone_id SERIAL PRIMARY KEY,
                order_id INT REFERENCES Orders(order_id) ON DELETE CASCADE,
                title VARCHAR(200) NOT NULL,
                description TEXT,
                scheduled_date DATE,
                payment_percentage INT NOT NULL,
                payment_amount DECIMAL(10,2),
                status VARCHAR(30) DEFAULT 'Pending', -- 'Pending', 'In Progress', 'Done', 'Approved'
                vendor_note TEXT,
                customer_note TEXT,
                completed_at TIMESTAMP,
                approved_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        print("ServiceMilestones table created.")

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
