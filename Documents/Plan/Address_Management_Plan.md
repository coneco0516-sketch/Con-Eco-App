# ConEco — Address Management System Plan

> Implement a proper saved-address book (like Amazon/Flipkart) across all three user flows.
> Currently, checkout uses a plain textarea. This plan replaces it with a structured, multi-address system.

---

## 🔍 What's Wrong Now

| Location | Current State | Problem |
|---|---|---|
| `Checkout.jsx` | Plain `<textarea>` for delivery address | Customer types full address manually every order |
| `CustomerProfile.jsx` | No address section | No saved address book |
| `VendorProfile.jsx` | Single business address field | No warehouse/pickup address book |
| `Register.jsx` | Basic address field | No structured address input |

---

## 🎯 Target Experience (Like Amazon / Flipkart)

- Customer has a **saved address book** (Home, Office, Project Site)
- At checkout → **"Select a saved address"** or **"Add new address"**
- Pincode auto-fills City and State
- One address is marked **Default**
- Vendor has a **warehouse address** shown to customers on their profile
- Admin can view customer/vendor addresses in their panels

---

## 🗄️ Database Changes

```sql
-- New table: Saved addresses for ALL user types
CREATE TABLE SavedAddresses (
    address_id   SERIAL PRIMARY KEY,
    user_id      INT NOT NULL,              -- Works for Customer, Vendor, or Admin
    user_type    VARCHAR(20) NOT NULL,      -- 'Customer', 'Vendor', 'Admin'
    label        VARCHAR(50),              -- 'Home', 'Office', 'Site A', 'Warehouse'
    full_name    VARCHAR(150),             -- Contact person name
    phone        VARCHAR(15),             -- Contact person phone
    line1        VARCHAR(255) NOT NULL,   -- Flat/House No, Street
    line2        VARCHAR(255),            -- Landmark, Area (optional)
    city         VARCHAR(100) NOT NULL,
    state        VARCHAR(100) NOT NULL,
    pincode      VARCHAR(10) NOT NULL,
    is_default   BOOLEAN DEFAULT FALSE,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ensure only one default address per user
CREATE UNIQUE INDEX idx_one_default_address
    ON SavedAddresses (user_id, user_type)
    WHERE is_default = TRUE;
```

> **No change needed to `Orders` table** — the `delivery_address` column keeps storing the final formatted string. The address book just pre-fills it cleanly.

---

## 🔌 Backend API

### New Router: `addresses.py`

| Method | Endpoint | Who Uses It | Purpose |
|---|---|---|---|
| `GET` | `/api/addresses` | All roles | List all saved addresses for logged-in user |
| `POST` | `/api/addresses` | All roles | Add a new saved address |
| `PUT` | `/api/addresses/{id}` | All roles | Edit an existing address |
| `DELETE` | `/api/addresses/{id}` | All roles | Delete an address |
| `POST` | `/api/addresses/{id}/set_default` | All roles | Mark an address as default |
| `GET` | `/api/pincode/{pincode}` | All roles | Auto-fill city + state from pincode (using free India Pincode API) |

### Sample Pincode Lookup (Free API)
```python
import httpx

@router.get("/pincode/{pincode}")
async def lookup_pincode(pincode: str):
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"https://api.postalpincode.in/pincode/{pincode}"
        )
        data = resp.json()
        if data and data[0]["Status"] == "Success":
            po = data[0]["PostOffice"][0]
            return {"city": po["District"], "state": po["State"]}
    return {"city": "", "state": ""}
```

---

## 🎨 Frontend Components to Build

### 1. `AddressCard.jsx` — Shared Reusable Component
A card that displays a single saved address with Edit / Delete / Set Default actions.

```
┌─────────────────────────────────────────┐
│  🏠 Home                    [Default ✓] │
│  Ravi Kumar  |  📞 98xxxxxxxx           │
│  Flat 4B, Sunrise Apartments            │
│  MG Road, Sector 12                     │
│  Bangalore, Karnataka — 560001          │
│                                         │
│  [✏️ Edit]  [🗑 Delete]  [☑ Set Default] │
└─────────────────────────────────────────┘
```

### 2. `AddressFormModal.jsx` — Shared Add/Edit Form Modal

