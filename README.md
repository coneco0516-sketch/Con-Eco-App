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
- [Deployment](#-deployment)

---

## ✨ Features

### 👤 Authentication & Security
- Secure registration with **email verification** via Brevo.
- Role-based access: **Customer**, **Vendor**, and **Admin**.
- Login activity monitoring with security alerts.
- **Web Push Notifications**: Real-time alerts for orders and security events.

### 🛍️ Customers
- Unified product & service catalogue with detailed overview pages.
- **Bulk Price Negotiation**: Request custom quotes for large orders.
- Direct order placement via **COD** (Cash on Delivery).
- **Pay Later Credit Tab**: Place orders on credit, pay within 7–14 days.
- **GST & Non-GST Billing**: Select bill type at checkout — GST Tax Invoice for ITC claims or a Simple Bill for retail purchases. GST option is auto-restricted if vendor is not GST-registered.
- Real-time order tracking with automated status updates.
- **Download Bill**: Once the vendor uploads the bill post-delivery, customers can download it directly from "My Orders."
- **PWA Ready**: Installable on mobile and desktop for a native experience.

### 🏪 Vendors
- Transparent **Earnings Dashboard** (Gross vs Commission vs Net).
- **Bulk Price Management**: Rapidly update prices across the entire catalogue.
- **Vendor Wallet**: Automated earnings tracking with Bank Withdrawal (Payout) requests.
- **Bill Upload System**: Upload GST Tax Invoices or Simple Bills for each order from the dashboard. Each order card clearly shows the customer's requested bill type.
- Weekly automated billing system with downloadable compliance receipts.
- Professional QC verification system for platform-wide quality control.

### 🛡️ Admin Dashboard
- Centralized management for all users, orders, and payments.
- **Bulk Pricing Control**: Manage vendor pricing and inventory at scale.
- One-click vendor verification and automated QC scoring.
- **Commission Penalty System**: Automated "Strike" system for overdue payments.
- **Credit Limit Management**: Assign and monitor customer Pay Later credit.
- Customer support suite for managing enquiries and contact messages.

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
│   ├── routers/                 # API Endpoints (Auth, Vendor, Customer, Admin, Payment, Invoice)
│   ├── main.py                  # Core Application & Scheduler
│   ├── email_service.py         # Brevo Email Infrastructure
│   ├── push_service.py          # Web Push Notification Engine
│   ├── database.py              # Neon PostgreSQL Connection
│   ├── setup_neon.py            # DB Schema Setup Script
│   ├── invoice_generator.py     # Professional PDF Invoice Logic
│   ├── commission_invoicing.py  # Billing & Penalty Automation
│   └── migrate_gst_billing.py   # GST billing schema migration
│
├── Frontend/
│   ├── src/
│   │   ├── pages/               # Functional UI Components
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

ConEco supports flexible, legally-compliant billing to serve both retail and commercial buyers.

### Bill Types

| Bill Type | Description | Use Case |
|---|---|---|
| **GST Bill** | Formal Tax Invoice with vendor GSTIN — eligible for Input Tax Credit (ITC) | Businesses / commercial purchases |
| **Non-GST / Simple Bill** | Standard receipt without formal tax invoice details | Individuals / retail purchases |

### How It Works
1. **At Checkout**: Customer selects their preferred bill type. The "GST Bill" option is only shown if the vendor has a verified GST number.
2. **After Delivery**: Vendor uploads the bill document (PDF or image) from their Orders dashboard.
3. **Download**: Customer downloads the bill from "My Orders" or "My Booked Services."

### Important Note
> The **total payable amount is identical** for both bill types. GST on goods/services is always collected as required by law. The bill type only determines the format of the invoice document provided.

### Database Fields (Orders table)
| Column | Type | Description |
|---|---|---|
| `bill_type` | VARCHAR(10) | `'GST'` or `'Non-GST'` — defaults to `'Non-GST'` |
| `bill_file_url` | TEXT | Path to the vendor-uploaded bill file |

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
