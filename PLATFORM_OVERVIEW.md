# ConEco — Platform Overview & Guidelines

Welcome to **ConEco**, a professional B2B marketplace designed to bridge the gap between Vendors and Customers with transparency, efficiency, and trust.

---

## 🚀 The ConEco Mission
ConEco is more than just an app; it is a business ecosystem. We simplify bulk procurement, facilitate credit-based trading, and ensure high-quality standards through automated QC and real-time tracking.

---

## ✨ Features

### 🛍️ For Customers (Buyers)
- **Bulk Price Negotiation**: Request custom quotes for large orders directly from the vendor.
- **Pay Later (Credit System)**: 7-day or 14-day credit limits assigned by the Admin.
- **Real-time Order Tracking**: Web Push and Email notifications from "Order Placed" to "Delivered."
- **PWA Experience**: Install ConEco on your phone's home screen.
- **Smart GST Billing**: GST (18%) is added to your total **only if the vendor is GST-registered**. The GST Bill option is automatically hidden for unregistered vendors.

### 🏪 For Vendors (Sellers)
- **Comprehensive Dashboard**: Track Gross Sales, Platform Commissions, and Net Earnings in real-time.
- **Vendor Wallet**: Automated earnings tracking with "Withdrawal Request" system for bank payouts.
- **QC Reliability Score**: High-performing vendors get better platform visibility.
- **Weekly Billing**: Automated commission invoices generated every Monday.
- **Bill Upload System**: Upload official bill documents (PDF or image) from the Orders dashboard. Each order shows a badge with the customer's requested bill type.

### 🛡️ For Platform Management (Admin Levels)
- **Super Admin**: Platform owners with full financial control, bank payouts, staff management, and system settings access.
- **Admin**: Mid-level managers focused on vendor/customer verification, commission reports, and bulk pricing controls.
- **Employee**: Operational staff focused on order tracking, customer support, and contact message handling.

---

## 🛡️ What Makes ConEco Different?
1. **B2B Optimized**: Built for bulk buyers and suppliers, not just retail.
2. **Credit & Trust**: Credit-based transactions that power modern business.
3. **Synchronized Pricing**: Daily price updates keep listings competitive.
4. **Quality First**: Every vendor is audited; every product tracked.
5. **Legally Compliant GST Billing**: GST is only applied where legally required — based on the vendor's actual GST registration status.

---

## 🔄 How It Works

### For Customers
1. **Search**: Find construction materials or services.
2. **Pricing**: Cart total includes 18% GST **only if the vendor is GST-registered**. Unregistered vendor = no GST added.
3. **Bill Type**: "GST Bill" option shown only if vendor has a GST number. Both bill types cost the same amount.
4. **Order**: COD or Pay Later credit.
5. **Negotiate**: Send a "Bulk Request" for large quantities.
6. **Download Bill**: Once the vendor uploads the bill, download it from "My Orders."

### For Vendors
1. **List**: Upload your catalogue with images and specifications.
2. **GST Registration**: Add your `gst_number` to your profile to serve GST-invoice-needing business buyers.
3. **Fulfill**: Manage orders through the dashboard.
4. **Upload Bill**: After delivery, upload the official bill. The order card shows the customer's requested bill type.
5. **Withdraw**: Request payouts from your wallet.
6. **Maintain**: Pay weekly commission invoices to avoid "Strikes."

### For Admin & Staff
1. **Super Admin**: Manages the platform's core, handles financial payouts, and manages staff accounts.
2. **Admin**: Approves new vendors/customers and monitors automated commission invoicing.
3. **Employee**: Manages customer inquiries and monitors daily order fulfillment status.

---

## 🧾 GST Billing System

### The Core Rule

```
Vendor has GST Number in profile?
│
├── YES → GST 18% added to order total
│         "GST Bill" option available at checkout
│
└── NO  → GST = ₹0 (not added to customer's total)
          Only "Simple Bill" option shown
```

### Bill Types

| Bill Type | GST Added? | Use Case |
|---|---|---|
| **GST Bill** | ✅ Yes (18%) | Businesses claiming ITC |
| **Simple Bill** | ❌ No (vendor unregistered) | Individuals / retail |

### Key Points
- **Selecting "GST Bill" vs "Simple Bill" does NOT change the total amount** for a GST-registered vendor — the 18% GST is always included for registered vendors.
- For **unregistered vendors**, GST is never added regardless of bill type selection.
- Customers download the bill from "My Orders" once the vendor uploads it post-delivery.

---

## 📲 Daily Price Update Protocol (WhatsApp)

### ⏰ The 9-to-10 Window
- **9:00 AM**: Vendors send updated price lists to Admin via WhatsApp.
- **10:00 AM**: Admin completes bulk updates on the platform.

### 📝 WhatsApp Message Template

> 📌 **DAILY PRICE UPDATE — CONECO**
>
> **Vendor Name**: [Your Name/Company Name as per Platform]  
> **Date**: [Today's Date]
>
> **Product Updates**:
> 1. [Product Name A] — ₹[New Price]
> 2. [Product Name B] — ₹[New Price]
>
> *Note: Please mention if any product is currently 'Out of Stock' or if there are new arrivals.*

---

**Built with ❤️ by ConEco Team**  
*Empowering Businesses, Simplifying Trade.*
