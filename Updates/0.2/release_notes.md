# Con-Eco App - Version 0.2 (Beta Test Readiness)

*This document outlines the upcoming features and critical updates planned for the v0.2 release. These additions are mandatory blockers before the platform can be rolled out to real users for beta testing.*

---

## ✅ 1. Delivery Address Capture during Checkout (COMPLETED)
- **Status:** Fully Implemented.
- **Details:** Added a "Delivery Address" input field to `Checkout.jsx`. The address is now captured and stored in the `Orders` table. Vendors can view this in their order dashboard, and customers can see it in their order history.

## ✅ 2. Product Images and Unit Specifications (COMPLETED)
- **Status:** Fully Implemented.
- **Details:** Added `image_url` and `unit` fields to the `Products` and `Services` database tables. Updated the Vendor Catalogue to allow these fields to be entered. Products and services now display their images and unit pricing (e.g., ₹400 / bag) on the marketplace.

## ✅ 3. Search and Category Filters (COMPLETED)
- **Status:** Fully Implemented.
- **Details:** Added a Search bar and Category filter to both `Products.jsx` and `Services.jsx`. Customers can now quickly find items by name, description, or category.

## ✅ 4. Basic Order Status Tracking (COMPLETED)
- **Status:** Fully Implemented.
- **Details:** Vendors can now update order status through several stages: `Paid` -> `Shipped` -> `Out for Delivery` -> `Delivered`. These updates are reflected in real-time on the customer's `My Orders` and `My Booked Services` screens.

---
*v0.2 Release - Complete*

