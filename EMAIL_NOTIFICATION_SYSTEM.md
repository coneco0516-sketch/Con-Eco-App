# 📧 Email Notification System — ConEco

## Overview

ConEco has a comprehensive email notification system that sends timely notifications to all three user types (Admin, Vendor, Customer). The system is powered by **Brevo HTTP API** and includes database tracking, user preference management, and security audit trails.

---

## Architecture

### Backend — `email_service.py`
- Central email sending service using the **Brevo HTTP API** (not SMTP — avoids port blocking on Render)
- Notification functions for all event types
- Database integration for preference management
- HTML email templates with professional styling
- Non-blocking delivery via FastAPI `BackgroundTasks`

### Database Tables

**`notification_preferences`**
- Stores user notification preferences
- One record per user with 6 toggleable notification categories
- Default preferences set during registration
- Updated via `/api/auth/notification-preferences`

**`email_notifications`**
- Audit trail of all sent notifications
- Tracks notification type, status, and metadata
- Indexed by `user_id`, `notification_type`, `sent_at`

**`login_activity`**
- Real-time login tracking with IP addresses
- Captures device/browser information via user-agent
- Security audit trail accessible to users

**`users` table (additions)**
- `email_verified` — Email verification status
- `email_verification_token` — Unique verification token
- `email_verification_sent_at` — When verification was sent

---

## Frontend Components

**`VerifyEmail.jsx`** (`/verify-email?token=<token>`)
- Email verification confirmation page
- Animated success/error states
- Auto-redirect to login on success (3 seconds)
- Token validation and 24-hour expiration checks

**`NotificationSettings.jsx`** (`/notifications`)
- Two tabs:
  - **Email Preferences** — 6 notification categories with toggle switches
  - **Login Activity** — Recent login history with IP, device, timestamps
- Real-time preference updates

---

## Notification Types

### 1. Email Verification
**Trigger:** New user registers  
**Recipients:** All new users  
**Includes:** Verification link (valid 24 hrs), account activation instructions  
**Required:** Yes — blocks login until verified

### 2. Order Confirmation
**Trigger:** Customer places an order (COD or Pay Later)  
**Recipients:** Customer  
**Includes:** Order ID, date, total amount, items ordered  
**Preference:** `order_alerts`

### 3. New Order — Vendor Notification
**Trigger:** New order placed for a vendor's product/service  
**Recipients:** Vendor  
**Includes:** Item name, quantity, customer details, delivery address  
**Preference:** `order_alerts`

### 4. Order Status Update
**Trigger:** Vendor changes order status (Processing / Shipped / Delivered / Cancelled)  
**Recipients:** Customer  
**Includes:** Order ID, new status, tracking info  
**Preference:** `order_alerts`

### 5. QC Verification Status
**Trigger:** Admin updates vendor verification  
**Recipients:** Vendor only  
**Includes:** New status (Verified / Rejected / Pending), QC score, admin feedback  
**Preference:** `qc_status_alerts`

### 6. Password Change Alert
**Trigger:** User changes password  
**Recipients:** All users  
**Includes:** Timestamp, security warning, unauthorized access notice  
**Preference:** `password_change_alerts`

### 7. Login Notification
**Trigger:** Successful user login  
**Recipients:** All users  
**Includes:** Login date/time, IP address, device/browser info  
**Preference:** `login_alerts`

### 8. Profile Update Notification
**Trigger:** User modifies profile information  
**Recipients:** All users  
**Includes:** List of updated fields, timestamp  
**Preference:** `profile_update_alerts`

---

## API Endpoints

### Email Verification

```
GET  /api/auth/verify-email?token=<token>
POST /api/auth/resend-verification
```

### Notification Preferences

```
GET /api/auth/notification-preferences
→ {
    "login_alerts": true,
    "password_change_alerts": true,
    "profile_update_alerts": true,
    "product_update_alerts": true,
    "order_alerts": true,
    "qc_status_alerts": true
  }

PUT /api/auth/notification-preferences
Body: { "login_alerts": false, "order_alerts": true, ... }
```

### Login Activity

```
GET /api/auth/login-activity
→ {
    "activities": [
      {
        "email": "user@example.com",
        "user_type": "vendor",
        "ip_address": "192.168.1.1",
        "user_agent": "Mozilla/5.0...",
        "login_time": "2026-04-27T10:30:00Z"
      }
    ]
  }
```

---

## Configuration

### Environment Variables

