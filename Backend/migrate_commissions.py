from database import get_db_connection

def migrate():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Try adding is_blocked to Users
    try:
        cursor.execute("ALTER TABLE Users ADD COLUMN is_blocked TINYINT(1) DEFAULT 0")
        conn.commit()
    except Exception as e:
        print(f"Users table update: {e}")

    # Try adding commission_strikes to Vendors
    try:
        cursor.execute("ALTER TABLE Vendors ADD COLUMN commission_strikes INT DEFAULT 0")
        conn.commit()
    except Exception as e:
        print(f"Vendors table update: {e}")

    # Create weekly_invoices table
    try:
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS weekly_invoices (
                invoice_id INT AUTO_INCREMENT PRIMARY KEY,
                vendor_id INT,
                amount DECIMAL(10,2),
                status ENUM('Unpaid', 'Paid') DEFAULT 'Unpaid',
                billing_period_start DATE,
                billing_period_end DATE,
                due_date DATE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (vendor_id) REFERENCES Vendors(vendor_id)
            )
        """)
        conn.commit()
    except Exception as e:
        print(f"weekly_invoices table: {e}")

    cursor.close()
    conn.close()

if __name__ == "__main__":
    migrate()
