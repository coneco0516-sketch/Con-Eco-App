# Con-Eco App - Version 0.1 (Base MVP)

*This document outlines the core features and capabilities built into the v0.1 release of the Con-Eco platform before any advanced beta-testing features are added.*

---

## 1. Authentication & Security
- **Role-Based Access Control:** Separate flows for `Vendor`, `Customer`, and `Admin`.
- **JWT Authentication:** Secure login using JSON Web Tokens stored in `localStorage` for cross-origin API calls.
- **Registration & Login:** Dedicated pages for user onboarding.
- **Password Management:** Forgot password placeholder implemented.
- **Email Verification:** Flows established for VerifyEmail and VerifyEmailSent.

## 2. Vendor Portal
- **Dashboard (`VendorDashboard`):** High-level view of catalogue, orders, earnings, and analytics. Also displays real-time admin **verification status** (Pending/Approved/Rejected).
- **Catalogue Management (`Catalogue.jsx`):** Vendors can add and manage their construction materials and services.
- **Order Management (`VendorOrders`):** Vendors can view incoming customer orders for their materials.
- **Financials:** 
  - `Earnings.jsx`: Track revenue and payouts.
  - `VendorAnalytics.jsx`: Analyze sales performance.
- **Profile Management:** Manage business details, phone, and GST information.

## 3. Customer Portal
- **Dashboard (`CustomerDashboard`):** Quick access to products, services, cart, and order history.
- **Marketplace Browsing:**
  - `Products.jsx`: Browse construction materials listed by various vendors.
  - `Services.jsx`: Browse specialized construction services.
- **Cart & Checkout:**
  - `Cart.jsx`: Manage selected items, viewing base price + platform commission (5%).
  - `Checkout.jsx`: Unified checkout flow integrating Razorpay for secure card/UPI payments.
- **Order Tracking:**
  - `MyOrders.jsx`: History of purchased materials.
  - `MyBookedServices.jsx`: History of requested services.
- **Profile Management:** Update personal and contact information.

## 4. Admin Portal
- **Dashboard (`AdminDashboard`):** Centralized view of platform statistics (total users, active vendors, revenue).
- **User Verification:**
  - `VendorVerification`: Approve or reject vendor accounts to maintain platform quality.
  - `CustomerVerification`: Manage customer accounts.
- **Platform Monitoring:**
  - `AdminOrders`: View all marketplace orders across the platform.
  - `AdminPayments`: Monitor Razorpay success/failure logs and platform commissions.
  - `AdminAnalytics`: High-level metrics for overall platform health.
- **Platform Settings:** Manage global configs like Notification Settings.

## 5. UI/UX & General Features
- **Responsive Layouts:** Modern glassmorphism UI with dedicated sidebars for each user role.
- **Public Legal Pages:** `About.jsx`, `Contact.jsx`, `FAQ.jsx`, `Privacy.jsx`, `Terms.jsx`.
- **API Interceptors:** Centralized `auth.js` for handling persistent authenticated API calls seamlessly.

---
*End of v0.1 Documentation.*
