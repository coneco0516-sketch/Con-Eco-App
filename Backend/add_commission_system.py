#!/usr/bin/env python3
"""
Migration script to add commission tracking to the database.
This adds commission columns to Orders and creates a Commissions table for financial tracking.
"""

import mysql.connector
from mysql.connector import Error

# Database connection config
db_config = {
    'host': 'localhost',
    'user': 'root',
    'password': '',
    'database': 'conecoapp'
}

def add_commission_columns():
    """Add commission columns to Orders table"""
    try:
        connection = mysql.connector.connect(**db_config)
        cursor = connection.cursor()
        
        print("\n📝 Adding commission columns to Orders table...")
        
        # Check if columns exist
        cursor.execute("""
            SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME='orders' AND COLUMN_NAME IN ('base_amount', 'commission_amount', 'total_amount')
        """)
        
        existing_cols = [row[0] for row in cursor.fetchall()]
        
        # Add base_amount column
        if 'base_amount' not in existing_cols:
            cursor.execute("""
                ALTER TABLE orders 
                ADD COLUMN base_amount DECIMAL(10,2) DEFAULT 0 AFTER amount
            """)
            print("✅ Added base_amount column")
        
        # Add commission_amount column
        if 'commission_amount' not in existing_cols:
            cursor.execute("""
                ALTER TABLE orders 
                ADD COLUMN commission_amount DECIMAL(10,2) DEFAULT 0 AFTER base_amount
            """)
            print("✅ Added commission_amount column")
        
        # Add total_amount column
        if 'total_amount' not in existing_cols:
            cursor.execute("""
                ALTER TABLE orders 
                ADD COLUMN total_amount DECIMAL(10,2) DEFAULT 0 AFTER commission_amount
            """)
            print("✅ Added total_amount column")
        
        connection.commit()
        cursor.close()
        connection.close()
        print("✅ Orders table updated successfully!\n")
        
    except Error as err:
        print(f"❌ Error: {err}")
        return False
    
    return True


def create_commissions_table():
    """Create commissions table for financial reporting"""
    try:
        connection = mysql.connector.connect(**db_config)
        cursor = connection.cursor()
        
        print("📝 Creating Commissions table...")
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS commissions (
                commission_id INT NOT NULL AUTO_INCREMENT,
                order_id INT NOT NULL,
                vendor_id INT NOT NULL,
                commission_amount DECIMAL(10,2) NOT NULL,
                commission_rate DECIMAL(5,2) DEFAULT 5.00,
                status ENUM('Pending', 'Settled', 'Paid') DEFAULT 'Pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                settled_date TIMESTAMP NULL,
                PRIMARY KEY (commission_id),
                KEY order_id (order_id),
                KEY vendor_id (vendor_id),
                FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
                FOREIGN KEY (vendor_id) REFERENCES vendors(vendor_id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
        """)
        
        connection.commit()
        cursor.close()
        connection.close()
        print("✅ Commissions table created successfully!\n")
        
    except Error as err:
        print(f"❌ Error: {err}")
        return False
    
    return True


def migrate_existing_orders():
    """Migrate existing orders to populate commission fields"""
    try:
        connection = mysql.connector.connect(**db_config)
        cursor = connection.cursor()
        
        print("📝 Migrating existing orders with commission data...")
        
        # For existing orders, assume 'amount' is the total (base + commission)
        # Calculate splitting as: base = amount / 1.05, commission = amount * 5/105
        cursor.execute("""
            UPDATE orders 
            SET 
                base_amount = ROUND(amount / 1.05, 2),
                commission_amount = ROUND(amount - (amount / 1.05), 2),
                total_amount = amount
            WHERE base_amount = 0 AND total_amount = 0
        """)
        
        migrated = cursor.rowcount
        connection.commit()
        
        if migrated > 0:
            print(f"✅ Migrated {migrated} existing orders\n")
        else:
            print("ℹ️  No orders to migrate (already have commission data)\n")
        
        cursor.close()
        connection.close()
        
    except Error as err:
        print(f"❌ Error: {err}")
        return False
    
    return True


if __name__ == "__main__":
    print("=" * 50)
    print("🔧 COMMISSION SYSTEM SETUP")
    print("=" * 50)
    
    if add_commission_columns():
        if create_commissions_table():
            if migrate_existing_orders():
                print("=" * 50)
                print("✅ ALL MIGRATIONS COMPLETED SUCCESSFULLY!")
                print("=" * 50)
                print("\n📊 Commission tracking is now enabled:")
                print("   - Base amount: Vendor's set price")
                print("   - Commission: 5% of base amount")
                print("   - Total: Base + Commission (charged to customer)")
            else:
                print("⚠️  Migration completed with warnings")
        else:
            print("❌ Failed to create commissions table")
    else:
        print("❌ Failed to add commission columns")
