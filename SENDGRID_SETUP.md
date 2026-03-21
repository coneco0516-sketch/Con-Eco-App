# 🚀 SendGrid Email Setup Guide - 5 Minutes to Live Emails

## ⚡ Quick Start (Copy-Paste Steps)

### Step 1: Create SendGrid Account (Free!)
```
1. Go to https://sendgrid.com
2. Click "Create Account" or "Sign Up Free"
3. Fill in your details:
   - Name: Your name
   - Email: Your email (will receive confirmation)
   - Password: Create a strong password
   - Company: ConEco
4. Check verification email and confirm
```

### Step 2: Get API Key
```
After login:
1. Click Profile Icon (top right) → Settings
2. Scroll down and click "API Keys"
3. Click "Create API Key" button
4. Name: "ConEco Backend" (or any name)
5. Permissions: Select "Full Access" (for simplicity)
6. Click "Create & Copy"
7. COPY THE KEY IMMEDIATELY (you won't see it again!)
```

### Step 3: Add to Backend .env
```
Open: Backend/.env

Find this line:
SENDGRID_API_KEY="SG.test-key-placeholder"

Replace with:
SENDGRID_API_KEY="SG.your_actual_api_key_from_step_2"

Save the file!
```

### Step 4: Verify Sender Email
```
In SendGrid Dashboard:
1. Click "Sender Authentication" (left sidebar)
2. Click "Verify a Single Sender"
3. Fill in:
   - From Email: noreply@coneco.com
   - From Name: ConEco
   - Reply-to Email: support@coneco.com
4. Click "Create"
5. Check your email box for SendGrid verification
6. Click verification link
```

### Step 5: Test It!
```
1. Run Backend: python Backend/main.py
2. Go to http://localhost:8000/register
3. Create test account with: test+time@gmail.com
4. Should get verification email!
5. Check spam folder if not in inbox
```

---

## 🔍 Troubleshooting

### Issue: "Email not received"

**Check 1: Is API key correct?**
```python
# Open Backend/email_service.py
# Line 14 should load from .env:
SENDGRID_API_KEY = os.environ.get("SENDGRID_API_KEY")

# Check Backend/.env has:
SENDGRID_API_KEY="SG.xxxx..."
```

**Check 2: Is sender email verified?**
```
SendGrid Dashboard → Sender Authentication
Should show: ✓ Verified (noreply@coneco.com)
If not → follow Step 4 above
```

**Check 3: Check the logs**
```
# Terminal running Backend should show:
Email sent to test@example.com. Status: 202

# 202 = SUCCESS! ✅
# Check spam/promotions folder in Gmail
```

**Check 4: Free tier limit**
```
SendGrid Free = 100 emails/day
If you hit limit, wait until next day or upgrade plan
```

---

## 📊 Email Sending Flow

When user registers with email `test@gmail.com`:

```
1. User fills register form
   ↓
2. Backend receives POST /register
   ↓
3. Backend creates user in database
   ↓
4. Backend generates verification token (random string)
   ↓
5. Backend calls: send_email_verification(email, name, token)
   ↓
6. send_email_verification() calls: send_email()
   ↓
7. send_email() checks:
   - Is SENDGRID_API_KEY set? ✓
   - Is it valid? ✓ (API will validate)
   ↓
8. SendGrid API:
   - Accepts request (Status: 202)
   - Queues email
   - Sends within seconds
   ↓
9. User gets email with verification link
   ↓
10. User clicks link → email verified ✓
```

---

## 🔑 Environment Variables Explained

### SENDGRID_API_KEY
- **What**: Your unique SendGrid authentication token
- **Where**: Backend/.env (line with `SENDGRID_API_KEY=`)
- **Format**: `SG.xxxxxxxxxxxxxxxxxxxxx`
- **Why needed**: Tells SendGrid this is you sending emails
- **Get it**: https://app.sendgrid.com/settings/api_keys

### FROM_EMAIL
- **What**: The email address shown as sender
- **Default**: noreply@coneco.com
- **Must be**: Verified in SendGrid (Step 4 above)
- **Change if needed**: Backend/.env line with `FROM_EMAIL=`

### APP_URL
- **What**: Base URL for email links (verify-email?token=xxx)
- **Local dev**: http://localhost:8000
- **Production**: https://con-eco-app-production.up.railway.app
- **Current**: Backend/.env has `http://localhost:8000`

---

## 📧 What Emails Are Sent

When configured, these emails go out automatically:

1. **Registration Verification**
   - Trigger: User clicks "Create Account"
   - Content: Verification link + instructions
   - Recipients: Anyone registering

2. **Login Notification**
   - Trigger: User logs in
   - Content: New login alert + IP + device
   - Recipients: Users who enabled in preferences

