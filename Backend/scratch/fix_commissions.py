from database import get_db_connection

def fix_all_commissions():
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        
        # Reset all COD, Negotiable, and PayLater commissions to 'Pending'
        # if they aren't part of a PAID invoice.
        cursor.execute("""
            UPDATE commissions c
            SET status = 'Pending'
            FROM Orders o
            WHERE c.order_id = o.order_id
              AND o.payment_method IN ('COD', 'Negotiable', 'PayLater')
              AND c.status = 'Settled'
              AND NOT EXISTS (
                  SELECT 1 FROM weekly_invoices i 
                  WHERE i.vendor_id = c.vendor_id 
                    AND i.status = 'Paid'
              )
        """)
        
        updated = cursor.rowcount
        conn.commit()
        print(f"Successfully restored {updated} commissions to 'Pending'.")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    fix_all_commissions()
