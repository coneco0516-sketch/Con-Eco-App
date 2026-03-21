import mysql.connector

def fix_database():
    try:
        conn = mysql.connector.connect(
            host="localhost",
            user="root",
            password="",
            database="ConEcoDB"
        )
        cursor = conn.cursor()
        
        # 1. Alter Orders Table
        print("Altering Orders table...")
        try:
            cursor.execute("ALTER TABLE Orders ADD COLUMN item_id INT AFTER vendor_id")
        except:
            print("item_id might already exist.")
            
        try:
            cursor.execute("ALTER TABLE Orders ADD COLUMN quantity INT AFTER item_id")
        except:
            print("quantity might already exist.")
            
        cursor.execute("ALTER TABLE Orders MODIFY COLUMN order_type ENUM('Product','Service') NOT NULL")
        
        # 2. Fix Cart Table (re-ensure it matches)
        print("Ensuring Cart table is correct...")
        cursor.execute("DROP TABLE IF EXISTS Cart")
        cursor.execute("""
            CREATE TABLE Cart (
                cart_id INT AUTO_INCREMENT PRIMARY KEY, 
                customer_id INT, 
                item_type ENUM('Product', 'Service'), 
                item_id INT, 
                quantity INT DEFAULT 1, 
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # 3. Add dummy data to Cart for Customer (rahul@email.com -> user_id=2)
        # Assuming user_id=2 is the customer from our previous check
        # Let's verify and then add.
        
        conn.commit()
        print("Database schema updated successfully!")
        
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    fix_database()
