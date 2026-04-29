import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.environ.get("DATABASE_URL")

def setup_database():
    if not DATABASE_URL:
        print("Error: DATABASE_URL not found in .env file.")
        return

    try:
        conn = psycopg2.connect(DATABASE_URL)
        conn.autocommit = True
        cursor = conn.cursor()

        print("Connected to Neon PostgreSQL. Creating tables...")

        # 1. Platform Settings
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS platformsettings (
                setting_key VARCHAR(100) PRIMARY KEY,
                setting_value TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # 2. Users table (Core)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                user_id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                phone VARCHAR(15) NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                role VARCHAR(20) CHECK (role IN ('Admin', 'Customer', 'Vendor')),
                is_blocked BOOLEAN DEFAULT FALSE,
                email_verified BOOLEAN DEFAULT FALSE,
                email_verification_token VARCHAR(255) UNIQUE,
                email_verification_sent_at TIMESTAMP,
                reset_password_token VARCHAR(255),
                reset_password_expires_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # 3. Vendors table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS vendors (
                vendor_id INT PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
                company_name VARCHAR(100) NOT NULL,
                gst_number VARCHAR(15) UNIQUE,
                address TEXT,
                city VARCHAR(50),
                state VARCHAR(50),
                verification_status VARCHAR(20) DEFAULT 'Pending' CHECK (verification_status IN ('Pending', 'Verified', 'Rejected', 'Blocked')),
                qc_score INT DEFAULT 0 CHECK (qc_score >= 0 AND qc_score <= 100),
                wallet_balance DECIMAL(12,2) DEFAULT 0.00,
                commission_strikes INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # 4. Customers table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS customers (
                customer_id INT PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
                city VARCHAR(50),
                state VARCHAR(50),
                verification_status VARCHAR(20) DEFAULT 'Pending' CHECK (verification_status IN ('Pending', 'Verified', 'Blocked')),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # 5. Products & Services
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS products (
                product_id SERIAL PRIMARY KEY,
                vendor_id INT REFERENCES vendors(vendor_id) ON DELETE CASCADE,
                category VARCHAR(50) NOT NULL,
                name VARCHAR(100) NOT NULL,
                description TEXT,
                price DECIMAL(10,2) NOT NULL,
                image_url VARCHAR(255),
                unit VARCHAR(20),
                brand VARCHAR(50),
                specifications TEXT,
                delivery_time VARCHAR(50),
                stock_quantity INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS services (
                service_id SERIAL PRIMARY KEY,
                vendor_id INT REFERENCES vendors(vendor_id) ON DELETE CASCADE,
                category VARCHAR(50) NOT NULL,
                name VARCHAR(100) NOT NULL,
                description TEXT,
                price DECIMAL(10,2) NOT NULL,
                image_url VARCHAR(255),
                unit VARCHAR(20),
                specifications TEXT,
                delivery_time VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # 6. Cart
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS cart (
                cart_id SERIAL PRIMARY KEY,
                customer_id INT REFERENCES customers(customer_id) ON DELETE CASCADE,
                item_type VARCHAR(10) CHECK (item_type IN ('Product', 'Service')),
                item_id INT NOT NULL,
                quantity INT DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # 7. Orders & Payments
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS orders (
                order_id SERIAL PRIMARY KEY,
                customer_id INT REFERENCES customers(customer_id) ON DELETE SET NULL,
                vendor_id INT REFERENCES vendors(vendor_id) ON DELETE SET NULL,
                order_type VARCHAR(10) CHECK (order_type IN ('Product', 'Service')),
                item_id INT NOT NULL,
                quantity INT DEFAULT 1,
                amount DECIMAL(12,2) NOT NULL,
                base_amount DECIMAL(12,2),
                gst_amount DECIMAL(12,2),
                commission_amount DECIMAL(12,2),
                total_amount DECIMAL(12,2),
                status VARCHAR(20) DEFAULT 'Pending',
                delivery_address TEXT,
                payment_method VARCHAR(20),
                vendor_credited BOOLEAN DEFAULT FALSE,
                is_bulk_request BOOLEAN DEFAULT FALSE,
                customer_message TEXT,
                vendor_message TEXT,
                negotiated_price DECIMAL(12,2),
                delivered_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS payments (
                txn_id VARCHAR(100) PRIMARY KEY,
                order_id INT REFERENCES orders(order_id) ON DELETE CASCADE,
                amount DECIMAL(12,2) NOT NULL,
                status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Completed', 'Failed', 'Refunded', 'Paid')),
                transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # 8. Financial Tracking (Commissions, Invoices, Payouts)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS commissions (
                commission_id SERIAL PRIMARY KEY,
                order_id INT REFERENCES orders(order_id) ON DELETE CASCADE,
                vendor_id INT REFERENCES vendors(vendor_id) ON DELETE CASCADE,
                commission_amount DECIMAL(12,2) NOT NULL,
                commission_rate DECIMAL(5,2) NOT NULL,
                status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Settled', 'Paid')),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                settled_date TIMESTAMP
            )
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS weekly_invoices (
                invoice_id SERIAL PRIMARY KEY,
                vendor_id INT REFERENCES vendors(vendor_id) ON DELETE CASCADE,
                amount DECIMAL(12,2) NOT NULL,
                status VARCHAR(20) DEFAULT 'Unpaid' CHECK (status IN ('Unpaid', 'Paid', 'Penalty Applied')),
                billing_period_start TIMESTAMP NOT NULL,
                billing_period_end TIMESTAMP NOT NULL,
                due_date TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS payouts (
                payout_id SERIAL PRIMARY KEY,
                vendor_id INT REFERENCES vendors(vendor_id) ON DELETE CASCADE,
                amount DECIMAL(12,2) NOT NULL,
                account_name VARCHAR(100),
                account_number VARCHAR(100),
                ifsc VARCHAR(50),
                status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Completed', 'Rejected')),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS vendorwallets (
                wallet_id SERIAL PRIMARY KEY,
                vendor_id INT UNIQUE REFERENCES vendors(vendor_id) ON DELETE CASCADE,
                balance DECIMAL(12,2) DEFAULT 0.00,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # 9. Logs & Preferences
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS email_notifications (
                id SERIAL PRIMARY KEY,
                user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
                email VARCHAR(255) NOT NULL,
                notification_type VARCHAR(50) NOT NULL,
                subject VARCHAR(255),
                sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                status VARCHAR(20) DEFAULT 'sent',
                metadata JSON
            )
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS email_logs (
                id SERIAL PRIMARY KEY,
                to_email VARCHAR(255),
                subject VARCHAR(255),
                status VARCHAR(50),
                error_message TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS login_activity (
                id SERIAL PRIMARY KEY,
                user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
                email VARCHAR(100),
                user_type VARCHAR(50),
                ip_address VARCHAR(50),
                user_agent TEXT,
                login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS notification_preferences (
                user_id INT PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
                user_type VARCHAR(20),
                login_alerts BOOLEAN DEFAULT TRUE,
                password_change_alerts BOOLEAN DEFAULT TRUE,
                profile_update_alerts BOOLEAN DEFAULT TRUE,
                product_update_alerts BOOLEAN DEFAULT TRUE,
                order_alerts BOOLEAN DEFAULT TRUE,
                qc_status_alerts BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS user_push_subscriptions (
                id SERIAL PRIMARY KEY,
                user_id INT UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
                subscription_json TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS contactmessages (
                message_id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100) NOT NULL,
                message TEXT NOT NULL,
                status VARCHAR(20) DEFAULT 'Unread',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # 10. Reviews & FAQs
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS itemreviews (
                review_id SERIAL PRIMARY KEY,
                item_type VARCHAR(10) CHECK (item_type IN ('Product', 'Service')),
                item_id INT NOT NULL,
                customer_id INT REFERENCES customers(customer_id) ON DELETE CASCADE,
                rating INT CHECK (rating >= 1 AND rating <= 5),
                comment TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS bookedservices (
                booking_id VARCHAR(50) PRIMARY KEY,
                customer_id INT REFERENCES customers(customer_id) ON DELETE CASCADE,
                vendor_id INT REFERENCES vendors(vendor_id) ON DELETE CASCADE,
                service_id INT REFERENCES services(service_id) ON DELETE CASCADE,
                status VARCHAR(20) DEFAULT 'Upcoming' CHECK (status IN ('Upcoming', 'Completed', 'Cancelled')),
                booking_date DATE NOT NULL,
                booking_time TIME NOT NULL,
                amount DECIMAL(10,2) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # 11. Legacy Tables (from original schema)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS faqs (
                faq_id SERIAL PRIMARY KEY,
                question VARCHAR(255) NOT NULL,
                answer TEXT NOT NULL,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS otp_verifications (
                otp_id SERIAL PRIMARY KEY,
                user_email VARCHAR(100) NOT NULL,
                otp_code VARCHAR(10) NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                is_verified BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS vendorearnings (
                earning_id SERIAL PRIMARY KEY,
                vendor_id INT REFERENCES vendors(vendor_id) ON DELETE CASCADE,
                order_id INT REFERENCES orders(order_id) ON DELETE CASCADE,
                booking_id VARCHAR(50) REFERENCES bookedservices(booking_id) ON DELETE CASCADE,
                earning_amount DECIMAL(12,2) NOT NULL,
                platform_fee DECIMAL(12,2) NOT NULL,
                net_payout DECIMAL(12,2) NOT NULL,
                status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Paid')),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS vendorreviews (
                review_id SERIAL PRIMARY KEY,
                vendor_id INT REFERENCES vendors(vendor_id) ON DELETE CASCADE,
                customer_id INT REFERENCES customers(customer_id) ON DELETE CASCADE,
                rating DECIMAL(2,1) CHECK (rating >= 1.0 AND rating <= 5.0),
                comment TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS orderitems (
                order_item_id SERIAL PRIMARY KEY,
                order_id INT REFERENCES orders(order_id) ON DELETE CASCADE,
                product_id INT REFERENCES products(product_id) ON DELETE CASCADE,
                quantity INT NOT NULL,
                price_at_time DECIMAL(12,2) NOT NULL
            )
        """)

        print("All tables created successfully in Neon!")
        
        # 11. Initial Platform Settings Seeds
        cursor.execute("INSERT INTO platformsettings (setting_key, setting_value) VALUES ('product_commission_pct', '3.0') ON CONFLICT (setting_key) DO NOTHING")
        cursor.execute("INSERT INTO platformsettings (setting_key, setting_value) VALUES ('service_commission_pct', '3.0') ON CONFLICT (setting_key) DO NOTHING")
        cursor.execute("INSERT INTO platformsettings (setting_key, setting_value) VALUES ('enable_vendor_registration', 'true') ON CONFLICT (setting_key) DO NOTHING")
        cursor.execute("INSERT INTO platformsettings (setting_key, setting_value) VALUES ('enable_customer_registration', 'true') ON CONFLICT (setting_key) DO NOTHING")
        cursor.execute("INSERT INTO platformsettings (setting_key, setting_value) VALUES ('auto_vendor_approval', 'false') ON CONFLICT (setting_key) DO NOTHING")
        print("Default platform settings seeded.")

        cursor.close()
        conn.close()

    except Exception as e:
        print(f"Error setting up Neon tables: {e}")

if __name__ == "__main__":
    setup_database()
