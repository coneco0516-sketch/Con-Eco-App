-- ==========================================
-- CONECO DATABASE CREATION & SCHEMA
-- ==========================================

CREATE DATABASE IF NOT EXISTS ConEcoDB;
USE ConEcoDB;

-- 1. Users Table (Shared for Admin, Customer, Vendor)
CREATE TABLE Users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(15) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('Admin', 'Customer', 'Vendor') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Customer Details Table
CREATE TABLE Customers (
    customer_id INT PRIMARY KEY,
    city VARCHAR(50),
    state VARCHAR(50),
    verification_status ENUM('Pending', 'Verified', 'Blocked') DEFAULT 'Pending',
    FOREIGN KEY (customer_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

-- 3. Vendor Details Table
CREATE TABLE Vendors (
    vendor_id INT PRIMARY KEY,
    company_name VARCHAR(100) NOT NULL,
    gst_number VARCHAR(15) UNIQUE,
    address TEXT,
    city VARCHAR(50),
    state VARCHAR(50),
    verification_status ENUM('Pending', 'Verified', 'Rejected') DEFAULT 'Pending',
    qc_score INT DEFAULT 0 CHECK (qc_score >= 0 AND qc_score <= 100),
    FOREIGN KEY (vendor_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

-- 4. Orders Table
CREATE TABLE Orders (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT,
    vendor_id INT,
    order_type ENUM('Material', 'Service') NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status ENUM('Pending', 'Processing', 'Completed', 'Cancelled') DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES Customers(customer_id) ON DELETE SET NULL,
    FOREIGN KEY (vendor_id) REFERENCES Vendors(vendor_id) ON DELETE SET NULL
);

-- 5. Payments Table
CREATE TABLE Payments (
    txn_id VARCHAR(50) PRIMARY KEY,
    order_id INT,
    amount DECIMAL(10,2) NOT NULL,
    status ENUM('Pending', 'Completed', 'Failed') DEFAULT 'Pending',
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES Orders(order_id) ON DELETE CASCADE
);

-- 6. Platform Settings
CREATE TABLE PlatformSettings (
    setting_id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL
);

-- ==========================================
-- DUMMY DATA SEEDING ("TRAINING" THE DATABASE)
-- ==========================================

-- Insert Users
INSERT INTO Users (name, email, phone, password_hash, role) VALUES
('Super Admin', 'admin@coneco.com', '9999999999', 'hashed_pw_here', 'Admin'),
('Rahul Patil', 'rahul@email.com', '9876543210', 'hashed_pw_here', 'Customer'),
('Sneha Kulkarni', 'sneha@email.com', '9123456780', 'hashed_pw_here', 'Customer'),
('Ravi Kumar', 'ravi@email.com', '9876541230', 'hashed_pw_here', 'Customer'),
('Anjali', 'anjali@email.com', '9871234560', 'hashed_pw_here', 'Customer'),
('Rahul Sharma', 'rahul.s@abc.com', '9988776655', 'hashed_pw_here', 'Vendor'),
('Amit Verma', 'amit@xyz.com', '9977885544', 'hashed_pw_here', 'Vendor'),
('BuildPro Owner', 'owner@buildpro.com', '9966554433', 'hashed_pw_here', 'Vendor');

-- Insert Customers
INSERT INTO Customers (customer_id, city, state, verification_status) VALUES
(2, 'Belgaum', 'Karnataka', 'Pending'),
(3, 'Hubli', 'Karnataka', 'Verified'),
(4, 'Bangalore', 'Karnataka', 'Verified'),
(5, 'Pune', 'Maharashtra', 'Verified');

-- Insert Vendors
INSERT INTO Vendors (vendor_id, company_name, gst_number, address, city, state, verification_status, qc_score) VALUES
(6, 'ABC Constructions', '29ABCDE1234F1Z5', '123 Main St', 'Belgaum', 'Karnataka', 'Pending', 78),
(7, 'XYZ Builders', '29XYZ9876ABC1Z5', '456 Cross Rd', 'Hubli', 'Karnataka', 'Verified', 62),
(8, 'BuildPro', '29BPRO1234DEF56', '789 High St', 'Bangalore', 'Karnataka', 'Verified', 90);

-- Insert Orders (Matches AdminOrderSummary.html)
INSERT INTO Orders (customer_id, vendor_id, order_type, amount, status) VALUES
(4, 6, 'Material', 25000.00, 'Pending'),       -- Ravi & ABC Suppliers
(5, 7, 'Service', 10000.00, 'Completed'),     -- Anjali & XYZ Services
(2, 8, 'Material', 40000.00, 'Processing');   -- Rahul & BuildPro

-- Insert Payments (Matches Payments.html)
INSERT INTO Payments (txn_id, order_id, amount, status) VALUES
('TXN1001', 1, 25000.00, 'Completed'),
('TXN1002', 2, 10000.00, 'Pending'),
('TXN1003', 3, 40000.00, 'Failed');

-- Insert Settings
INSERT INTO PlatformSettings (setting_key, setting_value) VALUES
('site_name', 'ConEco'),
('contact_email', 'support@coneco.com'),
('maintenance_mode', 'false');
