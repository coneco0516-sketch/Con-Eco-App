-- ConEco PostgreSQL Schema for Supabase
-- Converted from MySQL schema_full.sql

-- 1. Create Users Table (Parent of many)
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(15) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('Admin', 'Customer', 'Vendor')),
    email_verified BOOLEAN DEFAULT FALSE,
    email_verification_token VARCHAR(255),
    email_verification_sent_at TIMESTAMP,
    reset_password_token VARCHAR(255),
    reset_password_sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create Customers Table
CREATE TABLE customers (
    customer_id INT PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    city VARCHAR(50),
    state VARCHAR(50),
    verification_status VARCHAR(20) DEFAULT 'Pending' CHECK (verification_status IN ('Pending', 'Verified', 'Blocked'))
);

-- 3. Create Vendors Table
CREATE TABLE vendors (
    vendor_id INT PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    company_name VARCHAR(100) NOT NULL,
    gst_number VARCHAR(15) UNIQUE,
    address TEXT,
    city VARCHAR(50),
    state VARCHAR(50),
    verification_status VARCHAR(20) DEFAULT 'Pending' CHECK (verification_status IN ('Pending', 'Verified', 'Rejected')),
    qc_score INT DEFAULT 0 CHECK (qc_score >= 0 AND qc_score <= 100)
);

-- 4. Create Products Table
CREATE TABLE products (
    product_id SERIAL PRIMARY KEY,
    vendor_id INT REFERENCES vendors(vendor_id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    image_url VARCHAR(255),
    stock_quantity INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Create Services Table
CREATE TABLE services (
    service_id SERIAL PRIMARY KEY,
    vendor_id INT REFERENCES vendors(vendor_id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    image_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Create Orders Table
CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    customer_id INT REFERENCES customers(customer_id) ON DELETE SET NULL,
    vendor_id INT REFERENCES vendors(vendor_id) ON DELETE SET NULL,
    item_id INT, -- Can refer to product or service
    quantity INT,
    order_type VARCHAR(20) NOT NULL CHECK (order_type IN ('Product', 'Service')),
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Processing', 'Completed', 'Cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Create OrderItems Table
CREATE TABLE orderitems (
    order_item_id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(order_id) ON DELETE CASCADE,
    product_id INT REFERENCES products(product_id) ON DELETE CASCADE,
    quantity INT NOT NULL,
    price_at_time DECIMAL(10,2) NOT NULL
);

-- 8. Create BookedServices Table
CREATE TABLE bookedservices (
    booking_id VARCHAR(50) PRIMARY KEY, -- Using UUID or manual string IDs as before
    customer_id INT REFERENCES customers(customer_id) ON DELETE CASCADE,
    vendor_id INT REFERENCES vendors(vendor_id) ON DELETE CASCADE,
    service_id INT REFERENCES services(service_id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'Upcoming' CHECK (status IN ('Upcoming', 'Completed', 'Cancelled')),
    booking_date DATE NOT NULL,
    booking_time TIME NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. Create Cart Table
CREATE TABLE cart (
    cart_id SERIAL PRIMARY KEY,
    customer_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    item_type VARCHAR(20) CHECK (item_type IN ('Product', 'Service')),
    item_id INT,
    quantity INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. Create Payments Table
CREATE TABLE payments (
    txn_id VARCHAR(50) PRIMARY KEY,
    order_id INT REFERENCES orders(order_id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Completed', 'Failed')),
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. Create VendorEarnings Table
CREATE TABLE vendorearnings (
    earning_id SERIAL PRIMARY KEY,
    vendor_id INT REFERENCES vendors(vendor_id) ON DELETE CASCADE,
    order_id INT REFERENCES orders(order_id) ON DELETE CASCADE,
    booking_id VARCHAR(50) REFERENCES bookedservices(booking_id) ON DELETE CASCADE,
    earning_amount DECIMAL(10,2) NOT NULL,
    platform_fee DECIMAL(10,2) NOT NULL,
    net_payout DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Paid')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 12. Create VendorReviews Table
CREATE TABLE vendorreviews (
    review_id SERIAL PRIMARY KEY,
    vendor_id INT REFERENCES vendors(vendor_id) ON DELETE CASCADE,
    customer_id INT REFERENCES customers(customer_id) ON DELETE CASCADE,
    rating DECIMAL(2,1) CHECK (rating >= 1.0 AND rating <= 5.0),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 13. Create PlatformSettings Table
CREATE TABLE platformsettings (
    setting_id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT NOT NULL
);

-- 14. Create ContactMessages Table
CREATE TABLE contactmessages (
    message_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'Unread' CHECK (status IN ('Unread', 'Read', 'Replied')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 15. Create OTP Verifications Table
CREATE TABLE otp_verifications (
    otp_id SERIAL PRIMARY KEY,
    user_email VARCHAR(100) NOT NULL,
    otp_code VARCHAR(10) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 16. Login Activity Table
CREATE TABLE login_activity (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    email VARCHAR(100),
    user_type VARCHAR(20),
    ip_address VARCHAR(50),
    user_agent TEXT,
    device_info VARCHAR(100),
    login_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 17. Notification Preferences Table
CREATE TABLE notification_preferences (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    user_type VARCHAR(20),
    login_alerts BOOLEAN DEFAULT TRUE,
    password_change_alerts BOOLEAN DEFAULT TRUE,
    profile_update_alerts BOOLEAN DEFAULT TRUE,
    product_update_alerts BOOLEAN DEFAULT TRUE,
    order_alerts BOOLEAN DEFAULT TRUE,
    qc_status_alerts BOOLEAN DEFAULT FALSE
);

-- 18. Credit Scores Table (Implicitly suggested by auth routes)
CREATE TABLE credit_scores (
    id SERIAL PRIMARY KEY,
    customer_id INT REFERENCES customers(customer_id) ON DELETE CASCADE,
    credit_score INT DEFAULT 100,
    pay_later_blocked BOOLEAN DEFAULT FALSE,
    blocked_until TIMESTAMP
);

-- Insert Default Settings
INSERT INTO platformsettings (setting_key, setting_value) VALUES 
('enable_vendor_registration', 'true'),
('enable_customer_registration', 'true'),
('server_maintenance_mode', 'false');
