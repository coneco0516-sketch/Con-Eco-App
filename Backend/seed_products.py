from database import get_db_connection
from dotenv import load_dotenv
load_dotenv()

try:
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    # Insert a sample product for vendor_id=18 (vendor@coneco.com)
    cursor.execute(
        "INSERT INTO Products (vendor_id, category, name, description, price, stock_quantity) VALUES (%s, %s, %s, %s, %s, %s)",
        (18, 'Construction', 'Premium Bricks', 'High quality red bricks for construction.', 10.0, 100)
    )

    # Insert a sample service
    cursor.execute(
        "INSERT INTO Services (vendor_id, category, name, description, price) VALUES (%s, %s, %s, %s, %s)",
        (18, 'Construction', 'Wall Plastering', 'Professional wall plastering service per sq ft.', 25.0)
    )

    conn.commit()
    print("SUCCESS: Sample product and service inserted for vendor_id=18!")
    cursor.close()
    conn.close()
except Exception as e:
    print(f"ERROR: {e}")
