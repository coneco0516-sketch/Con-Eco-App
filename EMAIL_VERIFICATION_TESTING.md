# Email Verification Flow - Testing Guide

## Implementation Complete ✅
**Date**: March 21, 2026  
**Status**: Ready for production testing on Railway

---

## Complete Email Verification Flow

### 1. Registration → Verification Email
```
USER REGISTERS
    ↓
Backend sends email with token
    ↓
User sees "Verify Email Sent" page (/verify-email-sent)
    ↓
User clicks link in email
    ↓
Email verified in database
    ↓
Can now login
```

### 2. Complete User Journey

#### Step 1: User Registration
- Navigate to `/register`
- Fill in details (name, email, phone, password, role)
- Click "Create Account"
- **Backend Action**: Creates user record with `email_verified = FALSE`
- **Backend Action**: Generates `email_verification_token` (unique, 24hr expiry)
- **Backend Action**: Sends email via SendGrid
- **Frontend**: Redirects to `/verify-email-sent`

#### Step 2: Verification Email Sent Page
- User sees email address confirmation
- Instructions to check inbox for verification link
- Shows 24-hour expiration warning
- Can resend email if not received
- Link redirects to login page

#### Step 3: Email Click & Verification
- User clicks link in email: `https://[domain]/verify-email?token=[TOKEN]`
- Loads `/verify-email` page
- **Backend Action**: Validates token and checks 24-hour expiry
- **Backend Action**: Sets `email_verified = TRUE` and clears token
- **Frontend**: Shows success message with countdown
- **Frontend**: Auto-redirects to `/login` after 3 seconds

#### Step 4: Login with Email Check
- User navigates to `/login`
- Enters credentials
- **Backend Action**: Verifies password
- **Backend Action**: NEW: Checks if `email_verified = TRUE`
  - If FALSE: Returns error "Please verify your email before logging in"
  - If TRUE: Proceeds with login
- User successfully logged in

---

## Testing Checklist

### ✅ Frontend Components Ready
- [x] **Register.jsx** - Form with all fields
- [x] **VerifyEmailSent.jsx** - Post-registration confirmation page
  - Displays email address confirmation
  - Resend email button
  - Go to login button
- [x] **VerifyEmail.jsx** - Email verification with token
  - Shows loading spinner
  - Shows success with checkmark
  - Shows error with X mark
  - Auto-redirects to login
- [x] **Login.jsx** - Updated with email verification check
- [x] **NotificationSettings.jsx** - Email preferences + login activity

### ✅ Backend Endpoints Ready
- [x] `POST /api/auth/register` - Creates user with verification token
- [x] `GET /api/auth/verify-email?token=<token>` - Marks email as verified
- [x] `POST /api/auth/resend-verification` - Resends verification email
- [x] `POST /api/auth/login` - Enhanced with email verification check
- [x] `GET /api/auth/notification-preferences` - Fetch user preferences
- [x] `PUT /api/auth/notification-preferences` - Update preferences
- [x] `GET /api/auth/login-activity` - View login history

### ✅ Database Tables
- [x] Users table - Added email_verified, email_verification_token, email_verification_sent_at
- [x] notification_preferences - Email preference toggles (6 categories)
- [x] email_notifications - Audit trail of emails sent
- [x] login_activity - IP address, device, timestamp logging

### ✅ Email Templates
- [x] Verification email with token link
- [x] Password change alert
- [x] Login notification with IP/device
- [x] Profile update confirmation
- [x] QC status updates (for vendors)
- [x] Order confirmations

---

## How to Test on Railway

### Test Scenario 1: Complete Registration & Verification
1. Go to `https://[railway-domain]/register`
2. Fill form with:
   - Name: Test User
   - Email: `test+[timestamp]@gmail.com` (or any real email)
   - Phone: 1234567890
   - Password: Test123!
   - Role: Customer
3. Click "Create Account"
4. ✅ Should see "Verify Email Sent" page with email address
5. Check email inbox for verification link
6. Click link in email
7. ✅ Should see success "Email Verified!"
8. ✅ Auto-redirects to login in 3 seconds
9. Go to `/login`
10. Enter email and password from step 2
11. ✅ Should successfully login and see dashboard

