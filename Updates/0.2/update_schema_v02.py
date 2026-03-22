import os
import sys
from pathlib import Path

# Add Backend to path to import get_db_connection
backend_path = Path(__file__).resolve().parent.parent.parent / "Backend"
sys.path.insert(0, str(backend_path))

try:
    from database import get_db_connection
except ImportError:
    print("Error: Could not import database.py. Make sure this script is in the project structure.")
    sys.exit(1)

def update_v02_schema():
    print("🚀 Starting Con-Eco v0.2 Schema Update...")
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # 1. Update Orders Table (Delivery Address)
        print("Updating Orders table...")
        cursor.execute("DESCRIBE Orders")
        columns = [col[0] for col in cursor.fetchall()]
        if 'delivery_address' not in columns:
            cursor.execute("ALTER TABLE Orders ADD COLUMN delivery_address TEXT")
            print("  [OK] Added delivery_address to Orders")
        else:
            print("  [SKIP] delivery_address already exists in Orders")

        # 2. Update Products Table (Image, Description, Unit)
        print("Updating Products table...")
        cursor.execute("DESCRIBE Products")
        columns = [col[0] for col in cursor.fetchall()]
        if 'image_url' not in columns:
            cursor.execute("ALTER TABLE Products ADD COLUMN image_url TEXT")
            print("  [OK] Added image_url to Products")
        if 'description' not in columns:
            cursor.execute("ALTER TABLE Products ADD COLUMN description TEXT")
            print("  [OK] Added description to Products")
        if 'unit' not in columns:
            cursor.execute("ALTER TABLE Products ADD COLUMN unit VARCHAR(50)")
            print("  [OK] Added unit to Products")

        # 3. Update Services Table (Image, Description, Unit)
        print("Updating Services table...")
        cursor.execute("DESCRIBE Services")
        columns = [col[0] for col in cursor.fetchall()]
        if 'image_url' not in columns:
            cursor.execute("ALTER TABLE Services ADD COLUMN image_url TEXT")
            print("  [OK] Added image_url to Services")
        if 'description' not in columns:
            cursor.execute("ALTER TABLE Services ADD COLUMN description TEXT")
            print("  [OK] Added description to Services")
        if 'unit' not in columns:
            cursor.execute("ALTER TABLE Services ADD COLUMN unit VARCHAR(50)")
            print("  [OK] Added unit to Services")

        # 4. Create Commissions Table
        print("Creating commissions table if not exists...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS commissions (
                commission_id INT AUTO_INCREMENT PRIMARY KEY,
                order_id INT NOT NULL,
                vendor_id INT NOT NULL,
                base_amount DECIMAL(10, 2) NOT NULL,
                commission_amount DECIMAL(10, 2) NOT NULL,
                total_amount DECIMAL(10, 2) NOT NULL,
                commission_rate DECIMAL(4, 2) DEFAULT 5.00,
                status VARCHAR(50) DEFAULT 'Pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (order_id) REFERENCES Orders(order_id)
            )
        """)
        print("  [OK] commissions table ready")

        # 5. Create Notification Preferences Table
        print("Creating notification_preferences table if not exists...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS notification_preferences (
                pref_id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                user_type VARCHAR(50) NOT NULL,
                login_alerts BOOLEAN DEFAULT TRUE,
                password_change_alerts BOOLEAN DEFAULT TRUE,
                profile_update_alerts BOOLEAN DEFAULT TRUE,
                product_update_alerts BOOLEAN DEFAULT TRUE,
                order_alerts BOOLEAN DEFAULT TRUE,
                qc_status_alerts BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY unique_user (user_id, user_type)
            )
        """)
        print("  [OK] notification_preferences table ready")

        conn.commit()
        print("\n✅ Con-Eco v0.2 Schema Update Completed Successfully!")

    except Exception as e:
        conn.rollback()
        print(f"\n❌ ERROR during schema update: {e}")
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    update_v02_schema()