Fields:
- **Label** (Home / Office / Site / Warehouse / Other) — pill selector
- **Full Name** — contact person at this address
- **Phone** — 10-digit mobile
- **Pincode** — auto-fetches City & State on blur
- **City** — auto-filled but editable
- **State** — auto-filled but editable
- **Address Line 1** — House No., Street
- **Address Line 2** — Landmark, Area (optional)
- **Set as Default** — checkbox

### 3. `AddressBook.jsx` — Full Address Management Page

Used inside Customer Profile and Vendor Profile as a tab section.

Layout:
```
My Addresses                [+ Add New Address]

┌────────────┐  ┌────────────┐  ┌────────────┐
│  🏠 Home   │  │ 🏢 Office  │  │ 🏗️ Site A  │
│  [Default] │  │            │  │            │
│  ...       │  │  ...       │  │  ...       │
└────────────┘  └────────────┘  └────────────┘
```

### 4. `AddressSelector.jsx` — Used at Checkout

Replaces the textarea in `Checkout.jsx`.

```
📍 Delivery Address

○ 🏠 Home — Flat 4B, MG Road, Bangalore - 560001  [Default]
○ 🏢 Office — 3rd Floor, Tech Park, Pune - 411001
○ 🏗️ Site A — Plot 12, Sector 62, Noida - 201301

[+ Add a New Address]
```

On selection, it formats the address string and passes it to the order placement API.

---

## 📋 Changes Per Flow

### 👤 Customer Flow

| File | Change |
|---|---|
| `CustomerProfile.jsx` | Add **"My Addresses"** tab/section with `AddressBook` component |
| `Checkout.jsx` | Replace textarea with `AddressSelector` component |
| `Register.jsx` | Add optional address fields (Label, Pincode, Line1) — saved on registration |
| `CustomerSidebar.jsx` | No change needed (accessible via Profile) |

### 🏪 Vendor Flow

| File | Change |
|---|---|
| `VendorProfile.jsx` | Add **"Business Addresses"** section with `AddressBook` (labelled: Warehouse, Registered Office, Pickup Point) |
| `Register.jsx` | On Vendor registration, add a "Primary Business Address" section |
| `VendorDashboard.jsx` | Show default warehouse address in the dashboard summary card |

### 🛡️ Admin Flow

| File | Change |
|---|---|
| `AdminProfile.jsx` | Add **"My Address"** section (single address for Admin's own office/location) |
| `AdminOrders.jsx` | Show the formatted delivery address in the expanded order view |
| No new pages needed | Admin reads customer delivery addresses from existing order data |

---

## 📐 Address Label Types Per Role

| Label | Customer | Vendor | Admin |
|---|---|---|---|
| 🏠 Home | ✅ | ❌ | ✅ |
| 🏢 Office | ✅ | ✅ | ✅ |
| 🏗️ Site | ✅ | ❌ | ❌ |
| 🏭 Warehouse | ❌ | ✅ | ❌ |
| 📦 Pickup Point | ❌ | ✅ | ❌ |
| 📌 Other | ✅ | ✅ | ✅ |

---

## 🗓️ Build Order

```
Step 1: DB — Create SavedAddresses table + index (10 mins)
Step 2: Backend — Create addresses.py router + pincode lookup (1 day)
Step 3: Frontend — Build AddressCard + AddressFormModal components (1 day)
Step 4: Frontend — Build AddressBook page component (half day)
Step 5: Frontend — Build AddressSelector for Checkout (half day)
Step 6: Integration — Wire CustomerProfile → AddressBook (half day)
Step 7: Integration — Wire VendorProfile → AddressBook (half day)
Step 8: Integration — Wire Checkout → AddressSelector (half day)
Step 9: Integration — Register.jsx optional address pre-fill (half day)
Step 10: Test all three flows end-to-end (1 day)
```

**Total Estimated Effort: ~5 Working Days**

---

## ✅ UX Rules (Best Practice)

1. **Always show "Add New Address"** option at the bottom of the selector — never block checkout if no saved addresses exist.
2. **Pincode lookup is non-blocking** — if the API fails, the user can still manually type city and state.
3. **Maximum 10 saved addresses** per user to keep the UI clean.
4. **Default address is always pre-selected** at checkout — zero extra clicks for repeat buyers.
5. **Confirm before delete** — show a modal if the address being deleted is the default one.

---

*This plan brings ConEco address management to par with Amazon India and Flipkart's address book UX.*
