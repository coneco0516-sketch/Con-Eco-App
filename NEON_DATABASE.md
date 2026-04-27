# 🗄️ Neon PostgreSQL — Database Setup Guide

ConEco uses **[Neon](https://neon.tech)** as its serverless PostgreSQL database — a modern, scalable, and free-tier friendly alternative to traditional hosted databases.

---

## 📋 Why Neon?

| Feature | Detail |
|---|---|
| **Serverless** | Scales to zero when not in use — no idle charges |
| **PostgreSQL** | Full PostgreSQL 16 compatibility |
| **Free Tier** | 0.5 GB storage, 1 project, unlimited databases |
| **Branching** | Create instant DB branches for dev/staging |
| **Connection Pooling** | Built-in PgBouncer pooler |
| **Global** | Multiple regions available |

---

## 🚀 1. Create a Neon Project

1. Go to [https://console.neon.tech](https://console.neon.tech)
2. Sign in with GitHub
3. Click **New Project**

| Setting | Value |
|---|---|
| **Project Name** | `coneco-db` |
| **PostgreSQL Version** | 16 (latest) |
| **Region** | Asia Pacific (Singapore) |
| **Database Name** | `neondb` |

4. Click **Create Project**

---

## 🔗 2. Get Your Connection String

After creating the project:

1. Go to **Dashboard → Connection Details**
2. Select **Connection string** format
3. Choose **Pooled connection** (recommended for production)

Your connection string will look like:
```
postgresql://username:password@ep-cool-name-123456.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
```

> ⚠️ **Always use `?sslmode=require`** — Neon enforces SSL connections.

---

## ⚙️ 3. Set Up the Database Schema

### Option A: Run the setup script

```bash
# From the Backend/ directory
python setup_neon.py
```

This script creates all ConEco tables automatically.

### Option B: Run the SQL file directly

In the Neon SQL Editor (Dashboard → SQL Editor):

```sql
-- Paste contents of Backend/schema_full.sql
```

---

## 🔐 4. Environment Variable

Add to your `Backend/.env` and Render environment:

```env
DATABASE_URL=postgresql://username:password@ep-xxxx.neon.tech/neondb?sslmode=require
```

---

## 🌿 5. Using Neon Branches (Dev vs Production)

Neon allows database **branching** — great for testing without touching production data.

```
main branch → Production DB
dev branch  → Development/Testing DB
```

To create a branch:
1. Neon Dashboard → **Branches** → **New Branch**
2. Name it `dev` or `staging`
3. Get a separate connection string for that branch
4. Use it in your local `.env` file

---

## 🔄 6. Running Migrations

ConEco migration scripts are in the `Backend/` folder:

```bash
# Initial setup (run once)
python setup_neon.py

# Add commission system
python migrate_commissions.py

# Add email verification columns
python migrate_add_email_verification.py

# Add GST columns
python migrate_gst.py

# Add category columns
python migrate_categories.py

# Add credit system (Pay Later feature)
python migrate_credit_system.py
```

> Always run migrations in order on a fresh database.

---

## 📊 7. Neon SQL Editor — Useful Queries

Access from: **Neon Dashboard → SQL Editor**

```sql
-- View all tables
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public';

-- Count users by role
SELECT role, COUNT(*) FROM users GROUP BY role;

-- View pending orders
SELECT * FROM orders WHERE status = 'Pending' LIMIT 10;

-- Check credit accounts
SELECT customer_id, credit_limit, credit_used, credit_status
FROM customers WHERE credit_limit > 0;

-- View platform settings
SELECT * FROM platformsettings;
```

---

## 🔁 8. Connection Pooling

For production use, always use the **pooled connection string** (PgBouncer):

- **Direct connection** → `ep-cool-name.neon.tech` (for migrations)
- **Pooled connection** → `ep-cool-name-pooler.neon.tech` (for app runtime)

The pooled endpoint is shown in Neon Dashboard under **Connection Details → Pooled connection**.

---

## ⚠️ Free Tier Limits

| Limit | Value |
|---|---|
| Storage | 0.5 GB |
| Projects | 1 |
| Compute hours | 191.9 hours/month |
| Branches | 10 |
| Connections | Unlimited via pooler |

**Tip:** The free tier is sufficient for development and early production traffic.

---

## 🛠 Troubleshooting

### `SSL connection required`
Add `?sslmode=require` to your connection string.

### `Too many connections`
Switch to the **pooled** connection endpoint.

### `Database does not exist`
Run `setup_neon.py` to create all tables.

### Slow first query (cold start)
Neon computes spin down after inactivity — the first query takes ~1–2 seconds to wake up. This is normal on the free tier.

---

*Last updated: April 2026 | ConEco Team*