### Test Scenario 2: Resend Verification Email
1. After registration, on `/verify-email-sent` page
2. Don't click original verification link
3. Click "Resend Verification Email" button
4. ✅ Should see success message
5. Check email - should receive NEW verification link
6. Click NEW link
7. ✅ Email verification should work with new token

### Test Scenario 3: Expired Token
1. Register user but wait 25+ hours
2. Try to click original verification link
3. ✅ Should see error "Verification token has expired"
4. Can resend verification from `/verify-email-sent` page

### Test Scenario 4: Login Without Verification
1. Register user but DON'T click verification link
2. Go to `/login`
3. Enter correct email and password
4. ✅ Should see error "Please verify your email before logging in"
5. Cannot login until email is verified

### Test Scenario 5: Notification Settings
1. Login as verified user
2. Go to `/notifications`
3. Tab 1 - "Email Preferences"
   - ✅ Should see 6 toggle switches
   - ✅ Should see email address
   - Toggle a setting and click "Save Preferences"
   - ✅ Should see success message
4. Tab 2 - "Login Activity"
   - ✅ Should see table with login history
   - IP address, device, timestamp visible

---

## Backend Configuration on Railway

### Environment Variables Required
```
SENDGRID_API_KEY=your-sendgrid-key
FROM_EMAIL=noreply@coneco.com
APP_URL=https://con-eco-app-production.up.railway.app
```

### Key Implementation Files
- `Backend/email_service.py` - SendGrid integration
- `Backend/routers/auth.py` - All auth endpoints including email verification
- `Backend/database.py` - Connection management
- `Frontend/src/pages/VerifyEmail.jsx` - Email verification UI
- `Frontend/src/pages/VerifyEmailSent.jsx` - Verification sent confirmation
- `Frontend/src/pages/NotificationSettings.jsx` - Preferences management

---

## Troubleshooting

### Issue: Verification link returns 404
- Check: Is APP_URL set correctly in Railway environment variables?
- Solution: Set to `https://con-eco-app-production.up.railway.app` or actual domain

### Issue: Email not received
- Check: Is SENDGRID_API_KEY valid?
- Check: Is FROM_EMAIL verified in SendGrid account?
- Check: Is user email in SendGrid recipient list?
- Solution: Check Rails logs for SendGrid API errors

### Issue: Login button doesn't work after verification
- Check: Is email_verified field set to TRUE in database?
- Solution: Manually verify in database: `UPDATE Users SET email_verified=TRUE WHERE user_id=X`

### Issue: Can't verify email (token shows invalid)
- Check: Did you click the FULL link with complete token?
- Solution: Copy entire link from email, including all query parameters
- Check: Is token still valid (within 24 hours)?
- Solution: Resend verification email if expired

---

## Security Features

✅ **Tokens**: 32-character URL-safe tokens (cryptographically secure)
✅ **Expiration**: 24-hour token validity
✅ **Hash**: Passwords hashed with bcrypt
✅ **Cookies**: HttpOnly, Secure, SameSite=Lax
✅ **CORS**: Configured for Railway domain
✅ **Audit Trail**: All emails logged in database
✅ **Login Tracking**: IP address and device info captured

---

## API Response Examples

### Register Success (Email Sent)
```json
{
  "status": "success",
  "message": "Registration successful. Please check your email to verify your account."
}
```

### Verify Email Success
```json
{
  "status": "success",
  "message": "Email verified successfully. You can now login."
}
```

### Login Without Verification
```json
{
  "status": "error",
  "message": "Please verify your email before logging in.",
  "pending_verification": true,
  "email": "user@example.com"
}
```

### Get Notification Preferences
```json
{
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

---

## Deployment Notes

### Latest Commit (77ffcef)
- Built frontend with Vite
- All routes integrated in App.jsx
- Email verification components ready
- Backend endpoints verified working
- Pushed to GitHub - Railway auto-deploying

### Next Steps
1. Wait for Railway deployment to complete
2. Run test scenarios above
3. Verify SendGrid emails are being sent
4. Monitor database for verification records
5. Test with multiple user roles (Customer, Vendor, Admin)

---

## Frontend Build Info
```
✓ 68 modules transformed
✓ index.html (0.46 kB)
✓ CSS (14.35 kB)
✓ JS (328.66 kB)
✓ Gzip optimized
✓ Built in 194ms
```

Frontend is production-ready and served from `Backend/main.py` catch-all route.
