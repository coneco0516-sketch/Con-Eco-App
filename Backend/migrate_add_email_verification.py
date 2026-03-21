#!/usr/bin/env python3
"""
Database Migration: Add Email Verification Columns to Users Table
"""
import mysql.connector
import os
from dotenv import load_dotenv

load_dotenv()

config = {
    'host': os.environ.get('DB_HOST'),
    'user': os.environ.get('DB_USER'),
    'password': os.environ.get('DB_PASS'),
    'database': os.environ.get('DB_NAME'),
    'port': int(os.environ.get('DB_PORT', 3306))
}

print("=" * 70)
print("DATABASE MIGRATION: Add Email Verification Columns")
print("=" * 70)

try:
    conn = mysql.connector.connect(**config)
    cursor = conn.cursor()
    
    print("\nAdding email_verified column...")
    try:
        cursor.execute("""
            ALTER TABLE Users 
            ADD COLUMN email_verified BOOLEAN DEFAULT FALSE
        """)
        print("✓ Added email_verified")
    except mysql.connector.errors.ProgrammingError as e:
        if 'Duplicate column name' in str(e):
            print("✓ email_verified already exists")
        else:
            raise
    
    print("\nAdding email_verification_token column...")
    try:
        cursor.execute("""
            ALTER TABLE Users 
            ADD COLUMN email_verification_token VARCHAR(255) UNIQUE
        """)
        print("✓ Added email_verification_token")
    except mysql.connector.errors.ProgrammingError as e:
        if 'Duplicate column name' in str(e):
            print("✓ email_verification_token already exists")
        else:
            raise
    
    print("\nAdding email_verification_sent_at column...")
    try:
        cursor.execute("""
            ALTER TABLE Users 
            ADD COLUMN email_verification_sent_at TIMESTAMP
        """)
        print("✓ Added email_verification_sent_at")
    except mysql.connector.errors.ProgrammingError as e:
        if 'Duplicate column name' in str(e):
            print("✓ email_verification_sent_at already exists")
        else:
            raise
    
    conn.commit()
    cursor.close()
    
    print("\n" + "=" * 70)
    print("✓ MIGRATION COMPLETE!")
    print("=" * 70)
    print("\nEmail verification columns have been added to Users table:")
    print("  ✓ email_verified (BOOLEAN) - default FALSE")
    print("  ✓ email_verification_token (VARCHAR) - unique")
    print("  ✓ email_verification_sent_at (TIMESTAMP)")
    print("\nEmail verification should now work!")
    print("=" * 70)
    
    conn.close()
    
except Exception as e:
    print(f"\n✗ ERROR: {str(e)}")
    print("\nMake sure:")
    print("  1. Database connection details are correct in Backend/.env")
    print("  2. You have permission to ALTER the Users table")
    print("  3. The database server is running")
