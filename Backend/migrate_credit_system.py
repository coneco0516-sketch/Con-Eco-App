import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.environ.get("DATABASE_URL")

def migrate():
    if not DATABASE_URL:
        print("ERROR: DATABASE_URL not found in environment variables.")
        return

    try:
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()

        print("Migrating Customers table...")
        cursor.execute("""
            ALTER TABLE customers
            ADD COLUMN IF NOT EXISTS credit_limit           DECIMAL(12,2) DEFAULT 0.00,
            ADD COLUMN IF NOT EXISTS credit_used            DECIMAL(12,2) DEFAULT 0.00,
            ADD COLUMN IF NOT EXISTS credit_status          VARCHAR(20) DEFAULT 'None',
            ADD COLUMN IF NOT EXISTS credit_suspended_until  DATE DEFAULT NULL,
            ADD COLUMN IF NOT EXISTS credit_base_limit       DECIMAL(12,2) DEFAULT 0.00;
        """)

        print("Migrating Orders table...")
        cursor.execute("""
            ALTER TABLE orders
            ADD COLUMN IF NOT EXISTS credit_stage1_due  DATE DEFAULT NULL,
            ADD COLUMN IF NOT EXISTS credit_stage2_due  DATE DEFAULT NULL,
            ADD COLUMN IF NOT EXISTS credit_tier        VARCHAR(20) DEFAULT NULL;
        """)

        print("Creating credit_transactions table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS credit_transactions (
                credit_txn_id     SERIAL PRIMARY KEY,
                customer_id       INT REFERENCES customers(customer_id) ON DELETE CASCADE,
                order_id          INT REFERENCES orders(order_id) ON DELETE SET NULL,
                txn_type          VARCHAR(20) CHECK (txn_type IN ('Debit', 'Repayment', 'Penalty', 'Reward', 'Adjustment')),
                amount            DECIMAL(12,2) NOT NULL,
                credit_used_after  DECIMAL(12,2) NOT NULL,
                credit_limit_after DECIMAL(12,2) NOT NULL,
                notes             TEXT,
                created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)

        print("Inserting platform setting for default_credit_limit...")
        cursor.execute("""
            INSERT INTO platformsettings (setting_key, setting_value)
            VALUES ('default_credit_limit', '5000')
            ON CONFLICT (setting_key) DO NOTHING;
        """)

        conn.commit()
        print("Migration completed successfully!")

    except Exception as e:
        print(f"Migration failed: {e}")
        if 'conn' in locals():
            conn.rollback()
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    migrate()
