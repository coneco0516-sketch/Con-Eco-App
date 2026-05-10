# Multi-Tier Admin Roles Implementation Plan

Divide the single 'Admin' module into three distinct roles: **Super Admin**, **Admin**, and **Employee**. Each role will have a specific dashboard view and restricted permissions based on their responsibilities.

## Role Definitions

### 1. Super Admin (Platform Owner)
- **Primary Goal**: Full platform control and financial oversight.
- **Permissions**:
    - Manage Platform Settings (Commissions, Maintenance Mode).
    - Manage Admin & Employee accounts.
    - Financial oversight (Total revenue, platform profits).
    - Approve/Reject Vendor Payouts.
    - Full access to all modules (Vendors, Customers, Orders, Payments, etc.).

### 2. Admin (Management)
- **Primary Goal**: Day-to-day business operations and vendor management.
- **Permissions**:
    - Vendor & Customer Verification.
    - View and manage Orders and Payments.
    - View commission reports.
    - Bulk price updates.
    - Handle complex Contact Message replies.
    - *Restricted*: Cannot change platform settings or manage other admins.

### 3. Employee (Operations)
- **Primary Goal**: Order processing and customer support.
- **Permissions**:
    - Update Order statuses and QC scores.
    - View (but not verify) Vendor/Customer details.
    - Read and reply to Contact Messages.
    - *Restricted*: No access to financial data (revenue, payouts, commissions), platform settings, or bulk pricing.

## Proposed Changes

### Database

#### [MODIFY] `users` table constraint
Update the `role` check constraint to include the new roles.
```sql
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('Super Admin', 'Admin', 'Employee', 'Customer', 'Vendor'));
```

### Backend (Python/FastAPI)

#### [MODIFY] [admin.py](file:///c:/Users/demas/Desktop/8th%20Sem/Internship/Vrishank%20Soft/Internship%20Project/Backend/routers/admin.py)
- Refactor `check_admin` to `check_admin_base` (allows Super Admin, Admin, Employee).
- Create specific decorators:
    - `require_super_admin`: Only Super Admin.
    - `require_admin_level`: Super Admin and Admin.
    - `require_employee_level`: All three roles.
- Apply these decorators to existing endpoints.
- **NEW ENDPOINT**: `POST /admin/manage_staff` for Super Admin to create Admin/Employee accounts.

#### [MODIFY] [auth.py](file:///c:/Users/demas/Desktop/8th%20Sem/Internship/Vrishank%20Soft/Internship%20Project/Backend/routers/auth.py)
- Ensure `get_profile` and `login` correctly handle the new roles.

### Frontend (React/Vite)

#### [MODIFY] [AdminDashboard.jsx](file:///c:/Users/demas/Desktop/8th%20Sem/Internship/Vrishank%20Soft/Internship%20Project/Frontend/src/pages/AdminDashboard.jsx)
- Update state to track the specific role from the user profile.
- Conditionally render stats cards and sidebar links.
- Create a "Staff Management" tab for Super Admins.

#### [MODIFY] [App.jsx](file:///c:/Users/demas/Desktop/8th%20Sem/Internship/Vrishank%20Soft/Internship%20Project/Frontend/src/App.jsx)
- Update route guards to handle multi-role admin access.

## Verification Plan

### Automated Tests
- Test login with each of the three roles.
- Verify that an Employee cannot access `/platform_settings` (403 Forbidden).
- Verify that an Admin cannot access `/payouts/approve`.

### Manual Verification
- Log in as Super Admin: Verify all tabs (Settings, Staff, Financials) are visible.
- Log in as Admin: Verify "Settings" and "Staff" are hidden, but "Vendors" and "Orders" are visible.
- Log in as Employee: Verify only "Orders" and "Messages" are functional; Financial stats are hidden.
