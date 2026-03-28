import sys
sys.path.append('Backend')
from database import get_db_connection

conn = get_db_connection()
cursor = conn.cursor()
try:
    cursor.execute("DESC Payments")
    cols = cursor.fetchall()
    print("Payments Columns:")
    for c in cols:
        print(c)
    
    cursor.execute("DESC Orders")
    cols = cursor.fetchall()
    print("\nOrders Columns:")
    for c in cols:
        print(c)
        
except Exception as e:
    print("Error:", e)
finally:
    cursor.close()
    conn.close()
