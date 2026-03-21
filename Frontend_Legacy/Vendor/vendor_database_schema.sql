-- ==========================================
-- CONECO DATABASE - VENDOR FLOW EXTENSION
-- ==========================================
-- Make sure to run this AFTER creating the main database (database_schema.sql) 
-- and customer database (customer_database_schema.sql)
USE ConEcoDB;

-- 1. Vendor Reviews & Ratings Table (For VendorAnalytics ⭐ 4.5/5)
CREATE TABLE IF NOT EXISTS VendorReviews (
    review_id INT AUTO_INCREMENT PRIMARY KEY,
    vendor_id INT,
    customer_id INT,
    rating DECIMAL(2,1) CHECK (rating >= 1.0 AND rating <= 5.0),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vendor_id) REFERENCES Vendors(vendor_id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES Customers(customer_id) ON DELETE CASCADE
);

-- 2. Vendor Payouts & Earnings Table (For Earnings.html)
CREATE TABLE IF NOT EXISTS VendorEarnings (
    earning_id INT AUTO_INCREMENT PRIMARY KEY,
    vendor_id INT,
    order_id INT NULL,
    booking_id VARCHAR(50) NULL,
    earning_amount DECIMAL(10,2) NOT NULL,
    platform_fee DECIMAL(10,2) NOT NULL,
    net_payout DECIMAL(10,2) NOT NULL,
    status ENUM('Pending', 'Paid') DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vendor_id) REFERENCES Vendors(vendor_id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES Orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (booking_id) REFERENCES BookedServices(booking_id) ON DELETE CASCADE
);

-- ==========================================
-- DUMMY DATA SEEDING ("TRAINING" THE VENDOR DB)
-- ==========================================

-- Seeding more Products for Vendor 6 (ABC Constructions) to populate their Catalogue
INSERT INTO Products (vendor_id, category, name, description, price, image_url, stock_quantity) VALUES
(6, 'Construction Materials', 'Fine Sand', 'High quality river sand for construction', 4000.00, 'sand.jpg', 50),
(6, 'Construction Materials', 'Gravel', 'Crushed stone gravel', 3000.00, 'gravel.jpg', 100);

-- Seeding more Services
INSERT INTO Services (vendor_id, category, name, description, price, image_url) VALUES
(6, 'Labor Services', 'Daily Wage Labor', 'Skilled construction workers', 600.00, 'labor.jpg');

-- Seeding Orders for Vendor 6 to match VendorOrderSummary
-- Note: Vendor 6 is already in Vendors table
INSERT INTO Orders (order_id, customer_id, vendor_id, order_type, amount, status) VALUES
(101, 2, 6, 'Product', 3500.00, 'Pending'),
(102, 3, 6, 'Service', 2000.00, 'Completed'),
(103, 4, 6, 'Product', 5000.00, 'Cancelled');

-- Linking VendorEarnings (Earnings.html Dummy Data)
-- Simulating Transaction History records: Total Earnings, Pending Payments, etc.
INSERT INTO VendorEarnings (vendor_id, order_id, earning_amount, platform_fee, net_payout, status) VALUES
(6, 101, 3500.00, 350.00, 3150.00, 'Paid'),  
(6, 102, 2000.00, 200.00, 1800.00, 'Pending'),
(6, 103, 5000.00, 500.00, 4500.00, 'Paid');

-- Add Vendor Reviews (Analytics Dashboard -> 4.5/5 from 120 reviews)
INSERT INTO VendorReviews (vendor_id, customer_id, rating, comment) VALUES
(6, 2, 5.0, 'Excellent quality materials and on-time delivery.'),
(6, 3, 4.0, 'Good service but slightly delayed response.'),
(6, 4, 4.5, 'Very professional labor team.');
