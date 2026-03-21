# SendGrid Sender Email Verification Guide

## Problem
Even with SendGrid subdomain, you need to verify the sender email in SendGrid dashboard.

## Solution: Add & Verify Sender Email

### Step 1: Go to SendGrid Dashboard
1. Login to: https://app.sendgrid.com/
2. Navigate to: **Settings → Sender Authentication**

### Step 2: Add Single Sender
1. Click **"Create New Sender"** (or **"Verify a Single Sender"**)
2. Fill in the details:
   - **From Email**: `noreply@coneco.sendgrid.net`
   - **From Name**: `ConEco Support`
   - **Reply To**: `noreply@coneco.sendgrid.net`
   - **Company/Organization**: `ConEco`
   - **Address**: Your address (can be placeholder)
   - **City/State/Country**: Your location
   - **Phone**: Your phone (optional)

### Step 3: Verify Email
1. SendGrid will send a verification email to `noreply@coneco.sendgrid.net`
2. **IMPORTANT**: Since this is a SendGrid subdomain, the email goes to SendGrid's system
3. Go back to **Settings → Sender Authentication**
4. Find the sender and click **"Send Verification Email"**
5. SendGrid will automatically verify it (no manual email needed)

### Step 4: Test
Once verified (shows ✓), run:
```bash
cd "c:\Users\demas\Desktop\8th Sem\Internship\Vrishank Soft\Internship Project"
echo "your_email@gmail.com" | python Backend/test_email_send.py
```

## Expected Result
- **Before**: HTTP Error 403: Forbidden
- **After**: SUCCESS! Test email sent

## Alternative: Use Gmail for Testing
If SendGrid verification is taking too long, you can temporarily use:
```
FROM_EMAIL="your_gmail@gmail.com"
```
But you'll need to verify that Gmail address in SendGrid first.

## Status
- [ ] Add sender email in SendGrid dashboard
- [ ] Verify sender email
- [ ] Test email sending
- [ ] Deploy to Railway with updated FROM_EMAIL