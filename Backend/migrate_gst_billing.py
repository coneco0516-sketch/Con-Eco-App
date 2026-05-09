"""
Migration: Add bill_type and bill_file_url to Orders table.
Run once: python migrate_gst_billing.py
"""
from database import get_db_connection

def migrate():
    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. Add bill_type column to Orders
    try:
        cursor.execute("ALTER TABLE Orders ADD COLUMN bill_type VARCHAR(10) DEFAULT 'Non-GST' CHECK (bill_type IN ('GST', 'Non-GST'))")
        conn.commit()
        print("✅ Added 'bill_type' column to Orders table.")
    except Exception as e:
        print(f"  Orders.bill_type error: {e}")

    # 2. Add bill_file_url column to Orders
    try:
        cursor.execute("ALTER TABLE Orders ADD COLUMN bill_file_url TEXT DEFAULT NULL")
        conn.commit()
        print("✅ Added 'bill_file_url' column to Orders table.")
    except Exception as e:
        print(f"  Orders.bill_file_url error: {e}")

    cursor.close()
    conn.close()
    print("\nMigration complete.")

if __name__ == "__main__":
    migrate()
