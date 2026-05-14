import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.environ.get("DATABASE_URL")

def super_migrate():
    if not DATABASE_URL:
        print("ERROR: DATABASE_URL not found.")
        return

    try:
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()

        print("Ensuring all columns exist in Orders table...")
        
        # Add columns one by one with IF NOT EXISTS logic where possible or handle exceptions
        columns_to_add = [
            ("base_amount", "DECIMAL(12,2)"),
            ("gst_amount", "DECIMAL(12,2)"),
            ("commission_amount", "DECIMAL(12,2)"),
            ("total_amount", "DECIMAL(12,2)"),
            ("delivery_address", "TEXT"),
            ("payment_method", "VARCHAR(20)"),
            ("bill_type", "VARCHAR(10) DEFAULT 'Non-GST'"),
            ("bill_file_url", "TEXT"),
            ("credit_stage1_due", "DATE"),
            ("credit_stage2_due", "DATE"),
            ("vendor_credited", "BOOLEAN DEFAULT FALSE")
        ]

        for col_name, col_type in columns_to_add:
            try:
                cursor.execute(f"ALTER TABLE orders ADD COLUMN {col_name} {col_type}")
                print(f"  Added column: {col_name}")
            except Exception as e:
                if "already exists" in str(e).lower():
                    print(f"  Column {col_name} already exists.")
                else:
                    print(f"  Error adding {col_name}: {e}")
                conn.rollback()
            else:
                conn.commit()

        print("\nEnsuring all columns exist in Customers table...")
        cust_columns = [
            ("credit_limit", "DECIMAL(12,2) DEFAULT 0.00"),
            ("credit_used", "DECIMAL(12,2) DEFAULT 0.00"),
            ("credit_status", "VARCHAR(20) DEFAULT 'None'"),
            ("credit_suspended_until", "DATE"),
            ("credit_base_limit", "DECIMAL(12,2) DEFAULT 0.00")
        ]

        for col_name, col_type in cust_columns:
            try:
                cursor.execute(f"ALTER TABLE customers ADD COLUMN {col_name} {col_type}")
                print(f"  Added column: {col_name}")
            except Exception as e:
                if "already exists" in str(e).lower():
                    print(f"  Column {col_name} already exists.")
                else:
                    print(f"  Error adding {col_name}: {e}")
                conn.rollback()
            else:
                conn.commit()

        cursor.close()
        conn.close()
        print("\nSuper migration complete!")

    except Exception as e:
        print(f"CRITICAL ERROR: {e}")

if __name__ == "__main__":
    super_migrate()
