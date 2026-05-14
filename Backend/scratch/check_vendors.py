import sys
import os
sys.path.append(os.path.join(os.getcwd(), 'Backend'))

from database import get_db_connection

def check_columns():
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM Vendors LIMIT 1")
        row = cursor.fetchone()
        print("Columns in Vendors table:", row.keys() if row else "Table empty")
    finally:
        conn.close()

if __name__ == "__main__":
    check_columns()
