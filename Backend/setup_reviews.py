import mysql.connector
import os
from dotenv import load_dotenv

load_dotenv()

def setup_reviews():
    try:
        conn = mysql.connector.connect(
            host=os.getenv("DB_HOST", "127.0.0.1"),
            user=os.getenv("DB_USER", "root"),
            password=os.getenv("DB_PASS", ""),
            database=os.getenv("DB_NAME", "ConEcoDB"),
            port=int(os.getenv("DB_PORT", "3306"))
        )
        cursor = conn.cursor()
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS ItemReviews (
                review_id INT AUTO_INCREMENT PRIMARY KEY,
                item_type ENUM('Product', 'Service') NOT NULL,
                item_id INT NOT NULL,
                customer_id INT NOT NULL,
                rating INT NOT NULL CHECK(rating >= 1 AND rating <= 5),
                comment TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(customer_id) REFERENCES Customers(customer_id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
        """)
        conn.commit()
        print("ItemReviews table created successfully.")
        
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    setup_reviews()
