# ConEco — B2B E-Commerce Platform

A full-stack B2B marketplace connecting **Customers**, **Vendors**, and **Admins** for buying and selling products and services with modern payment, invoicing, and notification systems.

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
- [API Overview](#-api-overview)
- [User Roles](#-user-roles)
- [Deployment](#-deployment)

---

## ✨ Features

### 👤 Authentication
- User registration with **email verification**
- Secure JWT-based login (HttpOnly cookies)
- Role-based access: **Customer**, **Vendor**, **Admin**
- Login activity tracking (IP address & device)

### 🛍️ Customer
- Browse products and services by category
- Add to cart, view product details
- Place orders via **COD** or **Razorpay (Online)**
- Bulk price negotiation with vendors
- PDF invoice download for completed orders
- Notification preference management

### 🏪 Vendor
- Register with company details (GST, address)
- Upload and manage products & services
- View and manage incoming orders
- Track earnings, commissions, and payouts
- QC verification system by admin

### 🛡️ Admin
- Verify vendors and customers
- View all orders, payments, and transactions
- Manage commissions and vendor invoices
- Credit vendor wallets for online orders
- Reply to customer contact messages
- Generate weekly commission invoices

### 📧 Email Notifications
- Email verification on registration
- Login security alerts
- Order confirmation (customer + vendor)
- QC status updates for vendors
- Contact form acknowledgment & admin reply
- Background task processing (non-blocking)

### 💳 Payments
- **Razorpay** integration for online payments
- **COD** (Cash on Delivery) support
- Platform commission: **3%** per order
- GST: **18%** on base amount
- Weekly invoice generation for vendor commissions

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18 + Vite |
| **Backend** | FastAPI (Python) |
| **Database** | MySQL (Railway) |
| **Payments** | Razorpay |
| **Email** | Gmail SMTP (smtplib) |
| **Auth** | JWT + bcrypt |
| **PDF** | fpdf2 + Pillow |
| **Deployment** | Railway |
| **Scheduling** | APScheduler |

---

## 📁 Project Structure

```
ConEco/
├── Backend/
│   ├── main.py                  # FastAPI app entry point
│   ├── database.py              # MySQL connection
│   ├── email_service.py         # Email sending (SMTP + BackgroundTasks)
│   ├── commission_invoicing.py  # Weekly invoice generation
│   ├── invoice_generator.py     # PDF invoice builder
│   ├── requirements.txt         # Python dependencies
│   ├── .env                     # Environment variables (git-ignored)
│   └── routers/
│       ├── auth.py              # Login, Register, Verify Email
│       ├── customer.py          # Cart, Orders, Profile
│       ├── vendor.py            # Products, Services, Earnings
│       ├── admin.py             # Dashboard, QC, Payments
│       ├── payment.py           # Razorpay, COD, Finalize Orders
│       └── invoice.py           # PDF invoice download
│
├── Frontend/
│   ├── src/
│   │   ├── pages/               # All page components (JSX)
│   │   ├── components/          # Shared components (Sidebar, etc.)
│   │   └── App.jsx              # Routes configuration
│   ├── dist/                    # Production build output
│   └── package.json
│
├── railway.toml                 # Railway deployment config
├── requirements.txt             # Root-level (used by Railway)
└── README.md
```

---

## ⚙️ Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- MySQL database

### 1. Clone the Repository
```bash
git clone https://github.com/coneco0516-sketch/Con-Eco-App.git
cd Con-Eco-App
```

### 2. Backend Setup
```bash
# Create and activate virtual environment
python -m venv Backend/venv
Backend/venv/Scripts/activate   # Windows
source Backend/venv/bin/activate # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp Backend/.env.example Backend/.env
# Edit Backend/.env with your credentials
```

### 3. Frontend Setup
```bash
cd Frontend
npm install
npm run dev       # Development server (http://localhost:5173)
```

### 4. Run Backend
```bash
# From the project root:
uvicorn Backend.main:app --reload --port 8000
```

---

## 🔐 Environment Variables

Create a `Backend/.env` file with the following:

```env
# Database
DB_NAME=your_db_name
DB_USER=your_db_user
DB_PASS=your_db_password
DB_HOST=your_db_host
DB_PORT=3306

# JWT
JWT_SECRET=your_secret_key

# CORS
ALLOWED_ORIGINS=http://localhost:5173,https://your-domain.com

# Email (Gmail App Password)
MAIL_USERNAME=your@gmail.com
MAIL_PASSWORD=your_app_password
MAIL_FROM=your@gmail.com
MAIL_FROM_NAME=ConEco
MAIL_PORT=587
MAIL_SERVER=smtp.gmail.com

# Razorpay
RAZORPAY_KEY_ID=rzp_test_xxxx
RAZORPAY_KEY_SECRET=your_secret

# App
APP_URL=https://your-domain.com
```

> ⚠️ **Never commit `.env` to Git.** It is already in `.gitignore`.

> 📌 **Gmail App Password**: Enable 2-Step Verification on your Google account, then generate an App Password at [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords).

---

## 📡 API Overview

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register new user |
| `POST` | `/api/auth/login` | Login |
| `GET` | `/api/auth/verify-email` | Verify email token |
| `GET` | `/api/customer/products` | List all products |
| `POST` | `/api/customer/cart/add` | Add item to cart |
| `POST` | `/api/payment/place_order_offline` | Place COD order |
| `POST` | `/api/payment/verify` | Verify Razorpay payment |
| `GET` | `/api/invoice/download/{order_id}` | Download PDF invoice |
| `GET` | `/api/admin/dashboard_stats` | Admin dashboard stats |
| `POST` | `/api/admin/vendors/update_qc` | Update vendor QC score |
| `GET` | `/api/vendor/orders` | Vendor orders list |

Full API docs available at: `http://localhost:8000/docs` (Swagger UI)

---

## 👥 User Roles

### Customer
- Register → Verify Email → Browse → Cart → Checkout → Track Orders

### Vendor
- Register → Admin QC Verification → Upload Products/Services → Manage Orders → Request Payout

### Admin
- Manage all users, vendors, orders, payments, commissions, and contact messages

---

## 🚢 Deployment

The app is deployed on **Railway** using **Nixpacks** build system.

### Deploy Steps:
1. Push to `main` branch on GitHub
2. Railway auto-detects changes and redeploys
3. Ensure all environment variables are set in Railway → **Variables**

### Railway Config (`railway.toml`):
```toml
[build]
builder = "nixpacks"

[deploy]
startCommand = "cd Backend && uvicorn main:app --host 0.0.0.0 --port $PORT"
```

> ⚠️ **Note on Email:** Railway's free tier blocks outbound SMTP (port 587). Emails work in local development. For production email delivery, switch to an HTTPS-based provider like [Brevo](https://brevo.com) (free 300 emails/day).

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

## 👨‍💻 Developed by

**ConEco Team** — Internship Project @ Vrishank Soft  
Built with ❤️ using FastAPI + React
