from database import get_db_connection
from dotenv import load_dotenv
load_dotenv()

try:
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    print("=== USERS TABLE SCHEMA ===")
    cursor.execute("DESC Users")
    for row in cursor.fetchall():
        print(row)
    
    print("\n=== SAMPLE USER DATA ===")
    cursor.execute("SELECT * FROM Users LIMIT 1")
    result = cursor.fetchone()
    if result:
        print(f"Columns: {result.keys()}")
        print(f"Values: {result.values()}")
    
    cursor.close()
    conn.close()
except Exception as e:
    print(f"ERROR: {e}")
