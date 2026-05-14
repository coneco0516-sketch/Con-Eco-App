import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.environ.get("DATABASE_URL")

def check_db():
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()
    
    print("Columns in 'orders' table:")
    cursor.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'orders'")
    for row in cursor.fetchall():
        print(f"  {row[0]}: {row[1]}")
    
    print("\nColumns in 'customers' table:")
    cursor.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'customers'")
    for row in cursor.fetchall():
        print(f"  {row[0]}: {row[1]}")
        
    cursor.close()
    conn.close()

if __name__ == "__main__":
    check_db()
