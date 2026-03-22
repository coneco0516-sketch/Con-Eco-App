# Con-Eco App - Version 0.2 (Beta Test Readiness)

*This document outlines the upcoming features and critical updates planned for the v0.2 release. These additions are mandatory blockers before the platform can be rolled out to real users for beta testing.*

---

## 1. Delivery Address Capture during Checkout (🚨 CRITICAL)
- **The Problem:** Right now on `Checkout.jsx`, the user reviews their cart and clicks "Pay via Razorpay". The system never asks them where to deliver the materials.
- **Why it's needed:** Construction materials are heavy. Vendors need the exact site location, city, and pincode to calculate freight and actually deliver the goods.
- **The Fix (v0.2):** Add an "Enter Delivery Address" form right before the Razorpay payment button in the checkout flow.

## 2. Product Images and Unit Specifications
- **The Problem:** In `Products.jsx`, items are currently just text boxes showing `Name`, `Price`, and `Vendor`.
- **Why it's needed:** A real contractor will not buy "Cement" without seeing a photo of the bag, knowing the brand, or knowing if the price is *per bag* or *per ton*.
- **The Fix (v0.2):** Add support for item images, a description field, and a "Unit" field (e.g., `₹400 / bag`, `₹7500 / ton`).

## 3. Search and Category Filters
- **The Problem:** Customers currently see a massive, unorganized list of everything.
- **Why it's needed:** If there are 5 vendors who each upload 20 items, a customer has to scroll through 100 random items to find TMT Steel, leading to immediate drop-off.
- **The Fix (v0.2):** Add a simple Search Bar and category dropdowns (e.g., Cement, Steel, Bricks, Electrical) to `Products.jsx`.

## 4. Basic Order Status Tracking
- **The Problem:** Once a payment is successful, there is no granular way to track what happens next.
- **Why it's needed:** Buyers spend lakhs on materials. They need real-time status updates from the vendor to coordinate site activities and avoid costly construction delays.
- **The Fix (v0.2):** Modify `VendorOrders` so vendors can update an order's status (`Pending` -> `Shipped` -> `Delivered`), and ensure `MyOrders` shows this status to the customer.

---
*End of v0.2 Planned Features.*
