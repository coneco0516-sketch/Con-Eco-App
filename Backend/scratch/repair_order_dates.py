from database import get_db_connection
from datetime import timedelta

def repair_credit_dates():
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        
        # Find all PayLater orders with missing due dates
        cursor.execute("""
            SELECT order_id, created_at 
            FROM orders 
            WHERE payment_method = 'PayLater' 
              AND (credit_stage1_due IS NULL OR credit_stage2_due IS NULL)
        """)
        orders = cursor.fetchall()
        
        if not orders:
            print("No orders found needing repair.")
            return

        print(f"Repairing {len(orders)} orders...")
        
        for order in orders:
            base_date = order['created_at'].date()
            s1_due = base_date + timedelta(days=7)
            s2_due = base_date + timedelta(days=14)
            
            cursor.execute("""
                UPDATE orders 
                SET credit_stage1_due = %s, credit_stage2_due = %s 
                WHERE order_id = %s
            """, (s1_due, s2_due, order['order_id']))
            
        conn.commit()
        print("Repair complete.")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    repair_credit_dates()
