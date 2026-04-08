from database import get_db_connection

def clear_all_except_admins():
    """Clears all data from all tables except those related to admin users."""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        
        # 1. Get all table names
        cursor.execute("SHOW TABLES")
        tables = [row[0] for row in cursor.fetchall()]
        
        # 2. Check current database brand (MySQL/MariaDB) to handle foreign keys
        print("Disabling foreign key checks...")
        cursor.execute("SET FOREIGN_KEY_CHECKS = 0")
        
        # 3. Identify tables to SKIP
        # Based on typical schema: 'users' table contains admins, but also vendors/customers.
        # We should NOT truncate 'users' or 'platform_settings' or 'admins' (if separate).
        # We need to DELETE ONLY non-admin records from the 'users' table.
        skip_tables = ['platform_settings', 'admins'] 
        
        for table in tables:
            if table.lower() in skip_tables:
                print(f"Skipping core table: {table}")
                continue
            
            if table.lower() == 'users':
                print("Cleaning 'users' table (keeping Admins)...")
                # Remove vendors and customers, leave admins
                cursor.execute("DELETE FROM users WHERE role != 'Admin'")
                conn.commit()
                continue
                
            print(f"Truncating table: {table}")
            try:
                cursor.execute(f"TRUNCATE TABLE {table}")
                conn.commit()
            except Exception as trun_err:
                print(f"  Truncate failed for {table}, using DELETE: {trun_err}")
                cursor.execute(f"DELETE FROM {table}")
                conn.commit()
        
        # 4. Re-enable foreign key checks
        cursor.execute("SET FOREIGN_KEY_CHECKS = 1")
        print("\nSUCCESS: All non-admin data has been cleared from Railway.")
        
    except Exception as e:
        print(f"ERROR during database cleanup: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    confirm = input("Are you absolutely sure you want to delete all user and transaction data from Railway? (yes/no): ")
    if confirm.lower() == 'yes':
        clear_all_except_admins()
    else:
        print("Aborted.")
