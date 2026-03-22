from database import get_db_connection
import mysql.connector

def update_enum():
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        print("🔧 Updating Orders.status enum...")
        # To be safe, we'll fetch existing enum first? No, we'll just set it to the full desired set:
        sql = """
        ALTER TABLE Orders MODIFY COLUMN status 
        ENUM('Pending','Processing','Paid','Shipped','Out for Delivery','Delivered','Completed','Cancelled') 
        DEFAULT 'Pending'
        """
        cursor.execute(sql)
        conn.commit()
        print("✅ Orders table enum updated!")
        
        # Also check Payments.status
        cursor.execute("DESCRIBE Payments status")
        res = cursor.fetchone()
        print(f"Payments.status type: {res[1]}")
        # Payments.status: enum('Pending','Completed','Failed') is in my schema
        
        cursor.close()
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    update_enum()
