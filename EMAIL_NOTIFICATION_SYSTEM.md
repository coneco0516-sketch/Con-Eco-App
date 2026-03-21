# Email Notification System Documentation

## Overview

ConEco has implemented a comprehensive email notification system that sends timely notifications to all three user types (Admin, Vendor, Customer) via email. The system is powered by SendGrid and includes database tracking, user preference management, and security audit trails.

## Architecture

### Components

#### Backend (`email_service.py`)
- Central email sending service using SendGrid API
- Notification functions for different event types
- Database integration for preference management
- HTML email templates with professional styling

#### Database Tables

**notification_preferences**
- Stores user notification preferences
- One record per user with 6 toggleable notification categories
- Default preferences set during registration
- Updated via `/api/auth/notification-preferences` endpoint

**email_notifications**
- Audit trail of all sent notifications
- Tracks notification type, status, and metadata
- Indexed by user_id, notification_type, and sent_at
- Examples: login, password_change, order_confirmation, qc_status, etc.

**login_activity**
- Real-time login tracking with IP addresses
- Captures device/browser information via user-agent
- Indexed for fast lookups by user_id and date
- Security audit trail accessible to users

**users table** (additions)
- `email_verified` (BOOLEAN) - Email verification status
- `email_verification_token` (VARCHAR) - Unique verification token
- `email_verification_sent_at` (TIMESTAMP) - When verification was sent

### Frontend Components

**VerifyEmail.jsx** (`/verify-email?token=<token>`)
- Email verification confirmation page
- Animated success/error states
- Auto-redirect to login on success
- Token validation and expiration checks (24 hours)

**NotificationSettings.jsx** (`/notifications`)
- User preference management interface
- Two tabs:
  - **Email Preferences**: 6 notification categories with toggle switches
  - **Login Activity**: Recent login history with IP, device, and timestamps
- Responsive design with professional styling
- Real-time preference updates

## Notification Types

### 1. Login Notifications
**Trigger**: Successful user login  
**Recipients**: Admin, Vendor, Customer  
**Includes**:
- Login date & time
- IP address (location-based)
- Device/browser information
- Account type

**Preference**: `login_alerts`  
**Respects User Preference**: Yes (except for critical security logins)

### 2. Email Verification
**Trigger**: User registration  
**Recipients**: All new users  
**Includes**:
- Verification link (valid for 24 hours)
- Account activation instructions
- Fallback plain link

**Preference**: N/A (sent immediately)  
**Required**: Yes (blocks account activation)

### 3. Password Change Notifications
**Trigger**: User changes password  
**Recipients**: Admin, Vendor, Customer  
**Includes**:
- Timestamp of change
- Account security link
- Warning about unauthorized access

**Preference**: `password_change_alerts`  
**Respects User Preference**: Yes (security-critical)

### 4. Profile Update Notifications
**Trigger**: User modifies profile information  
**Recipients**: All users  
**Includes**:
- List of updated fields
- New values
- Timestamp

**Preference**: `profile_update_alerts`  
**Respects User Preference**: Yes

### 5. QC Verification Status Notifications
**Trigger**: Admin updates vendor QC status  
**Recipients**: Vendors only  
**Includes**:
- New verification status (Verified/Rejected/Pending)
- QC score (0-100)
- Admin feedback (if provided)
- Link to vendor dashboard

**Preference**: `qc_status_alerts`  
**Respects User Preference**: Yes  
**Critical Info**: Vendors notified that unverified vendors' products won't be visible

### 6. Product/Service Update Notifications
**Trigger**: Vendor adds/updates products or services  
**Recipients**: Vendors  
**Includes**:
- Product/service name
- Update type (added/modified/deleted)
- Action summary

**Preference**: `product_update_alerts`  
**Respects User Preference**: Yes

### 7. Order Confirmation Notifications
**Trigger**: Customer completes order  
**Recipients**: Customers  
**Includes**:
- Order ID
- Order date
- Total amount
- Items ordered
- Link to view order

**Preference**: `order_alerts`  
**Respects User Preference**: Yes

### 8. Order Status Update Notifications
**Trigger**: Order status changes (processing, shipped, delivered, cancelled)  
**Recipients**: Customers  
**Includes**:
- Order ID
- New status
- Tracking information (if available)
- Estimated delivery date

**Preference**: `order_alerts`  
**Respects User Preference**: Yes

## API Endpoints

### Authentication Routes (`/api/auth/`)

#### Email Verification
```
GET /verify-email?token=<token>
Response: {"status": "success"|"error", "message": "..."}
```

#### Resend Verification
```
POST /resend-verification
Requires: User authentication
Response: {"status": "success"|"error", "message": "..."}
```

### Notification Preferences (`/api/auth/`)

#### Get User Preferences
```
GET /notification-preferences
Response: {
  "status": "success",
  "preferences": {
    "login_alerts": true,
    "password_change_alerts": true,
    "profile_update_alerts": true,
    "product_update_alerts": true,
    "order_alerts": true,
    "qc_status_alerts": true
  }
}
```

#### Update Preferences
```
PUT /notification-preferences
Body: {
  "login_alerts": true|false,
  "password_change_alerts": true|false,
  "profile_update_alerts": true|false,
  "product_update_alerts": true|false,
  "order_alerts": true|false,
  "qc_status_alerts": true|false
}
Response: {"status": "success"|"error", "message": "..."}
```

