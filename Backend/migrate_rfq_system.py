import os
import psycopg2
from urllib.parse import urlparse
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL is not set in .env")

# Handle neon.tech specific connection parameters
url = urlparse(DATABASE_URL)
conn_kwargs = {
    "dbname": url.path[1:],
    "user": url.username,
    "password": url.password,
    "host": url.hostname,
    "port": url.port,
    "sslmode": "require"
}

def migrate_rfq():
    conn = psycopg2.connect(**conn_kwargs)
    cursor = conn.cursor()
    
    try:
        print("Creating RFQRequests table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS RFQRequests (
                rfq_id SERIAL PRIMARY KEY,
                customer_id INT REFERENCES Customers(customer_id) ON DELETE CASCADE,
                site_id INT REFERENCES ProjectSites(site_id) ON DELETE SET NULL,
                item_type VARCHAR(20),
                category VARCHAR(100),
                title VARCHAR(300),
                description TEXT,
                quantity INT,
                unit VARCHAR(50),
                required_by DATE,
                delivery_address TEXT,
                city VARCHAR(100),
                state VARCHAR(100),
                status VARCHAR(30) DEFAULT 'Open',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        
        print("Creating RFQBids table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS RFQBids (
                bid_id SERIAL PRIMARY KEY,
                rfq_id INT REFERENCES RFQRequests(rfq_id) ON DELETE CASCADE,
                vendor_id INT REFERENCES Vendors(vendor_id) ON DELETE CASCADE,
                unit_price DECIMAL(10,2),
                total_price DECIMAL(12,2),
                delivery_days INT,
                note TEXT,
                status VARCHAR(20) DEFAULT 'Pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        
        conn.commit()
        print("RFQ migration completed successfully!")
        
    except Exception as e:
        conn.rollback()
        print(f"Error during migration: {e}")
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    migrate_rfq()
