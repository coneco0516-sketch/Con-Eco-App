# Pay Later — Two-Stage Credit System

> **Created:** 27 April 2026  
> **Project:** ConEco Marketplace  
> **Status:** Approved for Implementation

---

## Overview

A **Pay Later / Credit Tab** system with a **reward & penalty** structure to encourage timely payments:
- **Stage 1 (≤7 days):** Pay within 7 days → Credit limit **doubled** as reward
- **Stage 2 (8–14 days):** Pay between day 8–14 → Credit limit stays the **same**
- **Overdue (day 15+):** Vendor force-collects cash → Customer **suspended for 2 months** (no credit)

Both stages, their due dates, and current payment tier are **visible to both vendor and customer**.

Global default credit limit is configured by **Admin in Platform Settings**.

---

## Business Rules Summary

| Scenario | What Happens |
|---|---|
| Customer pays within **7 days** | `credit_used -= amount`, `credit_limit *= 2` (doubled!) |
| Customer pays within **8–14 days** | `credit_used -= amount`, `credit_limit` unchanged |
| **Day 15+** (not paid) | Vendor force-marks collected → `credit_used = 0`, `credit_status = 'Suspended'`, `credit_suspended_until = today + 60 days` |
| Suspension active | Customer **cannot use Pay Later** until `credit_suspended_until` has passed |
| Suspension ends | `credit_status = 'None'`, `credit_limit` reset to platform default |
| Admin sets global default | All newly eligible customers get that limit; stored in `platformsettings` |

---

## Final Flow

```
[Admin] Sets default_credit_limit in Platform Settings (e.g., ₹5,000)
         ↓
[Admin] Can override per-customer credit limit from Admin Panel
         ↓
[Customer] Selects "Pay Later" at Checkout
  → System checks: credit_limit > 0, not suspended, credit_used + total ≤ limit
  → Order placed (payment_method = 'PayLater', payment_status = 'Pending')
  → customer.credit_used += order_total
  → credit_stage1_due = today + 7 days
  → credit_stage2_due = today + 14 days
         ↓
[Both vendor and customer see stage badges + due dates on the order]
         ↓
[Customer pays vendor offline]
         ↓
[Vendor] Opens VendorOrders → clicks "Mark as Paid (Credit)"
  → If paid within 7 days  → credit_limit DOUBLED  ✅ Stage 1
  → If paid within 14 days → credit_limit unchanged ✅ Stage 2
  → If paid on day 15+     → customer SUSPENDED for 2 months ❌ Overdue
```

---

## Database Changes

### Customers Table — 5 new columns

```sql
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS credit_limit           DECIMAL(12,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS credit_used            DECIMAL(12,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS credit_status          VARCHAR(20) DEFAULT 'None'
    CHECK (credit_status IN ('None', 'Active', 'Overdue', 'Suspended')),
  ADD COLUMN IF NOT EXISTS credit_suspended_until  DATE DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS credit_base_limit       DECIMAL(12,2) DEFAULT 0.00;
```

### Orders Table — 3 new columns

```sql
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS credit_stage1_due  DATE DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS credit_stage2_due  DATE DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS credit_tier        VARCHAR(20) DEFAULT NULL
    CHECK (credit_tier IN ('Stage1', 'Stage2', 'Overdue'));
```

### New Table — `credit_transactions`

```sql
CREATE TABLE IF NOT EXISTS credit_transactions (
    credit_txn_id     SERIAL PRIMARY KEY,
    customer_id       INT REFERENCES customers(customer_id) ON DELETE CASCADE,
    order_id          INT REFERENCES orders(order_id) ON DELETE SET NULL,
    txn_type          VARCHAR(20) CHECK (txn_type IN ('Debit', 'Repayment', 'Penalty', 'Reward')),
    amount            DECIMAL(12,2) NOT NULL,
    credit_used_after  DECIMAL(12,2) NOT NULL,
    credit_limit_after DECIMAL(12,2) NOT NULL,
    notes             TEXT,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Platform Settings — New Key

```sql
INSERT INTO platformsettings (setting_key, setting_value)
VALUES ('default_credit_limit', '5000')
ON CONFLICT (setting_key) DO NOTHING;
```

---

## Backend Changes

### File: `Backend/routers/payment.py`

**NEW endpoint:** `POST /api/payment/place_order_pay_later`

Validation checks (in order):
1. Fetch customer's `credit_limit`, `credit_used`, `credit_status`, `credit_suspended_until`
2. If suspended AND `credit_suspended_until > TODAY` → error: `"Credit suspended until {date}"`
3. If suspension expired → auto-lift: reset `credit_status='None'`, `credit_limit = platform default`
4. If `credit_limit <= 0` → error: `"Pay Later not enabled for your account"`
5. If `credit_used + total > credit_limit` → error: `"Exceeds credit limit. Available: ₹X"`

On success:
- Call `finalize_order(payment_method='PayLater', payment_status='Pending')`
- Set `credit_stage1_due = today + 7`, `credit_stage2_due = today + 14` on the order
- `UPDATE customers SET credit_used += total, credit_status = 'Active'`
- Insert `credit_transactions` row (`txn_type='Debit'`)

---

### File: `Backend/routers/vendor.py`

**MODIFY:** `POST /api/vendor/orders/update_payment_status`

For `payment_method = 'PayLater'` orders:

```python
today = date.today()
tier = 'Stage1' if today <= stage1_due else ('Stage2' if today <= stage2_due else 'Overdue')

# Mark payment completed
UPDATE Payments SET status='Completed'
UPDATE Orders SET credit_tier = tier

# Reduce credit_used
UPDATE customers SET credit_used = GREATEST(0, credit_used - order_amount)

