-- ==========================================
-- CONECO DATABASE - CUSTOMER FLOW EXTENSION
-- ==========================================
-- Make sure to run this AFTER creating the main database (database_schema.sql)
USE ConEcoDB;

-- 1. Products Table
CREATE TABLE IF NOT EXISTS Products (
    product_id INT AUTO_INCREMENT PRIMARY KEY,
    vendor_id INT,
    category VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    image_url VARCHAR(255),
    stock_quantity INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vendor_id) REFERENCES Vendors(vendor_id) ON DELETE CASCADE
);

-- 2. Services Table
CREATE TABLE IF NOT EXISTS Services (
    service_id INT AUTO_INCREMENT PRIMARY KEY,
    vendor_id INT,
    category VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    image_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vendor_id) REFERENCES Vendors(vendor_id) ON DELETE CASCADE
);

-- 3. Shopping Cart
CREATE TABLE IF NOT EXISTS Cart (
    cart_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES Customers(customer_id) ON DELETE CASCADE
);

-- 4. Cart Items (Products)
CREATE TABLE IF NOT EXISTS CartItems (
    cart_item_id INT AUTO_INCREMENT PRIMARY KEY,
    cart_id INT,
    product_id INT,
    quantity INT DEFAULT 1,
    FOREIGN KEY (cart_id) REFERENCES Cart(cart_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES Products(product_id) ON DELETE CASCADE
);

-- 5. Cart Services
CREATE TABLE IF NOT EXISTS CartServices (
    cart_service_id INT AUTO_INCREMENT PRIMARY KEY,
    cart_id INT,
    service_id INT,
    scheduled_date DATE,
    FOREIGN KEY (cart_id) REFERENCES Cart(cart_id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES Services(service_id) ON DELETE CASCADE
);

-- 6. Order Items (to support multiple products in one order from MyOrders.html)
CREATE TABLE IF NOT EXISTS OrderItems (
    order_item_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT,
    product_id INT,
    quantity INT NOT NULL,
    price_at_time DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES Orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES Products(product_id) ON DELETE CASCADE
);

-- 7. Booked Services (from MyBookedServices.html)
CREATE TABLE IF NOT EXISTS BookedServices (
    booking_id VARCHAR(50) PRIMARY KEY,
    customer_id INT,
    vendor_id INT,
    service_id INT,
    status ENUM('Upcoming', 'Completed', 'Cancelled') DEFAULT 'Upcoming',
    booking_date DATE NOT NULL,
    booking_time TIME NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES Customers(customer_id) ON DELETE CASCADE,
    FOREIGN KEY (vendor_id) REFERENCES Vendors(vendor_id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES Services(service_id) ON DELETE CASCADE
);

-- ==========================================
-- DUMMY DATA SEEDING ("TRAINING" THE DATABASE)
-- ==========================================

-- Insert Products
INSERT INTO Products (product_id, vendor_id, category, name, description, price, image_url, stock_quantity) VALUES
(1, 6, 'Cement', 'UltraTech Cement', '50kg bag of premium OPC cement', 350.00, 'img1.jpg', 500),
(2, 7, 'Steel', 'TMT Steel Bars', 'High quality reinforcement bars', 600.00, 'img2.jpg', 1000),
(3, 8, 'Bricks', 'Red Bricks', 'Standard clay building bricks', 8.00, 'img3.jpg', 10000);

-- Insert Services
INSERT INTO Services (service_id, vendor_id, category, name, description, price, image_url) VALUES
(1, 6, 'Plumbing', 'Plumbing Service', 'Expert plumbing solutions for homes & buildings.', 500.00, 'img1.jpg'),
(2, 7, 'Electrical', 'Electrical Work', 'Professional electrical installation & repair.', 700.00, 'img2.jpg'),
(3, 8, 'Painting', 'Painting Service', 'Interior & exterior painting services.', 2000.00, 'img3.jpg'),
(4, 6, 'Carpentry', 'Carpentry', 'Custom woodwork and furniture services.', 800.00, 'img4.jpg');

-- Insert Cart
INSERT INTO Cart (cart_id, customer_id) VALUES (1, 2);

-- Insert Cart Items (Matches Cart.html)
INSERT INTO CartItems (cart_id, product_id, quantity) VALUES
(1, 1, 2), -- 2 bags of Cement (350 each)
(1, 2, 1); -- 1 piece of Steel (600)

-- Insert Cart Services (Matches Cart.html)
INSERT INTO CartServices (cart_id, service_id, scheduled_date) VALUES
(1, 1, '2026-03-25'); -- Plumbing service

-- Update previously seeded Order to add Order Items (Matches MyOrders.html #ORD12345)
INSERT INTO OrderItems (order_id, product_id, quantity, price_at_time) VALUES
(1, 1, 2, 350.00), -- 2 Cement = 700
(1, 2, 1, 600.00); -- 1 Steel = 600

-- Create a new pending order for Bricks (#ORD12346 from MyOrders.html)
INSERT INTO Orders (order_id, customer_id, vendor_id, order_type, amount, status) VALUES
(4, 2, 8, 'Material', 800.00, 'Pending');

INSERT INTO OrderItems (order_id, product_id, quantity, price_at_time) VALUES
(4, 3, 100, 8.00); -- 100 Bricks = 800

-- Insert Booked Services (Matches MyBookedServices.html)
INSERT INTO BookedServices (booking_id, customer_id, vendor_id, service_id, status, booking_date, booking_time, amount) VALUES
('SRV1001', 2, 6, 1, 'Completed', '2026-03-20', '10:00:00', 500.00),
('SRV1002', 2, 7, 2, 'Upcoming', '2026-03-25', '14:00:00', 700.00),
('SRV1003', 2, 8, 3, 'Cancelled', '2026-03-18', '09:00:00', 2000.00);
