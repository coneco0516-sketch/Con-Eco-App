# ConEco — Future Features Implementation Roadmap

> Build these **one at a time, in order**, on the web platform before mobile app development begins.

---

## 📊 Priority Order Overview

| # | Feature | Complexity | Impact | Estimated Effort |
|---|---|---|---|---|
| 1 | **Project-Based Procurement** | Medium | 🔥 Very High | 1–2 Weeks |
| 2 | **Reverse Auction / RFQ Engine** | High | 🔥 Very High | 2–3 Weeks |
| 3 | **Material Comparison Tool** | Low–Medium | ⚡ High | 1 Week |
| 4 | **Logistics & Freight Calculator** | Medium | ⚡ High | 1–2 Weeks |
| 5 | **Live Negotiation Chat** | Medium | ⚡ High | 1–2 Weeks |
| 6 | **Service Scheduling & Milestone Payments** | High | 🔥 Very High | 2–3 Weeks |

---

---

# 🏗️ FEATURE 1 — Project-Based Procurement

## What It Does
Allows customers to group orders under named project sites (e.g., "Villa Construction - Plot 12"). Vendors see which site orders are for. Admins get site-level analytics.

## Database Changes

```sql
-- New table: project sites
CREATE TABLE ProjectSites (
    site_id SERIAL PRIMARY KEY,
    customer_id INT REFERENCES Customers(customer_id),
    site_name VARCHAR(200) NOT NULL,
    site_address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    budget DECIMAL(12,2),
    status VARCHAR(30) DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Link orders to a project site
ALTER TABLE Orders ADD COLUMN site_id INT REFERENCES ProjectSites(site_id);
```

