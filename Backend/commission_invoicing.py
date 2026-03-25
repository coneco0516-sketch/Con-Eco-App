from database import get_db_connection
from datetime import datetime, timedelta

def generate_weekly_invoices():
    """
    Called periodically (e.g. via cron) to generate invoices for the previous week's COD commissions.
    """
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    # Define the period: Previous 7 days
    end_date = datetime.now().date()
    start_date = end_date - timedelta(days=7)
    due_date = end_date + timedelta(days=3) # Due in 3 days
    
    # 1. Fetch all Vendors
    cursor.execute("SELECT vendor_id FROM Vendors")
    vendors = cursor.fetchall()
    
    for v in vendors:
        vendor_id = v['vendor_id']
        
        # 2. Calculate sum of 'Pending' COD commissions for this period
        # Note: We filter by Orders with payment_method='COD' and commission status='Pending'
        cursor.execute("""
            SELECT SUM(c.commission_amount) as total 
            FROM commissions c
            JOIN Orders o ON c.order_id = o.order_id
            WHERE c.vendor_id = %s 
              AND o.payment_method = 'COD'
              AND c.status = 'Pending'
              AND c.created_at BETWEEN %s AND %s
        """, (vendor_id, start_date, end_date))
        
        res = cursor.fetchone()
        amount = res['total'] or 0.0
        
        if amount > 0:
            # 3. Create invoice if not already exists for this period
            cursor.execute("""
                SELECT invoice_id FROM weekly_invoices 
                WHERE vendor_id = %s AND billing_period_start = %s AND billing_period_end = %s
            """, (vendor_id, start_date, end_date))
            
            if not cursor.fetchone():
                cursor.execute("""
                    INSERT INTO weekly_invoices (vendor_id, amount, billing_period_start, billing_period_end, due_date)
                    VALUES (%s, %s, %s, %s, %s)
                """, (vendor_id, amount, start_date, end_date, due_date))
                print(f"Issued invoice for Vendor {vendor_id}: ₹{amount}")
        
    conn.commit()
    cursor.close()
    conn.close()

def enforce_penalties():
    """
    Checks for overdue invoices and applies strikes/blocks.
    """
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    # Find unpaid invoices that are past their due date
    cursor.execute("""
        SELECT i.*, v.commission_strikes 
        FROM weekly_invoices i
        JOIN Vendors v ON i.vendor_id = v.vendor_id
        WHERE i.status = 'Unpaid' AND i.due_date < CURRENT_DATE()
    """)
    overdue = cursor.fetchall()
    
    for inv in overdue:
        vendor_id = inv['vendor_id']
        new_strikes = inv['commission_strikes'] + 1
        
        print(f"Vendor {vendor_id} has overdue payment ({inv['amount']}). Strike {new_strikes}")
        
        # Update strikes
        cursor.execute("UPDATE Vendors SET commission_strikes = %s WHERE vendor_id = %s", (new_strikes, vendor_id))
        
        if new_strikes == 1:
            # First time: Unverify
            cursor.execute("UPDATE Vendors SET verification_status = 'Pending' WHERE vendor_id = %s", (vendor_id,))
            print(f"Vendor {vendor_id} unverified.")
        elif new_strikes >= 2:
            # Second time: Block
            cursor.execute("UPDATE Users SET is_blocked = 1 WHERE user_id = %s", (vendor_id,))
            print(f"Vendor {vendor_id} blocked.")
            
        # Optional: Mark this invoice as 'Penalty Applied' so we don't count it again or keep increasing strikes indefinitely for the same invoice
        # However, it's simpler for this demo to just increase strikes.
        
    conn.commit()
    cursor.close()
    conn.close()

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "generate":
        generate_weekly_invoices()
    elif len(sys.argv) > 1 and sys.argv[1] == "enforce":
        enforce_penalties()
    else:
        print("Usage: python commission_invoicing.py [generate|enforce]")
