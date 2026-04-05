# ConEco — B2B E-Commerce Platform

A professional full-stack B2B marketplace designed to connect **Customers**, **Vendors**, and **Admins** through a streamlined commission-based model. Built for performance, legal compliance, and a premium user experience.

---

## 🚀 Live Demo

**Production URL:** [https://con-eco-app-production.up.railway.app](https://con-eco-app-production.up.railway.app)

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
- Secure registration with **email verification**.
- Role-based access: **Customer**, **Vendor**, and **Admin**.
- Login activity monitoring with security alerts.
- Modern background task processing for a responsive UI.

### 🛍️ Customers
- Unified product & service catalogue with detailed overview pages.
- **Bulk Price Negotiation**: Request custom quotes for large orders.
- Direct order placement via **Razorpay (Online)** or **COD**.
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
- Customer support suite for managing enquiries and contact messages.

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18 + Vite |
| **Backend** | FastAPI (Python 3.12) |
| **Database** | MySQL (Railway) |
| **Payments** | Razorpay Integration |
| **Production Email** | Brevo HTTP API (Railway Optimized) |
| **Local Email** | Gmail SMTP Fallback |
| **Auth** | JWT + bcrypt |
| **Invoicing** | fpdf2 + PDF Generation |

---

## 📁 Project Structure

```
ConEco/
├── Backend/
│   ├── routers/                 # API Endpoints (Auth, Vendor, Customer, Admin)
│   ├── main.py                  # Core Application & Scheduler
│   ├── email_service.py         # Unified Email Infrastructure
│   ├── database.py              # Connection Management
│   └── commission_invoicing.py  # Billing Automation logic
│
├── Frontend/
│   ├── src/
│   │   ├── pages/               # Functional UI Components
│   │   ├── components/          # Reusable Layouts & Elements
│   │   └── App.jsx              # Application Routing
│   └── dist/                    # Optimized Production Build
│
└── railway.toml                 # Production Deployment Config
```

---

## ⚙️ Getting Started

### 1. Installation
```bash
git clone https://github.com/coneco0516-sketch/Con-Eco-App.git
cd Con-Eco-App

# Setup Backend Dependencies
pip install -r requirements.txt

# Setup Frontend
cd Frontend && npm install
```

### 2. Running Locally
```bash
# Terminal 1: Backend
uvicorn Backend.main:app --reload

# Terminal 2: Frontend
npm run dev
```

---

## 🔐 Environment Variables

Create a `Backend/.env` file:

```env
# MySQL Database
DB_NAME=your_db
DB_HOST=your_host
DB_USER=your_user
DB_PASS=your_pass

# Credentials
JWT_SECRET=your_auth_secret
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=your_razorpay_secret

# Production Email (Railway / Production)
BREVO_API_KEY=xkeysib_xxx

# Local Email Fallback (Gmail)
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_gmail_app_password

# Application
APP_URL=http://localhost:8000
```

---

## 💳 Billing & Commissions

The platform operates on a simplified, legal-compliant billing model:
- **Platform Fee**: **3% Flat Commission** on all transactions.
- **Tax Policy**: Zero GST reference (Platform currently operates as a non-GST entity).
- **Billing Cycle**: Weekly invoices generated every Monday for outstanding offline commissions.
- **Settlement**: Online payments are credited to vendor wallets after platform fee deduction.

---

## 📧 Email System

Our notification system is built for **100% Reliability**:
- **Production (Railway)**: Uses the **Brevo HTTP API** to bypass SMTP port blocks.
- **Local Development**: Uses **Gmail SMTP** as a zero-cost fallback.
- **Events**: Verified notifications for registration, new orders (Vendor), status updates (Customer), and security alerts.

---

## 🚢 Deployment

Fully optimized for **Railway Nixpacks**:
1. Merging to `main` triggers an automated CI/CD pipeline.
2. The environment variables are managed via the Railway Dashboard.
3. The root-level `requirements.txt` ensures seamless dependency installation.

---

## 📄 License
MIT License — see [LICENSE](LICENSE) for details.

---

**Developed by ConEco Team** — Internship Project @ Vrishank Soft  
Built with ❤️ using FastAPI + React 18
