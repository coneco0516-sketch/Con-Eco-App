# Con-Eco Update v0.4 Release Notes

**Date:** 25 March 2026  
**Status:** ✅ Deployed to Railway  
**Live URL:** https://con-eco-app-production.up.railway.app

---

## 🚀 New Features

### 1. Razorpay Payment Gateway Integration
- Connected Razorpay **Test Mode** keys to both local `.env` and Railway environment variables.
- Customers can now pay via **UPI** and **Credit/Debit Card** using the Razorpay popup on the Checkout page.
- Payment signature verification is handled securely on the backend before any order is placed.
- Supported payment methods: UPI, Card, COD, Pay Later (credit).

---

### 2. Dashboard — Test Version Popups
- A **glassy announcement popup** appears the first time a user logs in during a session.
- **Customer Dashboard Popup:** *"As this is a test version of the app, if you want to place an order, kindly select the payment option as only COD (Cash on Delivery)."*
- **Vendor Dashboard Popup:** *"As this is a test version of the app, all orders placed by customers will currently use COD (Cash on Delivery) only. Please process COD orders normally and check your Commission Bills page weekly."*
- Uses `sessionStorage` with separate keys (`vendor_announcement_seen` vs customer) so it shows only **once per browser session** per role.
- Styled with premium glassmorphism blur backdrop, dark overlay, and gold accent color.

---

### 3. Weekly COD Commission Invoicing System

#### How it works:
- For every COD order placed, the platform charges vendors a **5% commission** on the order amount.
- Every **Monday at 00:01 IST**, the system automatically calculates the total COD commissions for the past 7 days per vendor and generates a **weekly invoice**.
- Vendors have **3 days** to pay the invoice.
- Every **Thursday at 00:01 IST**, the system automatically checks for overdue unpaid invoices and applies penalties.

#### Penalty Lifecycle:
| Missed Payments | Penalty |
|---|---|
| 1st Miss | Vendor account set to **Unverified** (products/services hidden from customers) |
| 2nd Miss | Vendor account **Blocked permanently** from the platform |

- Paying an invoice **restores** the vendor's account status and resets their strike count.

#### Vendor — Commission Bills Page (`/vendor/billing`):
- New **"Commission Bills"** link added to the Vendor sidebar.
- Shows all invoices: billing period, amount owed, due date, and payment status.
- Vendors can pay directly via **Razorpay** from this page.
- On successful payment, account is automatically restored and commissions are marked as Paid.
- Shows the platform commission policy clearly at the bottom of the page.

#### Admin — Weekly Invoices View:
- New backend endpoints for Admin:
  - `GET /api/admin/weekly_invoices` — View all vendor invoices across the platform with outstanding/collected totals.
  - `POST /api/admin/generate_weekly_invoices` — Manually trigger invoice generation (for testing).
  - `POST /api/admin/enforce_commission_penalties` — Manually trigger penalty enforcement.
- **Admin UI Page Added (`/admin/commissions`):**
  - Admins can now view a full list of all vendor invoices, including the amount, due date, vendor name, strikes count, and status.
  - See totals for "Outstanding Unpaid" vs "Total Collected" platform-wide.
  - Two "Manual Controls" buttons added to allow admins to immediately generate invoices or enforce penalties without waiting for the automated scheduler.

---

### 4. Automated Scheduler (APScheduler)
- Integrated **APScheduler** into the FastAPI backend (runs as a background thread on the Railway server).
- The scheduler starts **automatically** every time the server boots — no manual action needed.
- **Weekly automation:**
  - 🗓️ **Every Monday 00:01 IST** → Invoice generation runs.
  - 🗓️ **Every Thursday 00:01 IST** → Penalty enforcement runs.
- Railway server logs will show: `[SCHEDULER] Started.` confirming it is active.

---

### 5. Customer Order Cancellation Flow
- Customers can now cancel their ordered Products and booked Services directly from the `My Orders` and `My Booked Services` pages.
- **Cancellation Rule:** Cancellation is ONLY permitted if the order status is currently **'Pending'**.
- If the status is 'Pending', clicking "Cancel Order" will immediately cancel the order and provide a **100% refund** logic for Online payments (UPI/Card). COD orders are also marked cancelled.
- **Post-Acceptance Rule:** If the vendor has already accepted the order (Status: 'Accepted', 'Processing', 'Shipped', etc.), the cancel button is disabled, instructing the customer to contact the vendor and request them to revert the status back to 'Pending' before a cancellation/refund can be processed.

---

## 🗄️ Database Changes

| Table | Change |
|---|---|
| `Users` | Added `is_blocked` column — blocks vendor login when set to `1` |
| `Vendors` | Added `commission_strikes` column — tracks how many times a vendor has missed payment |
| `weekly_invoices` | **New table** — stores billing period, amount, due date, and payment status per vendor |

---

## 📦 New Dependencies

| Package | Version | Purpose |
|---|---|---|
| `apscheduler` | 3.10.4 | Background job scheduling (weekly automation) |
| `pytz` | 2025.2 | IST timezone support for scheduler |

---

## 📁 Files Changed

### Backend
- `Backend/main.py` — APScheduler wired into FastAPI lifespan
- `Backend/commission_invoicing.py` — New: invoice generation & penalty logic
- `Backend/migrate_commissions.py` — DB migration script
- `Backend/routers/vendor.py` — Dashboard updated with commission data; `/invoices` endpoint added
- `Backend/routers/payment.py` — `/verify_invoice` endpoint for vendor commission payments
- `Backend/routers/admin.py` — Weekly invoice endpoints added
- `requirements.txt` — Added `apscheduler`, `pytz`

### Frontend
- `Frontend/src/pages/CustomerDashboard.jsx` — Test version popup added
- `Frontend/src/pages/VendorBilling.jsx` — **New page**: Vendor commission bills & Razorpay payment
- `Frontend/src/components/VendorSidebar.jsx` — "Commission Bills" nav link added
- `Frontend/src/App.jsx` — `/vendor/billing` route registered

---

## ✅ Deployment

- Frontend built with Vite (`npm run build`) ✅
- Committed and pushed to `main` branch on GitHub ✅
- Railway auto-deployed from GitHub push ✅
- Environment variables (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`) set on Railway ✅