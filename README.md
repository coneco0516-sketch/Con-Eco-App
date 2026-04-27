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
- [Email System](#-email-system)
- [Deployment](#-deployment)

---

## ✨ Features

### 👤 Authentication & Security
- Secure registration with **email verification** via Brevo.
- Role-based access: **Customer**, **Vendor**, and **Admin**.
- Login activity monitoring with security alerts.
- Modern background task processing for a responsive UI.

### 🛍️ Customers
- Unified product & service catalogue with detailed overview pages.
- **Bulk Price Negotiation**: Request custom quotes for large orders.
- Direct order placement via **COD** (Cash on Delivery).
- **Pay Later Credit Tab**: Place orders on credit, pay within 7–14 days.
- Real-time order tracking with automated status updates.

### 🏪 Vendors
- Transparent **Earnings Dashboard** (Gross vs Commission vs Net).
- Simplified product management and automated inventory tracking.
- Weekly automated billing system with downloadable compliance receipts.
- Professional QC verification system for platform-wide quality control.

### 🛡️ Admin Dashboard
- Centralized management for all users, orders, and payments.
- One-click vendor verification and automated QC scoring.
- Automated platform commission tracking (3% flat rate).
- **Credit Limit Management**: Assign and monitor customer Pay Later credit.
- Customer support suite for managing enquiries and contact messages.

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18 + Vite |
| **Backend** | FastAPI (Python 3.12) |
| **Database** | Neon PostgreSQL (Serverless) |
| **Hosting** | Render (Backend + Frontend) |
| **Email** | Brevo HTTP API (Transactional) |
| **Auth** | JWT + bcrypt (Session Cookies) |
| **Invoicing** | fpdf2 + PDF Generation |

---

## 📁 Project Structure

```
ConEco/
├── Backend/
│   ├── routers/                 # API Endpoints (Auth, Vendor, Customer, Admin, Payment)
│   ├── main.py                  # Core Application & Scheduler
│   ├── email_service.py         # Brevo Email Infrastructure
│   ├── database.py              # Neon PostgreSQL Connection
│   ├── setup_neon.py            # DB Schema Setup Script
│   └── commission_invoicing.py  # Billing Automation Logic
│
├── Frontend/
│   ├── src/
│   │   ├── pages/               # Functional UI Components
│   │   ├── components/          # Reusable Layouts & Elements
│   │   └── App.jsx              # Application Routing
│   └── dist/                    # Optimized Production Build
│
├── Documents/
│   └── Plan/                    # Feature planning documents
│
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

# Application URL
APP_URL=http://localhost:8000
```

See `BREVO_EMAIL_SETUP.md` for getting your Brevo API key.  
See `NEON_DATABASE.md` for getting your Neon connection string.

---

## 💳 Billing & Commissions

The platform operates on a simplified, legal-compliant billing model:
- **Platform Fee**: **3% Flat Commission** on all transactions.
- **Billing Cycle**: Weekly invoices generated every Monday for outstanding commissions.
- **COD Orders**: Vendor collects cash directly; commission tracked separately.
- **Pay Later**: Customer credit system with 7-day and 14-day payment tiers.

---

## 📧 Email System

All transactional emails are handled by **Brevo HTTP API**:

| Event | Recipient |
|---|---|
| Email verification on signup | Customer / Vendor |
| Order confirmation | Customer |
| New order notification | Vendor |
| Order status updates | Customer |
| Password reset | Customer / Vendor |
| QC verification status | Vendor |

> See `BREVO_EMAIL_SETUP.md` for full configuration guide.

---

## 🚢 Deployment

ConEco is deployed on **Render**:

| Service | Type | Platform |
|---|---|---|
| Backend (FastAPI) | Web Service | Render |
| Frontend (React) | Static Site | Render |
| Database | Serverless PostgreSQL | Neon |
| Email | HTTP API | Brevo |

> See `RENDER_DEPLOYMENT.md` for full step-by-step deployment guide.

---

## 📄 License
MIT License — see [LICENSE](LICENSE) for details.

---

**Developed by ConEco Team** — Internship Project @ Vrishank Soft  
Built with ❤️ using FastAPI + React 18 + Neon + Render + Brevo