3. **Password Change Alert**
   - Trigger: User changes password
   - Content: Confirmation that password was changed
   - Recipients: Users who enabled

4. **Profile Update Notification**
   - Trigger: User updates profile
   - Content: Confirmation of changes
   - Recipients: Users who enabled

5. **Order Confirmation**
   - Trigger: Customer completes order
   - Content: Order details + tracking
   - Recipients: Customer (always sent)

6. **QC Status Update**
   - Trigger: Admin updates vendor QC status
   - Content: Verification status + score
   - Recipients: Vendor (vendors only)

---

## ✅ Verification Checklist

After setup, confirm:

- [ ] SendGrid account created (free)
- [ ] API key copied
- [ ] API key pasted into Backend/.env
- [ ] Sender email verified in SendGrid
- [ ] Backend running: `python Backend/main.py`
- [ ] Tested registration with test email
- [ ] Verification email received (check spam)
- [ ] Can click verification link
- [ ] Email verified successfully
- [ ] Can login with verified email

---

## 🎯 Expected Status Codes

When email is sent, Backend should log:

```
Email sent to user@example.com. Status: 202
```

Meanings:
- **200/201/202**: ✅ SUCCESS (email queued)
- **401**: ❌ API key invalid
- **403**: ❌ Sender email not verified
- **400**: ❌ Bad request (check email format)
- **429**: ❌ Rate limited (hit free tier limit)

---

## 🚨 Common Issues & Fixes

### "SENDGRID_API_KEY not set"
**Fix**: Check Backend/.env has `SENDGRID_API_KEY=SG.xxx`
```python
# Backend/email_service.py line 14:
if not SENDGRID_API_KEY:
    print(f"WARNING: SENDGRID_API_KEY not set.")
```

### "403 Forbidden"
**Fix**: Sender email not verified in SendGrid
- Go to SendGrid Dashboard
- Click "Sender Authentication"
- Verify noreply@coneco.com

### "401 Unauthorized"
**Fix**: Invalid API key
- Go to SendGrid dashboard
- Get a NEW API key
- Paste into Backend/.env

### "Email goes to spam"
**Fix**: SendGrid free tier emails often in spam
- Check spam/promotions folder
- Upgrade to paid plan for better deliverability
- Add SPF records (see SendGrid docs)

---

## 📱 Testing Email Verification Flow

### Test 1: Basic Registration
```
1. Go to /register
2. Fill: name, email, phone, password, role
3. Click "Create Account"
4. You should see: "Verify Email Sent" page
5. Check email for verification link
6. Click link
7. See: "Email Verified! ✓"
8. Auto-redirects to /login
9. Login with email
10. Success! ✅
```

### Test 2: Resend Verification
```
1. On /verify-email-sent page
2. Click "Resend Verification Email"
3. Should see: "Email sent" message
4. Check email again
5. Click new verification link
6. Should work ✅
```

### Test 3: Multiple Users
```
1. Register user 1: user1@gmail.com
2. Register user 2: user2@gmail.com
3. Both should get emails
4. Both should be able to verify
5. Both should be able to login
6. Success! ✅
```

---

## 🔐 Security Notes

- ✅ API key is `SECRET` - never commit to Git
- ✅ Verification tokens expire after 24 hours
- ✅ Tokens are random + secure
- ✅ Emails logged in database for audit trail
- ✅ Password hashed with bcrypt
- ✅ Session cookies are HttpOnly

---

## 📞 SendGrid Account Info

**Free Tier:**
- 100 emails/day
- Perfect for development + testing
- 30 days free trial also available

**Upgrade when:**
- You exceed 100/day (usually never for internal)
- You deploy to production with real users

**Links:**
- Sign up: https://sendgrid.com
- Dashboard: https://app.sendgrid.com
- API keys: https://app.sendgrid.com/settings/api_keys
- Sender auth: https://app.sendgrid.com/settings/sender_auth/senders

---

## 🎊 Success Indicators

After setup, you should see:

1. **In Backend logs**:
   ```
   Email sent to test@gmail.com. Status: 202
   ```

2. **In user's email**:
   - Sender: noreply@coneco.com
   - Subject: "ConEco - Verify Your Email"
   - Green "Verify Email" button
   - 24-hour expiration notice

3. **In database**:
   - Users.email_verified = FALSE (before clicking)
   - Users.email_verified = TRUE (after clicking)

4. **Frontend workflow**:
   - Register → See "Verify Email Sent"
   - Click link → See "Email Verified ✓"
   - Auto-redirects → Login page
   - Login works ✓

---

## ✨ You're Done!

All emails configured and working! Users can now:
- Register with email verification
- Get login notifications  
- Receive order confirmations
- See notification preferences
- Track login activity

**Happy emailing!** 🚀📧

---

*For production (Railway), follow the same steps - add SENDGRID_API_KEY to Railway environment variables.*
