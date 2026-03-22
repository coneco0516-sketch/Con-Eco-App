import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'Backend')))
from database import get_db_connection

def update_schema():
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        
        # Create commissions table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS commissions (
                commission_id INT AUTO_INCREMENT PRIMARY KEY,
                order_id INT NOT NULL,
                vendor_id INT NOT NULL,
                commission_amount DECIMAL(10,2) NOT NULL,
                commission_rate DECIMAL(5,2) NOT NULL,
                status ENUM('Pending', 'Paid') DEFAULT 'Pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Add columns to Orders table
        try:
            cursor.execute("ALTER TABLE Orders ADD COLUMN base_amount DECIMAL(10,2)")
        except: pass
        try:
            cursor.execute("ALTER TABLE Orders ADD COLUMN commission_amount DECIMAL(10,2)")
        except: pass
        try:
            cursor.execute("ALTER TABLE Orders ADD COLUMN total_amount DECIMAL(10,2)")
        except: pass
        
        # Modify status column to include 'Paid'
        cursor.execute("ALTER TABLE Orders MODIFY COLUMN status ENUM('Pending','Paid','Shipped','Out for Delivery','Delivered','Cancelled') DEFAULT 'Pending'")
        
        conn.commit()
        print("Schema updated successfully.")
    except Exception as e:
        print(f"Error updating schema: {e}")
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    update_schema()
