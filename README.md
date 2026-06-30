# ConEco — B2B E-Commerce Platform

A professional full-stack B2B marketplace designed to connect **Customers**, **Vendors**, and **Admins** through a streamlined commission-based model. Built for performance, legal compliance, and a premium user experience.

---

## 🚀 Live Demo

**Production URL:** *(Deployed on Render — link available after deployment)*

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Billing & Commissions](#-billing--commissions)
- [GST Billing System](#-gst-billing-system)
- [Email System](#-email-system)
- [Future Features Roadmap](#-future-features-roadmap)
- [Deployment](#-deployment)

---

## ✨ Features

### 👤 Authentication & Security
- Secure registration with **email verification** via Brevo.
- Role-based access: **Customer**, **Vendor**, and **Admin Hierarchy** (Super Admin, Admin, Employee).
- Granular permission system for administrative staff.
- Login activity monitoring with security alerts.
- **Web Push Notifications**: Real-time alerts for orders and security events.

### 🛍️ Customers
- Unified product & service catalogue with detailed overview pages.
- **Smart Address Book**: Manage multiple delivery addresses (Home, Office, Project Site) with intelligent **Pincode Auto-fill** powered by the India Post API.
- **Service & Product Lifecycles**: Distinct, visually tracked lifecycles (Products: Processing -> Delivered; Services: Scheduled -> Completed).
- **Bulk Price Negotiation**: Request custom quotes for large orders.
- Direct order placement via **COD** (Cash on Delivery).
- **Pay Later Credit Tab**: Place orders on credit, pay within 7–14 days.
- **GST & Non-GST Billing**: Select bill type at checkout — GST Tax Invoice for ITC claims or a Simple Bill for retail purchases. GST option is auto-restricted if vendor is not GST-registered.
- Real-time order tracking with automated status updates.
- **Download Bill**: Once the vendor uploads the bill post-delivery, customers can download it directly from "My Orders."
- **Service Milestone Payments**: For long-term service bookings, customers can view the vendor's milestone payment plan, track progress per phase, approve completed work, and release payment milestone-by-milestone — acting as a built-in offline escrow.
- **Project-Based Procurement**: Customers can create and manage **Project Sites** (e.g., a construction site or factory), then directly link orders to a project for organised, site-wise procurement tracking.
- **RFQ Engine (Reverse Auction)**: Submit a Request for Quotation with quantity, description, and deadline. Vendors browse and submit competitive bids. Customer selects the best offer and places the order directly from the RFQ.
- **PWA Ready**: Installable on mobile and desktop for a native experience.

### 🏪 Vendors
- Transparent **Earnings Dashboard** (Gross vs Commission vs Net).
- **Business Address Book**: Store multi-location logistics data (Warehouse, Registered Office, Pickup Point).
- **Bulk Price Management**: Rapidly update prices across the entire catalogue.
- **Dynamic Order Acceptance**: Accept custom bulk negotiations and directly alter unit pricing from the dashboard.
- **Vendor Wallet**: Automated earnings tracking with Bank Withdrawal (Payout) requests.
- **Bill Upload System**: Upload GST Tax Invoices or Simple Bills for each order from the dashboard. Each order card clearly shows the customer's requested bill type.
- **Service Milestone Management**: For service orders, vendors can define a structured milestone payment plan (title, description, scheduled date, payment %). Mark each milestone as completed with progress notes; customer then approves and releases that phase's payment.
- Weekly automated billing system with downloadable compliance receipts.
- Professional QC verification system for platform-wide quality control.

### 🛡️ Admin Dashboard (Multi-Tier)
- **Super Admin**: Full access to financial logs, bank payouts, platform settings, and **Staff Management**.
- **Admin**: Operational management including vendor/customer verification and bulk pricing controls.
- **Employee**: Support role focused on order tracking and customer contact message replies.
- **Commission Penalty System**: Automated "Strike" system for overdue payments.
- **Credit Limit Management**: Assign and monitor customer Pay Later credit.
- **RFQ Monitor**: Admins can view all active RFQ submissions across the platform for oversight and dispute handling.

### 🎨 UI/UX — Premium Glassmorphism Design System
- Full platform redesigned across **4 polish phases** covering all 20+ pages.
- Consistent dark-mode glassmorphism design language (`glass-panel`, gradient accents, `var(--primary-color)` tokens).
- Responsive sidebars, animated stat cards, shimmer skeleton loaders, and micro-animations throughout.
- Polished pages include: Home, Login, Register, Dashboards (Customer/Vendor/Admin), Cart, Checkout, My Orders, My Booked Services, FAQ, Forgot/Reset Password, Earnings KPI, Profiles (Customer/Vendor), Item Detail pages, and Analytics views.

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18 + Vite + PWA |
| **Backend** | FastAPI (Python 3.12) |
| **Database** | Neon PostgreSQL (Serverless) |
| **Push Notifications** | PyWebPush (VAPID) |
| **Hosting** | Render (Backend + Frontend) |
| **Email** | Brevo HTTP API (Transactional) |
| **Auth** | JWT + bcrypt (Session Cookies) |
| **Invoicing** | fpdf2 + PDF Generation |
| **Payments** | Razorpay (UPI, Card, Net Banking) |

---

## 📁 Project Structure

```
ConEco/
├── Backend/
│   ├── routers/                 # API Endpoints (Auth, Vendor, Customer, Admin, Payment, Invoice, Milestones)
│   │   └── milestones.py        # Service Milestone Payments API
│   ├── main.py                  # Core Application & Scheduler
│   ├── email_service.py         # Brevo Email Infrastructure
│   ├── push_service.py          # Web Push Notification Engine
│   ├── database.py              # Neon PostgreSQL Connection
│   ├── setup_neon.py            # DB Schema Setup Script
│   ├── invoice_generator.py     # Professional PDF Invoice Logic
│   ├── commission_invoicing.py  # Billing & Penalty Automation
│   ├── migrate_gst_billing.py   # GST billing schema migration
│   ├── migrate_project_sites.py # ProjectSites table migration
│   ├── migrate_rfq_system.py    # RFQ / Reverse Auction schema migration
│   └── migrate_milestones.py    # ServiceMilestones table migration
│
├── Frontend/
│   ├── src/
│   │   ├── pages/               # Functional UI Components (20+ pages)
│   │   │   ├── ProjectSites.jsx       # Project Site management (new)
│   │   │   ├── ProjectSiteDetail.jsx  # Per-site order tracking (new)
│   │   │   ├── CustomerRFQ.jsx        # RFQ submission & bidding (new)
│   │   │   ├── VendorRFQBoard.jsx     # Vendor bid submission board (new)
│   │   │   └── AdminRFQMonitor.jsx    # Admin RFQ overview (new)
│   │   ├── components/          # Reusable Layouts & Elements
│   │   └── App.jsx              # Application Routing
│   └── public/                  # Assets & PWA Manifest
│
├── Documents/
│   └── Plan/                    # Feature planning documents
│
├── PLATFORM_OVERVIEW.md         # Platform guide for vendors & customers
├── RENDER_DEPLOYMENT.md         # Render cloud deployment guide
├── NEON_DATABASE.md             # Neon PostgreSQL setup guide
└── BREVO_EMAIL_SETUP.md         # Brevo email platform guide
```

---

## ⚙️ Getting Started

### 1. Clone & Install
```bash
git clone https://github.com/coneco0516-sketch/Con-Eco-App.git
cd Con-Eco-App

# Setup Backend
cd Backend
pip install -r requirements.txt

# Setup Frontend
cd ../Frontend
npm install
```

### 2. Setup Database
```bash
# From the Backend/ directory
python setup_neon.py

# Run GST billing migration (adds bill_type & bill_file_url to Orders table)
python migrate_gst_billing.py

# Run Multi-Tier Role migration (adds Super Admin, Admin, Employee roles)
python migrate_multi_tier_roles.py

# Run Project Sites migration (creates ProjectSites table)
python migrate_project_sites.py

# Run RFQ Engine migration (creates RFQ and Bids tables)
python migrate_rfq_system.py

# Run Service Milestone migration (creates ServiceMilestones table)
python migrate_milestones.py
```

### 3. Running Locally
```bash
# Terminal 1: Backend
cd Backend
uvicorn main:app --reload --port 8000

# Terminal 2: Frontend
cd Frontend
npm run dev
```

---

## 🔐 Environment Variables

Create a `Backend/.env` file:

```env
# Neon PostgreSQL Database
DATABASE_URL=postgresql://user:password@ep-xxxx.neon.tech/neondb?sslmode=require

# Auth
JWT_SECRET=your_super_secret_jwt_key
SECRET_KEY=your_secret_key

# Email (Brevo)
BREVO_API_KEY=xkeysib-xxxxxxxxxxxxxxxxxxxxxxxx
FROM_EMAIL=noreply@coneco.com
FROM_NAME=ConEco

# Web Push (VAPID)
VAPID_PUBLIC_KEY=your_public_key
VAPID_PRIVATE_KEY=your_private_key

# Payments (Razorpay)
RAZORPAY_KEY_ID=rzp_live_xxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret

# Application URL
APP_URL=http://localhost:8000
```

See `BREVO_EMAIL_SETUP.md` for getting your Brevo API key.  
See `NEON_DATABASE.md` for getting your Neon connection string.

---

## 💳 Billing & Commissions

The platform operates on a robust, legal-compliant billing model:
- **Platform Fee**: **3% Flat Commission** on all transactions.
- **Billing Cycle**: Weekly invoices generated every Monday for outstanding commissions.
- **Penalty System**: Vendors receive "Strikes" for unpaid invoices. After **3 Strikes**, the account is automatically blocked.
- **COD Orders**: Vendor collects cash directly; commission tracked and invoiced weekly.
- **Pay Later**: Customer credit system with 7-day and 14-day payment tiers managed by Admin.

---

## 🧾 GST Billing System

ConEco's GST billing is smart, automatic, and legally compliant.

### Core Logic (Conditional GST)

```
Vendor has gst_number in their profile?
│
├── YES → 18% GST added to order total
│         "GST Bill" option enabled at checkout
│         Vendor provides formal Tax Invoice after delivery
│
└── NO  → GST = ₹0 (NOT added to total)
          Only "Simple Bill" option shown
          Vendor provides simple receipt after delivery
```

### Bill Types

| Bill Type | GST Added to Total? | Document | Use Case |
|---|---|---|---|
| **GST Bill** | ✅ Yes (18%) | Formal Tax Invoice (GSTIN) | Businesses claiming ITC |
| **Simple Bill** | ❌ No | Standard receipt | Individuals / retail |

### How It Works
1. **At Checkout**: Cart total automatically includes GST only if the vendor has a `gst_number`. The "GST Bill" option is disabled for unregistered vendors.
2. **After Delivery**: Vendor uploads the bill document (PDF/image) from the Orders dashboard.
3. **Download**: Customer downloads the bill from "My Orders" or "My Booked Services."

### Database Fields (Orders table)
| Column | Type | Description |
|---|---|---|
| `bill_type` | VARCHAR(10) | `'GST'` or `'Non-GST'` — defaults to `'Non-GST'` |
| `bill_file_url` | TEXT | Path to the vendor-uploaded bill file |

> **Note:** Selecting "GST Bill" vs "Simple Bill" does NOT change the total amount for a GST-registered vendor. The 18% GST is always included for registered vendors. For unregistered vendors, GST is never applied.

---

## 📣 Communication System

ConEco uses a dual-channel communication strategy for maximum reliability:

### 1. Transactional Emails (Brevo)
| Event | Recipient |
|---|---|
| Email verification on signup | Customer / Vendor |
| Order confirmation & Invoices | Customer |
| New order notification | Vendor |
| Password reset | All Roles |
| Support ticket replies | User |

### 2. Web Push Notifications
| Event | Recipient |
|---|---|
| Order status updates | Customer |
| New order alerts | Vendor |
| Commission invoice alerts | Vendor |
| Security / Login alerts | All Roles |

> See `BREVO_EMAIL_SETUP.md` for full email configuration guide.

---

## 🚀 Future Features Roadmap

We are actively developing the platform before moving to mobile apps. Planned features include:
1. **Project-Based Procurement**
2. **Reverse Auction / RFQ Engine**
3. **Material Comparison Tool**
4. **Live Negotiation Chat**
5. **Logistics & Freight Calculator**
6. **Online Escrow Payments** — When Razorpay Route is integrated, milestone approvals will auto-release digital payments to vendors (currently works as offline escrow via COD)

> See `Documents/Plan/Future_Features_Roadmap.md` for the complete 3-month implementation timeline.

---

## 🚢 Deployment

ConEco is deployed on **Render**:

| Service | Type | Platform |
|---|---|---|
| Backend (FastAPI) | Web Service | Render |
| Frontend (React) | Static Site | Render |
| Database | Serverless PostgreSQL | Neon |
| Email | HTTP API | Brevo |
| Payments | API | Razorpay |

> See `RENDER_DEPLOYMENT.md` for full step-by-step deployment guide.

---

## 📄 License
MIT License — see [LICENSE](LICENSE) for details.

---

**Developed by ConEco Team** — Internship Project @ Vrishank Soft  
Built with ❤️ using FastAPI + React 18 + Neon + Render + Brevo + Razorpay
