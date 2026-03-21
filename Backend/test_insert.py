from database import get_db_connection
from dotenv import load_dotenv
load_dotenv()

try:
    conn = get_db_connection()
    cursor = conn.cursor()
    # Use vendor_id=3 (vendor@coneco.com)
    cursor.execute(
        "INSERT INTO Products (vendor_id, category, name, description, price) VALUES (%s, %s, %s, %s, %s)",
        (3, 'General', 'Test Product', 'Test Desc', 100.0)
    )
    conn.commit()
    print("SUCCESS: Product inserted!")
    cursor.close()
    conn.close()
except Exception as e:
    print(f"ERROR: {e}")
