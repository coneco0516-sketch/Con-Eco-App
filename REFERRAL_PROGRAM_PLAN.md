# 🎯 Con-Eco Referral Loyalty Program — Accurate Plan

> **Based on:** Actual codebase (Backend + Frontend)  
> **Platform:** Con-Eco B2B Marketplace (coneco.store)  
> **Last Updated:** July 2026

---

## ⚠️ Document Note

This file is generated directly from the **real implementation in the codebase**. Every detail here — milestone thresholds, referral rules, code format, API routes — reflects what is actually built and running. No assumed or invented values.

---

## 📋 Table of Contents

1. [Program Overview](#1-program-overview)
2. [How It Works — Actual Flow](#2-how-it-works--actual-flow)
3. [Referral Code Format](#3-referral-code-format)
4. [Milestone Reward Tiers — Actual Values](#4-milestone-reward-tiers--actual-values)
5. [Referral Rules — Actual Logic](#5-referral-rules--actual-logic)
6. [Database Schema — Actual Tables](#6-database-schema--actual-tables)
7. [Backend API Routes — Actual Endpoints](#7-backend-api-routes--actual-endpoints)
8. [Frontend Components — Actual UI](#8-frontend-components--actual-ui)
9. [Admin Dashboard — Actual Capabilities](#9-admin-dashboard--actual-capabilities)

---

## 1. Program Overview

The Con-Eco Referral Loyalty Program is a **gamified referral system** where existing users (Customers and Vendors) earn **surprise prizes** when they reach referral milestones.

### Key Facts from Code

| Property | Value |
|----------|-------|
| **Roles Supported** | Customer, Vendor |
| **Referral Counting** | Counts ALL referred users regardless of role (cross-role counting ✅) |
| **Qualifying Condition** | Referred user must complete 2 orders (Customer) or 3 orders (Vendor) |
| **Referral Code Length** | 8 characters, uppercase alphanumeric |
| **Referral URL Format** | `https://coneco.store/register?ref=XXXXXXXX` |
| **Prize Nature** | Surprise prizes (not fixed wallet credits — admin decides what to give) |
| **Milestone Tiers** | 3 tiers per role |
| **Admin Action** | Admin manually fulfills prize → marks `prize_fulfilled = TRUE` |

---

## 2. How It Works — Actual Flow

```
[Existing User — Customer or Vendor]
        │
        │  1. Logs in → visits /referral page (or sees ReferralCard on dashboard)
        │  2. Gets their unique 8-character referral code
        │  3. Shares via: WhatsApp message OR Email OR Copy link
        │
        ▼
[New User Receives the Link]
        │
        │  Link format: https://coneco.store/register?ref=XXXXXXXX
        │
        ▼
[New User Registers on Con-Eco]
        │
        │  System reads ?ref= param from URL → stores referred_by_user_id in users table
        │  New user can register as EITHER Customer OR Vendor (cross-role counts ✅)
        │
        ▼
[New User Verifies Email]
        │
        │  email_verified = TRUE → referral tracked as PENDING
        │
        ▼
[New User Completes Orders]
        │
        │  Customer completes 2 orders OR Vendor completes 3 orders
        │  Referral becomes QUALIFIED and counts towards milestones
        │
        ▼
[Referrer's Count Increases]
        │
        │  Backend auto-checks milestones when /my-stats or order update is triggered
        │  If threshold crossed → milestone row inserted into referral_milestones table
        │
        ▼
[Milestone Achieved]
        │
        │  User sees "🎉 Achieved!" badge on their /referral page
        │  UI message: "Our team will reach out to you soon with your surprise prize!"
        │
        ▼
[Admin Fulfills Prize]
        │
        │  Admin visits /admin/referrals
        │  Clicks "Mark Fulfilled" on the user's achieved tier
        │  prize_fulfilled = TRUE, fulfilled_at = NOW()
        │
        ▼
[User sees "✅ Prize Claimed" on their referral page]
```

---

## 3. Referral Code Format

**Source:** `Backend/routers/referrals.py` → `generate_referral_code()`

```
Format:   8 uppercase alphanumeric characters
Charset:  A-Z + 0-9
Example:  AB3KX9QZ
          TY7MWR2P
```

> ❌ **NOT** the `CECO-CST-X7K2M` format that was in the old plan file.  
> ✅ **Correct:** Plain 8-char code like `AB3KX9QZ`

### Shareable Link
```
https://coneco.store/register?ref=AB3KX9QZ
```

### WhatsApp Auto-Message (from ReferralCard.jsx)
```
"Join me on ConEco — India's B2B Construction Marketplace! 🏗️
Use my referral link to get started: https://coneco.store/register?ref=AB3KX9QZ"
```

---

## 4. Milestone Reward Tiers — Actual Values

**Source:** `Backend/routers/referrals.py` lines 19–20 + `Frontend/src/pages/ReferralPage.jsx` lines 8–18

### Customer Milestones

| Tier | Referrals Required | Icon | Label | Prize |
|------|--------------------|------|-------|-------|
| Tier 1 | **25 verified referrals** | 🎁 | Tier 1 Prize | Surprise prize (admin decides) |
| Tier 2 | **50 verified referrals** | 🎀 | Tier 2 Prize | Surprise prize (admin decides) |
| Tier 3 | **100 verified referrals** | 💎 | Tier 3 Prize | Surprise prize (admin decides) |

### Vendor Milestones

| Tier | Referrals Required | Icon | Label | Prize |
|------|--------------------|------|-------|-------|
| Tier 1 | **50 verified referrals** | 🏆 | Tier 1 Prize | Surprise prize (admin decides) |
| Tier 2 | **100 verified referrals** | 🥇 | Tier 2 Prize | Surprise prize (admin decides) |
| Tier 3 | **200 verified referrals** | 👑 | Tier 3 Prize | Surprise prize (admin decides) |

### Important Points About Prizes

> ✅ Prizes are intentionally **kept as a surprise** — the UI tells users:  
> *"Reach each milestone to unlock a special prize. Prizes are revealed when claimed! 🔒"*
>
> ✅ When a milestone is achieved, the UI says:  
> *"🎊 Our team will reach out to you soon with your surprise prize!"*
>
> ✅ The admin has **full discretion** on what prize to give — it is NOT a fixed wallet/cash amount.  
> ✅ After admin marks it fulfilled, the user sees: **"✅ Prize Claimed"**

---

## 5. Referral Rules — Actual Logic

**Source:** `Backend/routers/referrals.py`

| Rule | Actual Behavior |
|------|----------------|
| **Who can refer** | Any logged-in Customer or Vendor |
| **Who can be referred** | Any new user — Customer or Vendor (cross-role allowed ✅) |
| **Qualifying condition** | Referred user MUST complete 2 orders (Customer) or 3 orders (Vendor) and be email verified |
| **When does count increase** | When the required number of orders are marked as 'Completed' |
| **Self-referral** | Not explicitly blocked in code — however, the referred_by field links to another user by ID |
| **Multiple referrers** | Each user has only ONE `referred_by_user_id` — first referral code used at registration wins |
| **Referral code entry time** | Must be in the URL at registration — cannot be added after signup |
| **Code generation** | Auto-generated if user doesn't have one (lazy generation on first API call) |
| **Milestone auto-detection** | `check_and_award_milestones()` runs when `/my-stats` is called — NOT in real-time on every signup |
| **Duplicate milestone** | `UNIQUE(user_id, tier)` constraint — each tier logged only once per user |

### Referral Counting SQL (actual query from code)
```sql
SELECT COUNT(*) as total
FROM users u
WHERE u.referred_by_user_id = <referrer_id> 
  AND u.email_verified = TRUE
```

---

## 6. Database Schema — Actual Tables

**Source:** `Backend/migrate_referrals.py`

### Changes to `users` Table

```sql
-- Two columns added to existing users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code VARCHAR(12) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by_user_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL;
```

> Note: Code declares `VARCHAR(12)` in migration but generates 8-char codes — gives room for future extension.

### `referral_milestones` Table

```sql
CREATE TABLE IF NOT EXISTS referral_milestones (
    id                    SERIAL PRIMARY KEY,
    user_id               INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    tier                  INTEGER NOT NULL,           -- 1, 2, or 3
    role                  VARCHAR(20) NOT NULL,       -- 'Customer' or 'Vendor'
    referral_count        INTEGER NOT NULL,           -- count at time milestone was reached
    achieved_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    prize_fulfilled       BOOLEAN DEFAULT FALSE,
    fulfilled_at          TIMESTAMP,
    fulfilled_by_admin_id INTEGER,                   -- which admin fulfilled it
    notes                 TEXT,
    UNIQUE(user_id, tier)                             -- each tier can only be logged once
);
```

> ❌ **NOT three separate tables** (ReferralCodes, Referrals, ReferralMilestones) as in the old plan.  
> ✅ **Actual design:** Two columns on `users` table + one `referral_milestones` table.

---

## 7. Backend API Routes — Actual Endpoints

**Source:** `Backend/routers/referrals.py`  
**Prefix:** `/api/referrals`

| Method | Route | Who | Description |
|--------|-------|-----|-------------|
| `GET` | `/api/referrals/my-stats` | Logged-in user | Returns referral code, link, total count, milestone progress |
| `GET` | `/api/referrals/history` | Logged-in user | Returns list of referred users with name, role, joined date, verification status |
| `GET` | `/api/referrals/admin/all` | Admin / Super Admin / Employee | Returns all users with referral count + milestone data |
| `PUT` | `/api/referrals/admin/fulfill/{user_id}/{tier}` | Admin / Super Admin only | Marks a specific tier's prize as fulfilled |

### `/api/referrals/my-stats` Response Example

```json
{
  "status": "success",
  "referral_code": "AB3KX9QZ",
  "referral_link": "https://coneco.store/register?ref=AB3KX9QZ",
  "total_referrals": 30,
  "role": "Customer",
  "milestones": [
    {
      "tier": 1,
      "required": 25,
      "achieved": true,
      "progress_pct": 100,
      "remaining": 0,
      "achieved_at": "2026-06-28 10:30:00",
      "prize_fulfilled": false
    },
    {
      "tier": 2,
      "required": 50,
      "achieved": false,
      "progress_pct": 60,
      "remaining": 20
    },
    {
      "tier": 3,
      "required": 100,
      "achieved": false,
      "progress_pct": 30,
      "remaining": 70
    }
  ],
  "next_milestone": {
    "tier": 2,
    "required": 50,
    "remaining": 20
  }
}
```

### `/api/referrals/history` Response Example

```json
{
  "status": "success",
  "referred_users": [
    {
      "user_id": 42,
      "name": "Ramesh Kumar",
      "referred_role": "Customer",
      "joined_date": "28 Jun 2026",
      "email_verified": true
    },
    {
      "user_id": 57,
      "name": "Anil Traders Pvt Ltd",
      "referred_role": "Vendor",
      "joined_date": "30 Jun 2026",
      "email_verified": false
    }
  ]
}
```

---

## 8. Frontend Components — Actual UI

**Source:** `Frontend/src/components/ReferralCard.jsx` & `Frontend/src/pages/ReferralPage.jsx`

### 8A. `ReferralCard.jsx` — Dashboard Widget

Location on dashboard: Shown on **Customer Dashboard** and **Vendor Dashboard** sidebars.

**What it shows:**
- User's referral code (large monospace text, green)
- **Copy Link** button (copies full referral URL)
- **WhatsApp share** button (pre-written message)
- **Email share** button (pre-written subject + body)
- Progress bar → current referrals / next milestone threshold
- 3 tier badge icons (locked 🔒 until achieved)
- "Full Dashboard →" link to `/referral`

---

### 8B. `ReferralPage.jsx` — Full Page `/referral`

Accessible by: Customers via CustomerSidebar, Vendors via VendorSidebar.

**Sections:**

1. **Header panel** — Program title + total referral count (large number)
2. **Referral Code Card** — Shows code + full URL + Copy / WhatsApp / Email buttons
3. **"How It Works" steps** (4 steps):
   - Share your referral link
   - They register on ConEco using your link (any role)
   - Once email verified → you earn a referral point
   - Reach milestones → unlock surprise prizes
4. **Prize Milestones panel** — 3 tier cards with:
   - Progress bar per tier
   - "🎉 Achieved!" or "✅ Prize Claimed" status badges
   - Message when achieved: *"Our team will reach out to you soon with your surprise prize!"*
5. **Referral History Table** — Name, role, join date, verification status (✅ Verified / ⏳ Pending)

---

### 8C. `AdminReferrals.jsx` — `/admin/referrals`

Accessible by: Admin, Super Admin, Employee roles.

**Sections:**
1. **Stats Row** — Total Users, Vendors, Customers, Active Referrers, Total Milestones Hit
2. **Orange badge** — "Prizes Pending" count (milestones achieved but not yet fulfilled)
3. **Filters** — By Role (All / Vendor / Customer) + By Status (All / Has Milestones / Pending Prize)
4. **User Table** — User name + email + join date, Role badge, Referral Code, Referral Count, Milestone status with "Mark Fulfilled" button

---

### 8D. `Register.jsx` — Registration Page

Accessible by: Any logged-out user.

**Referral Capabilities:**
1. **Auto-fills code** if user arrives via `?ref=XXXXXXXX` URL parameter.
2. **Manual Entry** allows users to type in a code they received via text/word-of-mouth.
3. Shows a **✅ Applied!** badge when a valid 8-character code is detected.
4. Passes the `referral_code` safely to the backend on submission.

---

## 9. Admin Dashboard — Actual Capabilities

| Capability | Available |
|------------|-----------|
| View all users with referral counts | ✅ Yes |
| Filter by role (Customer/Vendor) | ✅ Yes |
| Filter by milestone status | ✅ Yes |
| See pending prize count on header | ✅ Yes |
| Mark individual tier prizes as fulfilled | ✅ Yes (PUT endpoint) |
| View which admin fulfilled it | ✅ Yes (fulfilled_by_admin_id stored) |

> 📄 Pending features for the Admin Dashboard are tracked in **REFERRAL_UPDATE_FEATURES.md**

---

## 📌 Summary

| What Was Expected | What Actually Exists |
|-------------------|----------------------|
| Separate ReferralCodes table | `referral_code` column on `users` table |
| Separate Referrals table | `referred_by_user_id` column on `users` table |
| Fixed ₹ reward amounts | Surprise prizes — admin decides |
| 4 tiers (Bronze/Silver/Gold/Platinum) | 3 tiers (Tier 1, Tier 2, Tier 3) |
| Customer: 1/5/10/25 referrals | Customer: 25/50/100 referrals |
| Vendor: 1/3/7/15 referrals | Vendor: 50/100/200 referrals |
| CECO-CST-XXXXX code format | 8-char alphanumeric (e.g. AB3KX9QZ) |

---

*Generated from actual codebase | Backend: Python/FastAPI | Frontend: React | DB: PostgreSQL (Neon)*
