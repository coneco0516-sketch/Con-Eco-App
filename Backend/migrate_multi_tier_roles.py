import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.environ.get("DATABASE_URL")

def migrate_admin_roles():
    if not DATABASE_URL:
        print("Error: DATABASE_URL not found in .env file.")
        return

    try:
        conn = psycopg2.connect(DATABASE_URL)
        conn.autocommit = True
        cursor = conn.cursor()

        print("Connected to database. Updating user roles...")

        # 1. Drop existing constraint if it exists (might have different names depending on PG version/driver)
        # We'll look for a constraint that checks the role column
        cursor.execute("""
            SELECT conname 
            FROM pg_constraint 
            WHERE conrelid = 'users'::regclass 
            AND contype = 'c' 
            AND conname LIKE '%role%'
        """)
        constraints = cursor.fetchall()
        for con in constraints:
            print(f"Dropping constraint: {con[0]}")
            cursor.execute(f"ALTER TABLE users DROP CONSTRAINT IF EXISTS {con[0]}")

        # 2. Add the expanded constraint
        print("Adding new multi-tier role constraint...")
        cursor.execute("""
            ALTER TABLE users ADD CONSTRAINT users_role_check 
            CHECK (role IN ('Super Admin', 'Admin', 'Employee', 'Customer', 'Vendor'))
        """)

        # 3. Promote existing 'Admin' users to 'Super Admin' 
        # (This assumes that the current 'Admin' is the platform owner)
        print("Promoting existing 'Admin' users to 'Super Admin'...")
        cursor.execute("UPDATE users SET role = 'Super Admin' WHERE role = 'Admin'")

        print("Migration complete!")
        cursor.close()
        conn.close()

    except Exception as e:
        print(f"Error during migration: {e}")

if __name__ == "__main__":
    migrate_admin_roles()
