#!/usr/bin/env python3
"""Check Users table schema"""
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

conn = mysql.connector.connect(**config)
cursor = conn.cursor(dictionary=True)

# Check Users table columns
cursor.execute("DESCRIBE Users")
columns = cursor.fetchall()

print("=" * 70)
print("Users Table Schema")
print("=" * 70)
for col in columns:
    print(f"  {col['Field']:30} {col['Type']:30} {col['Null']}")

print("\n" + "=" * 70)
print("Required Email Verification Columns:")
print("=" * 70)

required_cols = ['email_verified', 'email_verification_token', 'email_verification_sent_at']
existing_cols = [col['Field'] for col in columns]

for req_col in required_cols:
    status = "✓" if req_col in existing_cols else "✗"
    print(f"{status} {req_col}")

cursor.close()
conn.close()