```env
# Brevo (Email Platform)
BREVO_API_KEY=xkeysib-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
FROM_EMAIL=noreply@coneco.com
FROM_NAME=ConEco

# App URL (for email links)
APP_URL=https://coneco-backend.onrender.com
```

> See `BREVO_EMAIL_SETUP.md` for step-by-step Brevo account and API key setup.

### How Brevo Sending Works

```python
import requests

response = requests.post(
    "https://api.brevo.com/v3/smtp/email",
    headers={
        "api-key": BREVO_API_KEY,
        "Content-Type": "application/json"
    },
    json={
        "sender": {"name": "ConEco", "email": FROM_EMAIL},
        "to": [{"email": recipient, "name": name}],
        "subject": subject,
        "htmlContent": html_body
    }
)
```

### Database Setup

The notification tables are created automatically when `setup_neon.py` is run:

```bash
python setup_neon.py
```

Tables created:
- `notification_preferences`
- `email_notifications`
- `login_activity`

---

## Email Template Design

All emails include:
- Professional header with ConEco branding
- Clear subject lines
- Color-coded status indicators
- Action buttons with CTAs
- Footer with copyright and legal links

**Color Scheme:**
| Status | Color |
|---|---|
| Success / Verified | `#2ecc71` (Green) |
| Warning / Pending | `#f39c12` (Orange) |
| Error / Rejected | `#e74c3c` (Red) |
| Info / Primary | `#3498db` (Blue) |
| General | `#667eea` (Purple) |

---

## Security Features

- ✅ Email verification blocks login until confirmed
- ✅ 24-hour token expiration for verification links
- ✅ IP address tracking per login
- ✅ Device/browser fingerprinting via user-agent
- ✅ Password change notifications with unauthorized access warnings
- ✅ Full audit trail in `email_notifications` table
- ✅ Non-blocking async email delivery (no UI delay)

---

## User Preferences

Users can control all 6 notification categories from `/notifications`:

| Toggle | Controls |
|---|---|
| `login_alerts` | Login notifications |
| `password_change_alerts` | Password change emails |
| `profile_update_alerts` | Profile update emails |
| `product_update_alerts` | Product/service update alerts |
| `order_alerts` | Order confirmation & status updates |
| `qc_status_alerts` | QC verification updates (vendors) |

> **Note:** Email verification emails are always sent regardless of preferences.

---

## Troubleshooting

### Emails not sending
1. Check `BREVO_API_KEY` is set in Render environment variables
2. Verify `FROM_EMAIL` is a verified sender in Brevo → Senders & IP
3. Check Brevo Dashboard → Transactional → Email Logs for errors
4. Check `email_notifications` table for `failed` status entries

### Verification email not received
1. Check spam/junk folder
2. Verify `FROM_EMAIL` is a recognized sender in Brevo
3. Query DB: `SELECT email_verification_token FROM users WHERE email='...'`
4. Use `POST /resend-verification` if token expired

### Preferences not saving
1. Ensure user is authenticated (valid session cookie)
2. Check API response for error details
3. Verify `notification_preferences` table exists in Neon

### Login activity not showing
1. Check `login_activity` table has records for the user
2. Verify `user_id` matches authenticated user's ID

---

## Performance

- **Non-blocking:** All emails sent via FastAPI `BackgroundTasks` — zero impact on API response time
- **Async-safe:** Brevo HTTP API calls are isolated from main request flow
- **Indexed:** `user_id` and `sent_at` indexed for fast preference lookups
- **Reliable:** Brevo handles delivery queuing and retries

---

## Future Enhancements

- [ ] SMS notifications for critical order events
- [ ] Push notifications (web + mobile)
- [ ] Notification bell icon in navbar (in-app notifications)
- [ ] Daily digest option instead of instant emails
- [ ] Unsubscribe link in every email footer
- [ ] Multi-language email templates
- [ ] Notification scheduling (quiet hours setting)

---

## Related Documentation

- [`BREVO_EMAIL_SETUP.md`](./BREVO_EMAIL_SETUP.md) — Brevo account setup & API key guide
- [`RENDER_DEPLOYMENT.md`](./RENDER_DEPLOYMENT.md) — Render deployment guide
- [`NEON_DATABASE.md`](./NEON_DATABASE.md) — Neon PostgreSQL setup

---

**Last Updated:** April 2026  
**Platform:** Brevo HTTP API (replacing SendGrid)  
**Hosting:** Render + Neon  
**Status:** Production Ready
