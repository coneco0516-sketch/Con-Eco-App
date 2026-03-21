"""
Database schema migration for email notification system
Run this once to add notification tables to the database
"""

from database import get_db_connection

def create_notification_tables():
    """Create all required tables for the notification system"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Add email_verified and email_verification_token columns to users table
        print("Adding email notification fields to users table...")
        
        # Check if column exists before adding
        try:
            cursor.execute("""ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE""")
            conn.commit()
            print("  ✓ Added email_verified column")
        except Exception as e:
            if "Duplicate column name" in str(e) or "already exists" in str(e):
                print("  - email_verified column already exists")
            else:
                print(f"  Warning adding email_verified: {str(e)}")
        
        try:
            cursor.execute("""ALTER TABLE users ADD COLUMN email_verification_token VARCHAR(255) UNIQUE""")
            conn.commit()
            print("  ✓ Added email_verification_token column")
        except Exception as e:
            if "Duplicate column name" in str(e) or "already exists" in str(e):
                print("  - email_verification_token column already exists")
            else:
                print(f"  Warning adding email_verification_token: {str(e)}")
        
        try:
            cursor.execute("""ALTER TABLE users ADD COLUMN email_verification_sent_at TIMESTAMP""")
            conn.commit()
            print("  ✓ Added email_verification_sent_at column")
        except Exception as e:
            if "Duplicate column name" in str(e) or "already exists" in str(e):
                print("  - email_verification_sent_at column already exists")
            else:
                print(f"  Warning adding email_verification_sent_at: {str(e)}")
        
        # Table for notification preferences
        print("Creating notification_preferences table...")
        try:
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS notification_preferences (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    user_id INT NOT NULL UNIQUE,
                    user_type ENUM('admin', 'vendor', 'customer') NOT NULL,
                    login_alerts BOOLEAN DEFAULT TRUE,
                    password_change_alerts BOOLEAN DEFAULT TRUE,
                    profile_update_alerts BOOLEAN DEFAULT TRUE,
                    product_update_alerts BOOLEAN DEFAULT TRUE,
                    order_alerts BOOLEAN DEFAULT TRUE,
                    qc_status_alerts BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    KEY idx_user_id (user_id)
                )
            """)
            conn.commit()
            print("  ✓ notification_preferences table created")
        except Exception as e:
            print(f"  - Error creating notification_preferences: {str(e)}")
        
        # Table for email notification history
        print("Creating email_notifications table...")
        try:
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS email_notifications (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    user_id INT NOT NULL,
                    email VARCHAR(255) NOT NULL,
                    notification_type ENUM('login', 'password_change', 'profile_update', 'email_verification', 'qc_status', 'order_confirmation', 'order_update', 'product_update') NOT NULL,
                    subject VARCHAR(255),
                    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    status ENUM('sent', 'failed', 'bounced') DEFAULT 'sent',
                    metadata JSON,
                    INDEX idx_user_id (user_id),
                    INDEX idx_notification_type (notification_type),
                    INDEX idx_sent_at (sent_at)
                )
            """)
            conn.commit()
            print("  ✓ email_notifications table created")
        except Exception as e:
            print(f"  - Error creating email_notifications: {str(e)}")
        
        # Table for login activity tracking
        print("Creating login_activity table...")
        try:
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS login_activity (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    user_id INT NOT NULL,
                    email VARCHAR(255),
                    user_type ENUM('admin', 'vendor', 'customer') NOT NULL,
                    ip_address VARCHAR(45),
                    user_agent VARCHAR(500),
                    device_info VARCHAR(255),
                    login_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_user_id (user_id),
                    INDEX idx_login_at (login_at)
                )
            """)
            conn.commit()
            print("  ✓ login_activity table created")
        except Exception as e:
            print(f"  - Error creating login_activity: {str(e)}")
        
        cursor.close()
        conn.close()
        
        print("✓ All notification tables created successfully!")
        return True
        
    except Exception as e:
        print(f"Error creating notification tables: {str(e)}")
        return False

if __name__ == "__main__":
    create_notification_tables()
