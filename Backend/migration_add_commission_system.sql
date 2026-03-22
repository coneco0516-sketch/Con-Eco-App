-- Migration: Add Commission Tracking System
-- This script adds commission columns to Orders table and creates Commissions table
-- Platform Commission Rate: 5%

-- Step 1: Add commission columns to Orders table
ALTER TABLE orders 
ADD COLUMN base_amount DECIMAL(10,2) DEFAULT 0 AFTER amount,
ADD COLUMN commission_amount DECIMAL(10,2) DEFAULT 0 AFTER base_amount,
ADD COLUMN total_amount DECIMAL(10,2) DEFAULT 0 AFTER commission_amount;

-- Step 2: Migrate existing orders
-- For existing orders, recalculate as: base = amount/1.05, commission = amount*5/105
UPDATE orders 
SET 
    base_amount = ROUND(amount / 1.05, 2),
    commission_amount = ROUND(amount - (amount / 1.05), 2),
    total_amount = amount
WHERE base_amount = 0 AND total_amount = 0;

-- Step 3: Create Commissions tracking table
CREATE TABLE IF NOT EXISTS commissions (
    commission_id INT NOT NULL AUTO_INCREMENT,
    order_id INT NOT NULL,
    vendor_id INT NOT NULL,
    commission_amount DECIMAL(10,2) NOT NULL,
    commission_rate DECIMAL(5,2) DEFAULT 5.00,
    status ENUM('Pending', 'Settled', 'Paid') DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    settled_date TIMESTAMP NULL,
    PRIMARY KEY (commission_id),
    KEY order_id (order_id),
    KEY vendor_id (vendor_id),
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (vendor_id) REFERENCES vendors(vendor_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Step 4: Populate commissions table from orders
INSERT INTO commissions (order_id, vendor_id, commission_amount, status, created_at)
SELECT 
    o.order_id, 
    o.vendor_id, 
    o.commission_amount, 
    'Settled',
    o.created_at
FROM orders o
WHERE o.commission_amount > 0
ON DUPLICATE KEY UPDATE status = 'Settled';

-- Verification queries
SELECT 'Migration Complete! Commission System Enabled' as status;
SELECT COUNT(*) as total_orders, 
       SUM(base_amount) as total_vendor_earnings,
       SUM(commission_amount) as total_platform_commission 
FROM orders;
