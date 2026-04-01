import mysql.connector
import os
from dotenv import load_dotenv

load_dotenv()

def migrate():
    conn = mysql.connector.connect(
        host=os.getenv("DB_HOST", "localhost"),
        user=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASS", ""),
        database=os.getenv("DB_NAME", "ConEcoDB"),
        port=os.getenv("DB_PORT", 3306)
    )
    cursor = conn.cursor()

    print("Updating Orders table status enum and adding bulk negotiation columns...")
    
    # Update status enum (MariaDB/MySQL syntax)
    # Adding 'Bulk Requested' and 'Bulk Offered'
    try:
        # Include all current and new statuses
        cursor.execute("ALTER TABLE Orders MODIFY COLUMN status ENUM('Pending','Processing','Completed','Cancelled','Delivered','Bulk Requested','Bulk Offered') DEFAULT 'Pending'")
        print("Status column updated.")
    except Exception as e:
        print(f"Error updating status: {e}")

    # Add negotiation columns
    columns_to_add = [
        ("is_bulk_request", "TINYINT(1) DEFAULT 0"),
        ("negotiated_price", "DECIMAL(10,2) DEFAULT NULL"),
        ("customer_message", "TEXT DEFAULT NULL"),
        ("vendor_message", "TEXT DEFAULT NULL")
    ]

    for col_name, col_def in columns_to_add:
        try:
            cursor.execute(f"ALTER TABLE Orders ADD COLUMN {col_name} {col_def}")
            print(f"Added column: {col_name}")
        except Exception as e:
            if "Duplicate column name" in str(e):
                print(f"Column {col_name} already exists.")
            else:
                print(f"Error adding {col_name}: {e}")

    conn.commit()
    cursor.close()
    conn.close()
    print("Migration complete.")

if __name__ == "__main__":
    migrate()
