#!/usr/bin/env python3
import mysql.connector
from mysql.connector import Error
import os
from dotenv import load_dotenv

load_dotenv()

# Database connection config
db_config = {
    'host': os.environ.get('DB_HOST', 'localhost'),
    'user': os.environ.get('DB_USER', 'root'),
    'password': os.environ.get('DB_PASS', ''),
    'database': os.environ.get('DB_NAME', 'conecoapp'),
    'port': int(os.environ.get('DB_PORT', 3306))
}

def add_payment_method_column():
    """Add payment_method column to Orders table"""
    try:
        connection = mysql.connector.connect(**db_config)
        cursor = connection.cursor()
        
        print("\n📝 Adding payment_method column to Orders table...")
        
        # Check if column exists
        cursor.execute("""
            SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME='Orders' AND COLUMN_NAME = 'payment_method'
        """)
        
        if not cursor.fetchone():
            cursor.execute("""
                ALTER TABLE Orders 
                ADD COLUMN payment_method VARCHAR(50) DEFAULT 'Card' AFTER status
            """)
            print("[OK] Added payment_method column")
        else:
            print("ℹ️  payment_method column already exists")
        
        connection.commit()
        cursor.close()
        connection.close()
        print("[OK] Orders table updated successfully!\n")
        
    except Error as err:
        print(f"[FAIL] Error: {err}")
        return False
    
    return True

if __name__ == "__main__":
    add_payment_method_column()
