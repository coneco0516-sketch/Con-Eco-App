import mysql.connector

def check_schema():
    try:
        conn = mysql.connector.connect(
            host="localhost",
            user="root",
            password="",
            database="ConEcoDB"
        )
        cursor = conn.cursor()
        
        tables = ['Users', 'Customers', 'Vendors', 'Cart', 'Products', 'Services', 'Orders', 'Payments']
        for table in tables:
            print(f"\n--- {table} ---")
            cursor.execute(f"DESCRIBE {table}")
            for row in cursor.fetchall():
                print(row)
        
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_schema()
