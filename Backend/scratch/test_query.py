from database import get_db_connection

def test_weekly_invoices():
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        print("Testing query...")
        cursor.execute("""
            SELECT i.invoice_id, u.name as vendor_name, v.company_name,
                   i.amount, i.status,
                   TO_CHAR(i.billing_period_start, 'DD Mon YYYY') as period_start,
                   TO_CHAR(i.billing_period_end, 'DD Mon YYYY') as period_end,
                   TO_CHAR(i.due_date, 'DD Mon YYYY') as due_date,
                   v.commission_strikes,
                   EXISTS(SELECT 1 FROM Users u2 WHERE u2.user_id = v.vendor_id AND u2.is_blocked = TRUE) as is_blocked
            FROM weekly_invoices i
            JOIN Vendors v ON i.vendor_id = v.vendor_id
            JOIN Users u ON v.vendor_id = u.user_id
            ORDER BY i.created_at DESC
        """)
        invoices = cursor.fetchall()
        print(f"Success! Found {len(invoices)} invoices.")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    test_weekly_invoices()
