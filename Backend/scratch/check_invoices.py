from database import get_db_connection

def check_invoices():
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM weekly_invoices ORDER BY created_at DESC LIMIT 5")
        rows = cursor.fetchall()
        for r in rows:
            print(r)
    finally:
        conn.close()

if __name__ == "__main__":
    check_invoices()
