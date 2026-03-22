# Con-Eco Update v0.2 Release Notes

## 🚀 New Features & Enhancements

### 1. Delivery Address Capture during Checkout (🚨 CRITICAL)
- **Problem**: Previously, site locations were not captured during checkout.
- **Solution**: Added a mandatory "Delivery Address" input field in `Checkout.jsx`. 
- **Impact**: Vendors now receive exact site locations, enabling accurate delivery of heavy construction materials.
- **Visibility**: Address is displayed on Vendor Order Dashboards and Customer's Order History.

### 2. Enhanced Product Visuals and Unit Specifications
- **Problem**: Products previously lacked brand photos and unit pricing.
- **Solution**: Added support for `image_url`, `description`, and `unit` (e.g., ₹400 / bag, ₹7500 / ton) in `Products.jsx` and `Services.jsx`.
- **Impact**: Contractors can now make informed decisions based on brands and specific unit costs.

### 3. Integrated Image Upload Feature
- **Problem**: Vendors could only provide external URLs for product images.
- **Solution**: Implemented a full file-upload system using **FastAPI `UploadFile`** and a custom UI in the Vendor Catalogue.
- **Impact**: Vendors can now upload photos directly from their computer, which are saved and served from the project's `/uploads` folder.

### 4. Marketplace Search and Category Filters
- **Problem**: Customers had to scroll through unorganized lists.
- **Solution**: Added global search bars and category filters to both Products and Services pages.
- **Impact**: Significant improvement in product discovery.

### 5. Order Status Tracking & Vendor Control
- **Problem**: Customers couldn't track order progress.
- **Solution**: Implemented a status lifecycle managed by Vendors (`Paid` → `Shipped` → `Out for Delivery` → `Delivered`).
- **Impact**: Real-time transparency for customers on their order status.

### 6. Platform Commission System
- **Solution**: Integrated a persistent 5% platform commission logic.
- **Technical**: Updated `Orders` schema to track `base_amount` and `commission_amount`. Created a `commissions` table for accounting.

## 🛠️ Infrastructure & Deployment Fixes
- **Static Asset Serving**: Fixed backend configuration to correctly serve static root files (e.g., videos, uploaded images) bypassing the React index catch-all.
- **Deployment Speed**: Restored fast Nixpacks-based deployment by pre-building the `dist` folder and serving it via Python, reducing build times by 80%.
- **OOM Prevention**: Configured Node memory limits (`--max-old-space-size=448`) to ensure successful Vite builds on memory-limited Railway instances.
- **Locked Versions**: Stabilized `vite` and `@vitejs/plugin-react` versions to fix building conflicts on high Node versions.

## ⚖️ Database Schema Updates
- `Orders`: ADD COLUMN `delivery_address` (TEXT).
- `Products`/`Services`: ADD COLUMN `image_url` (TEXT), `description` (TEXT), `unit` (VARCHAR(50)).
- NEW TABLES: `commissions`, `notification_preferences`.
