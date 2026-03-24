from database import get_db_connection

def migrate():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check and add category to Products
    cursor.execute("DESCRIBE Products")
    cols = [r[0] for r in cursor.fetchall()]
    if 'category' not in cols:
        print("Adding 'category' to Products...")
        cursor.execute("ALTER TABLE Products ADD COLUMN category VARCHAR(50) NOT NULL DEFAULT 'General' AFTER vendor_id")
    
    # Check and add category to Services
    cursor.execute("DESCRIBE Services")
    cols = [r[0] for r in cursor.fetchall()]
    if 'category' not in cols:
        print("Adding 'category' to Services...")
        cursor.execute("ALTER TABLE Services ADD COLUMN category VARCHAR(50) NOT NULL DEFAULT 'General' AFTER vendor_id")
    
    conn.commit()
    cursor.close()
    conn.close()
    print("Migration finished!")

if __name__ == "__main__":
    migrate()
