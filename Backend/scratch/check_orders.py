from database import get_db_connection

def check_all_commissions():
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT c.commission_id, c.status, c.created_at, o.payment_method, o.order_id
            FROM commissions c
            JOIN Orders o ON c.order_id = o.order_id
        """)
        rows = cursor.fetchall()
        for r in rows:
            print(r)
    finally:
        conn.close()

if __name__ == "__main__":
    check_all_commissions()
