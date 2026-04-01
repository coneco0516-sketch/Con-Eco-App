import mysql.connector
import os
from dotenv import load_dotenv

load_dotenv()

def migrate():
    try:
        conn = mysql.connector.connect(
            host=os.getenv("DB_HOST", "127.0.0.1"),
            user=os.getenv("DB_USER", "root"),
            password=os.getenv("DB_PASS", ""),
            database=os.getenv("DB_NAME", "ConEcoDB"),
            port=int(os.getenv("DB_PORT", "3306"))
        )
        cursor = conn.cursor()
        
        # Add columns to Products
        try:
            cursor.execute("ALTER TABLE Products ADD COLUMN brand VARCHAR(150) DEFAULT ''")
            print("Added brand to Products")
        except Exception as e:
            print(f"Products.brand error: {e}")
            
        try:
            cursor.execute("ALTER TABLE Products ADD COLUMN specifications TEXT")
            print("Added specifications to Products")
        except Exception as e:
            print(f"Products.specifications error: {e}")
            
        try:
            cursor.execute("ALTER TABLE Products ADD COLUMN delivery_time VARCHAR(100) DEFAULT ''")
            print("Added delivery_time to Products")
        except Exception as e:
            print(f"Products.delivery_time error: {e}")
            
        # Add columns to Services
        try:
            cursor.execute("ALTER TABLE Services ADD COLUMN specifications TEXT")
            print("Added specifications to Services")
        except Exception as e:
            print(f"Services.specifications error: {e}")
            
        try:
            cursor.execute("ALTER TABLE Services ADD COLUMN delivery_time VARCHAR(100) DEFAULT ''")
            print("Added delivery_time to Services")
        except Exception as e:
            print(f"Services.delivery_time error: {e}")
            
        conn.commit()
        cursor.close()
        conn.close()
        print("Migration complete!")
    except Exception as e:
        print(f"Migration failed: {e}")

if __name__ == '__main__':
    migrate()
