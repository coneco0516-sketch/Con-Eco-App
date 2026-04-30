# Admin Bulk Price Updater — High-Efficiency Pricing Tool

> **Created:** 30 April 2026  
> **Project:** ConEco Marketplace  
> **Status:** Draft for Implementation

---

## Overview

A dedicated administrative tool designed to facilitate rapid daily price updates for vendors. This system synchronizes with the **9:00 AM WhatsApp Price Update Protocol**, allowing Admins to update hundreds of product prices within minutes to ensure platform competitiveness and data freshness.

---

## The 9-to-10 Workflow

| Time | Action | Responsibility |
|---|---|---|
| **9:00 AM** | Vendors send price lists via WhatsApp using the standard template. | Vendor |
| **9:10 AM** | Admin opens **Bulk Price Updater**, selects vendor, and filters by category. | Admin |
| **9:45 AM** | Admin enters new prices using the "Rapid Entry" table interface. | Admin |
| **10:00 AM** | All updates saved; "Last Updated" timestamps refreshed. Platform is live. | System |

---

## Business Rules & Logic

1. **Daily Freshness**: The system tracks the exact minute a price was last modified.
2. **Multi-Row Transactions**: To ensure data integrity, updates are processed as a single database transaction.
3. **Role Restriction**: This tool is strictly accessible only to users with the **Admin** role.
4. **Audit Trail**: Every price change updates the `updated_at` timestamp, providing a clear history of market fluctuations.

---

## Database Changes

The system utilizes the `updated_at` column to track the freshness of data.

### 1. Ensure Columns Exist
```sql
-- Ensure updated_at exists on both products and services
ALTER TABLE products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE services ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
```

### 2. Automatic Timestamp Triggers
```sql
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
DROP TRIGGER IF EXISTS update_products_modtime ON products;
CREATE TRIGGER update_products_modtime BEFORE UPDATE ON products FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

DROP TRIGGER IF EXISTS update_services_modtime ON services;
CREATE TRIGGER update_services_modtime BEFORE UPDATE ON services FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
```

---

## Backend Changes

### File: `Backend/routers/admin.py`

**ENHANCED endpoint:** `GET /api/admin/vendors/{vendor_id}/products`
- Returns all products for a specific vendor.
- Includes `updated_at` formatted as a human-readable string (e.g., "10 mins ago" or "Yesterday").

**NEW endpoint:** `PUT /api/admin/products/bulk-update`
- **Payload**: `{"updates": [{"product_id": 101, "price": 450.0}, {"product_id": 102, "price": 465.5}]}`
- **Logic**: Iterates through the list and performs a bulk update.
- **Response**: Success count and timestamp of completion.

---

## Frontend Changes

### Page: `Frontend/src/pages/AdminBulkPriceUpdater.jsx`

**UI Architecture:**
- **Vendor Search Bar**: A searchable selector to switch between different vendors.
- **Categorization Tabs**: Quick filters for "Cement", "Steel", "Bricks", etc.
- **The Rapid-Entry Table**:
    - **Product Information**: Name, Category, and Brand.
    - **Current Price**: Displayed for reference.
    - **New Price Input**: Large, easy-to-hit input fields.
    - **Freshness Badge**: 
        - 🟢 **Green**: Updated within the last 4 hours.
        - 🟡 **Amber**: Updated today but > 4 hours ago.
        - 🔴 **Red**: Not updated today.

**Key Interactions:**
- **Keyboard Shortcuts**: Up/Down arrows and Tab to navigate between cells.
- **Dirty State Detection**: Highlight rows with unsaved changes in a distinct color (e.g., light yellow).
- **Floating Action Bar**: Displays "X items modified" with "Discard" and "Save All" buttons.

---

## Files to Create/Modify

| File | Action |
|---|---|
| `Backend/migrate_products_updated_at.py` | **NEW** — Setup triggers and initial timestamps |
| `Backend/routers/admin.py` | **MODIFY** — Add bulk update endpoint and enrich GET products |
| `Frontend/src/pages/AdminBulkPriceUpdater.jsx` | **NEW** — The primary administrative interface |
| `Frontend/src/App.jsx` | **MODIFY** — Register the new Bulk Updater route |
| `Frontend/src/components/AdminSidebar.jsx` | **MODIFY** — Add navigation link to "Price Updater" |

---

## Verification Steps

1. **Vendor Filtering**: Select "Vendor A" → confirm only their products appear.
2. **Category Isolation**: Click "Steel" tab → confirm cement/bricks are hidden.
3. **Bulk Input**: Update 10 prices rapidly using only the keyboard.
4. **Transaction Integrity**: Click "Save All" → Verify all 10 prices changed in the DB.
5. **Timestamp Accuracy**: Check that the "Freshness Badge" turns green immediately after saving.
6. **Concurrent Safety**: Ensure that updating prices as Admin does not interfere with active Customer orders.