# Apply tier result:
if tier == 'Stage1':
    UPDATE customers SET credit_limit = credit_limit * 2
    INSERT credit_transactions (txn_type='Reward')

elif tier == 'Stage2':
    # No limit change
    INSERT credit_transactions (txn_type='Repayment')

else:  # Overdue
    UPDATE customers SET
        credit_status = 'Suspended',
        credit_suspended_until = today + 60,
        credit_used = 0
    INSERT credit_transactions (txn_type='Penalty')

# Reset status to 'None' if fully cleared (non-overdue)
if tier != 'Overdue' AND credit_used <= 0:
    UPDATE customers SET credit_status = 'None'
```

---

### File: `Backend/routers/admin.py`

**NEW:** `PUT /api/admin/customers/{customer_id}/credit`
- Set/override `credit_limit` for a specific customer
- Optional: lift suspension (`credit_status = 'None'`, `credit_suspended_until = NULL`)

**MODIFY:** Customer list endpoint — include credit columns in response

---

### File: `Backend/routers/customer.py`

**NEW:** `GET /api/customer/credit_summary`

Returns:
```json
{
  "credit_limit": 10000,
  "credit_used": 3500,
  "credit_available": 6500,
  "credit_status": "Active",
  "credit_suspended_until": null,
  "recent_transactions": [...]
}
```

---

## Frontend Changes

### `Frontend/src/pages/Checkout.jsx`

- Fetch `/api/customer/credit_summary` on mount
- Add **"Pay Later (Credit)"** card in payment methods grid
- Show stage reward info on the card:
  - ✅ Pay in 7 days → credit limit doubled!
  - 📅 Pay in 14 days → limit unchanged
  - ⚠️ After 14 days → 2-month suspension
- Disabled states: not eligible / suspended / exceeds limit
- Calls `POST /api/payment/place_order_pay_later`

---

### `Frontend/src/pages/VendorOrders.jsx`

For `payment_method === 'PayLater'` orders:
- Show **[PAY LATER]** amber badge
- Show both due dates:
  - `Stage 1 Due: 04 May 2026` (green if active, grey if passed)
  - `Stage 2 Due: 11 May 2026` (amber if active, red if overdue)
- Dynamic "Mark as Paid" button label:
  - Within 7 days: `"Mark Paid — Stage 1 (Customer earns double credit!)"`
  - Days 8–14: `"Mark Paid — Stage 2"`
  - Day 15+: `"⚠️ Force Mark Collected (Penalty applies)"`

---

### `Frontend/src/pages/MyOrders.jsx`

For `payment_method === 'PayLater'` orders:
- Show **[PAY LATER]** badge
- Show live stage status with countdown:
  - 🟢 Stage 1 active: "Pay by DD Mon → Get double credit!"
  - 🟡 Stage 2 active: "Pay by DD Mon to avoid penalty"
  - 🔴 Overdue: "Pay vendor immediately — suspension risk!"
- After vendor marks paid, show tier result:
  - Stage1 → "✅ Limit doubled to ₹X"
  - Stage2 → "✅ Payment received"
  - Overdue → "🔴 Suspended until DD Mon YYYY"

---

### `Frontend/src/pages/CustomerProfile.jsx`

New **"Credit Account"** section:
- Credit Limit / Used / Available with progress bar
- Status badge (None / Active / Overdue / Suspended)
- Suspension end date if applicable
- Last 5 credit transactions with type icons

---

### `Frontend/src/pages/PlatformSettings.jsx`

New field: **Default Credit Limit (₹)**
- Saves to `platformsettings` key: `default_credit_limit`
- Note: "Applies to all verified customers. Individual limits can be overridden per-customer from Admin Panel."

---

### `Frontend/src/pages/AdminPayments.jsx`

New **"Credit Accounts"** tab:
- Table: Customer | Limit | Used | Available | Status | Suspended Until
- **"Edit Limit"** and **"Lift Suspension"** actions per row
- Overdue/Suspended rows highlighted in red

---

## Files to Create/Modify

| File | Action |
|---|---|
| `Backend/migrate_credit_system.py` | **NEW** — DB migration script |
| `Backend/routers/payment.py` | **MODIFY** — Add `place_order_pay_later` endpoint |
| `Backend/routers/vendor.py` | **MODIFY** — Extend `update_payment_status` for PayLater tier logic |
| `Backend/routers/admin.py` | **MODIFY** — Add credit limit management endpoint |
| `Backend/routers/customer.py` | **MODIFY** — Add `credit_summary` endpoint |
| `Frontend/src/pages/Checkout.jsx` | **MODIFY** — Add Pay Later payment card |
| `Frontend/src/pages/VendorOrders.jsx` | **MODIFY** — Stage badges + due dates + dynamic button |
| `Frontend/src/pages/MyOrders.jsx` | **MODIFY** — Pay Later badges + stage countdown |
| `Frontend/src/pages/CustomerProfile.jsx` | **MODIFY** — Credit account card |
| `Frontend/src/pages/PlatformSettings.jsx` | **MODIFY** — Default credit limit setting |
| `Frontend/src/pages/AdminPayments.jsx` | **MODIFY** — Credit accounts management tab |

---

## Verification Steps

1. Run `python migrate_credit_system.py` → confirm columns added
2. Admin sets `default_credit_limit = 5000` in Platform Settings
3. Admin assigns credit to a test customer
4. Customer places Pay Later order (₹1,000) → `credit_used = ₹1,000`
5. **Stage 1 test:** Vendor marks paid same day → `credit_limit` doubles ✅
6. **Stage 2 test:** New order, vendor marks paid on day 8 → limit unchanged ✅
7. **Overdue test:** New order, vendor marks on day 15 → status = Suspended ✅
8. Customer tries Pay Later while suspended → sees suspension end date ✅
9. Vendor sees correct stage badges and due dates ✅