#### Get Login Activity
```
GET /login-activity
Response: {
  "status": "success",
  "activities": [
    {
      "id": 1,
      "email": "user@example.com",
      "user_type": "vendor",
      "ip_address": "192.168.1.1",
      "user_agent": "Mozilla/5.0...",
      "device_info": "Web",
      "login_at": "2024-03-21T10:30:00Z"
    }
  ]
}
```

## Configuration

### Environment Variables

```
SENDGRID_API_KEY=<your-sendgrid-api-key>
FROM_EMAIL=noreply@coneco.com
APP_URL=https://con-eco-app-production.up.railway.app
```

### SendGrid Setup

1. Create account at sendgrid.com
2. Generate API key
3. Add to Railway environment variables
4. Add sender email to verified senders

### Database Setup

Run once to initialize:
```bash
python Backend/create_notification_schema.py
```

Creates:
- notification_preferences table
- email_notifications table
- login_activity table
- Columns on users table

## Features

### Security
- ✅ IP address tracking for login anomaly detection
- ✅ Device/browser fingerprinting
- ✅ Email verification for new accounts
- ✅ Secure tokens with 24-hour expiration
- ✅ Password change notifications
- ✅ Login activity audit trail

### User Control
- ✅ 6 notification categories users can toggle
- ✅ Dedicated NotificationSettings page
- ✅ Real-time preference updates
- ✅ View login activity with IP and device info
- ✅ Resend verification emails

### Notifications Respect Preferences
- All notifications check user preferences before sending
- Critical security notifications can override preferences
- Preferences stored per user
- Separate categories for different event types

### Professional Templates
- ✅ HTML emails with consistent styling
- ✅ Responsive design for mobile
- ✅ Color-coded status indicators
- ✅ Action buttons with CTAs
- ✅ Footer with branding and legal info

### Audit Trail
- All sent emails logged to `email_notifications` table
- Status tracking (sent, failed, bounced)
- Metadata stored as JSON
- Easy to create reports

## Email Templates

All emails include:
- Professional header with logo/branding
- Clear subject lines
- Color-coded status indicators
- Action buttons with CTAs
- Links to dashboard/management pages
- Security warnings where appropriate
- Footer with copyright and legal links
- Fallback plain text version

### Color Scheme
- Success/Verified: #2ecc71 (Green)
- Warning/Pending: #f39c12 (Orange)
- Error/Rejected: #e74c3c (Red)
- Primary/Info: #3498db (Blue)
- General: #667eea (Purple)

## Testing

### Test Email Verification
```bash
# 1. Register new user
POST /api/auth/register

# 2. Check database for verification_token
SELECT email_verification_token FROM Users WHERE email='test@example.com'

# 3. Visit verify endpoint
GET /verify-email?token=<token>

# 4. Should see success page and email_verified=true in DB
```

### Test Login Notification
```bash
# 1. Login with valid credentials
POST /api/auth/login

# 2. Check login_activity table
SELECT * FROM login_activity WHERE user_id=<user_id> ORDER BY login_at DESC

# 3. Email should be sent (if preferences allow)
```

### Test Preferences
```bash
# 1. Get current preferences
GET /api/auth/notification-preferences

# 2. Update preferences
PUT /api/auth/notification-preferences
Body: {"login_alerts": false}

# 3. Verify update
GET /api/auth/notification-preferences
```

## Frontend Integration

### Access Notification Settings
- Menu link: `/notifications`
- Mobile-responsive
- Requires authentication
- Two tabs for preferences and activity

### Email Verification
- Automatic redirect after registration
- User receives verification email
- Clicks link or visits `/verify-email?token=...`
- Confirms email and activates account

### Add Links to UI
- User profile menu → "Notification Settings"
- Account settings → "Email Preferences"
- Security section → "Login Activity"

## Troubleshooting

### Emails Not Sending
1. Check `SENDGRID_API_KEY` in Railway environment
2. Verify sender email is verified in SendGrid
3. Check `email_notifications` table for failed status
4. Review SendGrid activity log
5. Ensure user preferences allow the notification type

### Verification Email Not Received
1. Check spam/junk folder
2. Verify sender email is recognized
3. Check database for verification_token
4. Use resend-verification endpoint if expired

### Preferences Not Saving
1. Ensure user is authenticated
2. Check API response for errors
3. Verify notification_preferences table exists
4. Check database permissions

### Login Activity Not Showing
1. Check login_activity table has records
2. Ensure user_id matches authenticated user
3. Verify IP address is being captured
4. Check database query in endpoint

## Performance

### Optimization
- Asynchronous email sending (non-blocking)
- Database indexes on user_id, notification_type, dates
- Preference caching on first access
- Batch email sending for bulk notifications

### Scalability
- SendGrid handles email queue
- Database sharding ready
- Horizontal scaling support
- Minimal blocking operations

## Future Enhancements

- [ ] SMS notifications with Twilio
- [ ] Push notifications to mobile apps
- [ ] Email frequency preferences (daily digest vs instant)
- [ ] Notification center/bell icon in UI
- [ ] Unsubscribe links in emails
- [ ] Email template customization per role
- [ ] ABCs testing for email subject lines
- [ ] Notification scheduling (quiet hours)
- [ ] Multi-language email support
- [ ] Webhook integration for external events

## Related Documentation

- [QC Verification System](./QC_VERIFICATION_SYSTEM.md)
- [Authentication Flow](./AUTH_FLOWS.md)
- [Database Schema](./SCHEMA.md)
- [API Documentation](./API_DOCS.md)

## Support

For issues or questions about the email notification system, please contact the development team or check the logs in Railway.

---

**Last Updated**: March 21, 2026  
**Version**: 1.0  
**Status**: Production Ready