## Backend API (FastAPI — `customer.py`)

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/customer/sites` | List all project sites for logged-in customer |
| `POST` | `/api/customer/sites` | Create new project site |
| `GET` | `/api/customer/sites/{site_id}/orders` | Fetch all orders under a specific site |
| `DELETE` | `/api/customer/sites/{site_id}` | Delete a site |

## Frontend Pages (React)

| Page/Component | What to Build |
|---|---|
| `ProjectSites.jsx` | Dashboard listing all project sites as cards, with a "Create New Site" button |
| `ProjectSiteDetail.jsx` | Site-specific view: orders grouped by product/service, budget progress bar, total spent |
| `CheckoutForm.jsx` (modify) | Add a dropdown to tag the order to an existing project site |
| `CustomerSidebar.jsx` (modify) | Add "My Projects" navigation link |

## UI Design Hints
- Each site card shows: Site name, City, Total Orders, Total Spent vs Budget (progress bar).
- Budget bar turns **amber** at 80% and **red** at 100%.

---

---

# 📑 FEATURE 2 — Reverse Auction / RFQ Engine

## What It Does
Customer posts a material/service requirement. Multiple vendors see it and submit competitive bids. Customer compares bids and accepts one — that spawns the order automatically.

## Database Changes

```sql
-- New table: RFQ requests posted by customers
CREATE TABLE RFQRequests (
    rfq_id SERIAL PRIMARY KEY,
    customer_id INT REFERENCES Customers(customer_id),
    site_id INT REFERENCES ProjectSites(site_id),
    item_type VARCHAR(20),           -- 'Product' or 'Service'
    category VARCHAR(100),
    title VARCHAR(300),
    description TEXT,
    quantity INT,
    unit VARCHAR(50),
    required_by DATE,
    delivery_address TEXT,
    status VARCHAR(30) DEFAULT 'Open', -- Open, Awarded, Closed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vendor bids on RFQs
CREATE TABLE RFQBids (
    bid_id SERIAL PRIMARY KEY,
    rfq_id INT REFERENCES RFQRequests(rfq_id),
    vendor_id INT REFERENCES Vendors(vendor_id),
    unit_price DECIMAL(10,2),
    total_price DECIMAL(12,2),
    delivery_days INT,
    note TEXT,
    status VARCHAR(20) DEFAULT 'Pending', -- Pending, Accepted, Rejected
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Backend API

| Actor | Method | Endpoint | Purpose |
|---|---|---|---|
| Customer | `POST` | `/api/customer/rfq` | Post new RFQ requirement |
| Customer | `GET` | `/api/customer/rfq` | List own RFQs and their bids |
| Customer | `POST` | `/api/customer/rfq/accept_bid` | Accept a vendor bid (auto-creates order) |
| Vendor | `GET` | `/api/vendor/rfq` | Browse open RFQs matching vendor category |
| Vendor | `POST` | `/api/vendor/rfq/bid` | Submit a bid |
| Admin | `GET` | `/api/admin/rfq` | Monitor all RFQs and bid activity |

## Frontend Pages

| Page | What to Build |
|---|---|
| `CustomerRFQ.jsx` | Form to post requirement + list of own posted RFQs with bid count badges |
| `RFQBidDetail.jsx` | Side-by-side bid comparison table (Vendor Name, QC Score, Price, Delivery Days) with "Accept" button |
| `VendorRFQBoard.jsx` | Card grid of open RFQ posts matching the vendor's categories with "Place Bid" modal |
| `AdminRFQMonitor.jsx` | Table of all RFQs: status, bid count, awarded vendor, customer |

## UI Design Hints
- Bid comparison table highlights the **lowest price** in green and the **highest QC score** in blue.
- A countdown timer shows "X days left" for open RFQs.
- Vendor bids show a subtle animation when submitted.

---

---

# 📈 FEATURE 3 — Material Comparison Tool

## What It Does
Customers can select up to 4 products and compare their technical specifications side-by-side before adding to cart. Vendors can upload lab test/quality certificates.

## Database Changes

```sql
-- Extend Products/Services with structured spec and certificate fields
ALTER TABLE Products
    ADD COLUMN spec_sheet JSONB,        -- { "grade": "Fe500D", "strength": "500MPa" }
    ADD COLUMN certificates JSONB;       -- [{ "name": "BIS Cert", "url": "/uploads/..." }]

ALTER TABLE Services
    ADD COLUMN spec_sheet JSONB,
    ADD COLUMN certificates JSONB;
```

## Backend API

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/customer/compare?ids=1,2,3` | Return full spec data for up to 4 product IDs |
| `POST` | `/api/vendor/catalogue/upload_certificate` | Upload a lab/quality certificate PDF for a product |

## Frontend Pages

| Page/Component | What to Build |
|---|---|
| `CompareBar.jsx` | A sticky bottom bar that fills as customer taps "Compare" on product cards (max 4) |
| `CompareTable.jsx` | Full-screen comparison table: rows = spec fields, columns = selected products |
| `ProductDetail.jsx` (modify) | Add "Certificates" tab showing downloadable PDFs |
| `VendorCatalogueForm.jsx` (modify) | Add spec fields and a certificate upload button |

## UI Design Hints
- Comparison table highlights cells that differ between products in amber.
- "Best Value" crown icon placed on the product with the best QC score among compared items.

---

---

# 🚚 FEATURE 4 — Logistics & Freight Calculator

## What It Does
Automatically adds a calculated freight/transport charge to the order total based on the distance between the vendor's warehouse and the customer's delivery address.

## Database Changes

```sql
-- Add vendor warehouse location
ALTER TABLE Vendors
    ADD COLUMN warehouse_lat DECIMAL(10,8),
    ADD COLUMN warehouse_lng DECIMAL(11,8),
    ADD COLUMN warehouse_address TEXT;

-- Extend Orders with logistics info
ALTER TABLE Orders
    ADD COLUMN freight_charge DECIMAL(10,2) DEFAULT 0,
    ADD COLUMN vehicle_type VARCHAR(50),
    ADD COLUMN distance_km DECIMAL(8,2),
    ADD COLUMN eway_bill_url TEXT,
    ADD COLUMN gate_pass_url TEXT;
```

## Backend API

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/customer/freight/estimate` | Accepts vendor ID + delivery coordinates, returns distance and freight estimate |
| `POST` | `/api/vendor/orders/{id}/upload_eway` | Upload E-Way bill for an order |
| `PUT` | `/api/vendor/profile/warehouse` | Update warehouse lat/lng and address |

## External Integration
- Use **OpenRouteService** (free) or **Google Maps Distance Matrix API** to calculate road distance.
- Base freight formula: `₹ = Base Rate + (Rate Per KM × Distance)`

## Frontend Changes

| Component | What to Build |
|---|---|
| `CartSummary.jsx` (modify) | Add "Freight Estimate" section with a delivery pincode input that triggers the API call |
| `VendorProfile.jsx` (modify) | Add a warehouse location picker (map pin or address input with geocoding) |
| `VendorOrderCard.jsx` (modify) | Add "Upload E-Way Bill" and "Upload Gate Pass" buttons alongside the existing bill upload |
| `MyBookedServices.jsx` (modify) | Show freight amount and vehicle type in the order breakdown panel |

---

---

# 💬 FEATURE 5 — Live Negotiation Chat

## What It Does
Replaces the current static bulk negotiation input with a real-time conversation thread between buyer and vendor, tied to each order card with a full counter-offer audit trail.

## Database Changes

```sql
-- Negotiation messages per order
CREATE TABLE NegotiationMessages (
    msg_id SERIAL PRIMARY KEY,
    order_id INT REFERENCES Orders(order_id),
    sender_role VARCHAR(20),   -- 'Customer' or 'Vendor'
    sender_id INT,
    message TEXT,
    offer_price DECIMAL(10,2), -- NULL if just a message, populated if it's a price offer
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Backend API

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/negotiations/{order_id}` | Fetch all messages for an order |
| `POST` | `/api/negotiations/{order_id}/message` | Send a message or counter-offer |
| `POST` | `/api/negotiations/{order_id}/accept` | Accept the latest price offer — updates order amount |

## Frontend Changes

| Component | What to Build |
|---|---|
| `NegotiationChat.jsx` | WhatsApp-style chat bubble UI within the order card. Messages from vendor on right, customer on left. |
| `PriceOfferBubble.jsx` | Special bubble style for price offers: shows ₹ amount with Accept / Counter buttons |
| `VendorOrders.jsx` (modify) | Replace the static bulk negotiation form with the `NegotiationChat` component |
| `MyBookedServices.jsx` (modify) | Show the negotiation thread (read + reply) from the customer's side |

## UI Design Hints
- Messages load in real-time using **polling every 5 seconds** (simple) or **WebSocket** (advanced).
- Price offer bubbles have a distinct amber background to stand out from text messages.
- An audit trail section at the bottom of the thread shows a final timeline: "Original ₹500 → Counter ₹450 → Agreed ₹470."

---

---

# 📅 FEATURE 6 — Service Scheduling & Milestone Payments

## What It Does
Service bookings are broken into multiple scheduled milestones. Payment is released to the vendor only when the customer approves each milestone completion. Both parties share a live calendar.

## Database Changes

```sql
-- Milestone plan for a service order
CREATE TABLE ServiceMilestones (
    milestone_id SERIAL PRIMARY KEY,
    order_id INT REFERENCES Orders(order_id),
    title VARCHAR(200),             -- e.g. "Foundation Tiling"
    description TEXT,
    scheduled_date DATE,
    payment_percentage INT,         -- e.g. 30 (means 30% of total)
    payment_amount DECIMAL(10,2),
    status VARCHAR(30) DEFAULT 'Pending', -- Pending, In Progress, Done, Approved
    vendor_note TEXT,
    customer_note TEXT,
    completed_at TIMESTAMP,
    approved_at TIMESTAMP
);
```

## Backend API

| Actor | Method | Endpoint | Purpose |
|---|---|---|---|
| Vendor | `POST` | `/api/vendor/orders/{id}/milestones` | Create milestone plan for a service order |
| Vendor | `PUT` | `/api/vendor/milestones/{id}/complete` | Mark a milestone as completed |
| Customer | `PUT` | `/api/customer/milestones/{id}/approve` | Approve a milestone (releases payment) |
| Both | `GET` | `/api/milestones/{order_id}` | Fetch full milestone plan for an order |

## Frontend Changes

| Component | What to Build |
|---|---|
| `MilestoneTimeline.jsx` | Vertical stepper/timeline UI showing each milestone as a step: scheduled date, status badge, payment %, Approve button |
| `VendorMilestoneBuilder.jsx` | Drag-and-reorder milestone planner that vendors fill in when a service is confirmed |
| `ServiceOrderDetail.jsx` | Service booking detail page embedding the `MilestoneTimeline` + shared calendar view |
| `MyBookedServices.jsx` (modify) | Expand service cards to show milestone progress (e.g., "2 of 4 milestones completed") |
| `VendorOrders.jsx` (modify) | Service order cards show "Manage Milestones" button when status is `Confirmed` or `Scheduled` |

## UI Design Hints
- Timeline uses color-coded step icons: ⚫ Pending → 🔵 In Progress → 🟡 Awaiting Approval → ✅ Approved.
- Each milestone shows a payment release badge (e.g., "₹12,000 — 30% of total").
- A compact progress bar at the top of the order card shows "₹24,000 released of ₹40,000 total."

---

---

## 🗓️ Recommended Build Order

```
Month 1:
  Week 1–2  → Feature 1: Project Sites
  Week 3    → Feature 3: Comparison Tool (quick win)
  Week 4    → Feature 4: Freight Calculator

Month 2:
  Week 1–2  → Feature 5: Negotiation Chat
  Week 3–4  → Feature 2: RFQ Engine

Month 3:
  Week 1–3  → Feature 6: Service Milestones
  Week 4    → Polish, QA, and performance review
```

> **Important:** Start with **Feature 1 (Project Sites)** because it is the foundational layer.
> Features 2, 4, and 6 all benefit from knowing which site/project an order belongs to.

> **Tip:** Feature 3 (Comparison Tool) is the **quickest to ship** (no schema changes beyond JSONB columns)
> and gives a strong visual impact — great for showing stakeholders progress quickly.

---

*Built with ❤️ by ConEco Team — Empowering Businesses, Simplifying Trade.*
