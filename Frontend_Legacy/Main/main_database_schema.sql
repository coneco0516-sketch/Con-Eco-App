-- ==========================================
-- CONECO DATABASE - MAIN FLOW EXTENSION
-- ==========================================
-- Make sure to run this AFTER creating the database_schema.sql
USE ConEcoDB;

-- 1. Contact Messages Table (For Contact.html)
CREATE TABLE IF NOT EXISTS ContactMessages (
    message_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    status ENUM('Unread', 'Read', 'Replied') DEFAULT 'Unread',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. FAQs Table (For FAQ.html)
CREATE TABLE IF NOT EXISTS FAQs (
    faq_id INT AUTO_INCREMENT PRIMARY KEY,
    question VARCHAR(255) NOT NULL,
    answer TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. OTP Verifications Table (For ForgotPassword.html / Registration)
CREATE TABLE IF NOT EXISTS OTP_Verifications (
    otp_id INT AUTO_INCREMENT PRIMARY KEY,
    user_email VARCHAR(100) NOT NULL,
    otp_code VARCHAR(10) NOT NULL,
    expires_at DATETIME NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- DUMMY DATA SEEDING ("TRAINING" THE MAIN DB)
-- ==========================================

-- Insert Contact Messages
INSERT INTO ContactMessages (name, email, message, status) VALUES
('John Doe', 'johndoe@example.com', 'I need help finding a reliable vendor for bulk cement.', 'Unread'),
('Sarah Smith', 'sarah@example.com', 'How long does the vendor verification process take?', 'Replied');

-- Insert FAQs (Matching FAQ.html)
INSERT INTO FAQs (question, answer, is_active) VALUES
('What is ConEco?', 'ConEco is a unified platform that connects customers with construction material vendors and service providers in one place.', TRUE),
('How do I register?', 'You can register by clicking on the Register button and selecting your role (Customer/Vendor).', TRUE),
('Are vendors verified?', 'Yes, all vendors go through a quality control (QC) verification process before being listed on the platform.', TRUE),
('How can I place an order?', 'Browse products/services, add them to your cart, and proceed to checkout.', TRUE),
('Can I track my orders?', 'Yes, you can track your orders from the "My Orders" section in your dashboard.', TRUE);

-- Insert OTP Verification Example
INSERT INTO OTP_Verifications (user_email, otp_code, expires_at, is_verified) VALUES
('rahul@email.com', '123456', DATE_ADD(NOW(), INTERVAL 10 MINUTE), FALSE);
