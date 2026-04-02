"""
Migration: Add GSTIN to Vendors table and GST amount tracking to weekly_invoices.
Run once: python migrate_gst.py
"""
from database import get_db_connection

def migrate():
    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. Add gstin column to Vendors (vendors are GST-registered in India)
    try:
        cursor.execute("ALTER TABLE Vendors ADD COLUMN gstin VARCHAR(20) DEFAULT NULL")
        conn.commit()
        print("✅ Added 'gstin' column to Vendors table.")
    except Exception as e:
        print(f"  Vendors.gstin: {e}")

    # 2. Add gst_amount column to weekly_invoices so we track GST charged
    try:
        cursor.execute("ALTER TABLE weekly_invoices ADD COLUMN gst_amount DECIMAL(10,2) DEFAULT 0.00")
        conn.commit()
        print("✅ Added 'gst_amount' column to weekly_invoices table.")
    except Exception as e:
        print(f"  weekly_invoices.gst_amount: {e}")

    # 3. Add total_with_gst column to track the total amount including GST
    try:
        cursor.execute("ALTER TABLE weekly_invoices ADD COLUMN total_with_gst DECIMAL(10,2) DEFAULT 0.00")
        conn.commit()
        print("✅ Added 'total_with_gst' column to weekly_invoices table.")
    except Exception as e:
        print(f"  weekly_invoices.total_with_gst: {e}")

    cursor.close()
    conn.close()
    print("\nMigration complete.")

if __name__ == "__main__":
    migrate()
