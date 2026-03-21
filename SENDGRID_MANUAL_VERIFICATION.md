# Manual SendGrid Sender Verification

## Problem
SendGrid sender `noreply@coneco.sendgrid.net` is not auto-verifying.

## Solution: Manual Verification Required

### Step 1: Access SendGrid Dashboard
1. Go to: https://app.sendgrid.com/
2. Login to your account
3. Navigate to: **Settings → Sender Authentication**

### Step 2: Find Your Sender
1. Look for `noreply@coneco.sendgrid.net` in the sender list
2. If it doesn't exist, click **"Create New Sender"** and add it:
   - **From Email**: `noreply@coneco.sendgrid.net`
   - **From Name**: `ConEco Support`
   - **Reply To**: `noreply@coneco.sendgrid.net`
   - **Company**: `ConEco`
   - Fill in address/phone (can be placeholder)

### Step 3: Manual Verification
1. Click on the sender `noreply@coneco.sendgrid.net`
2. Click **"Send Verification Email"**
3. **IMPORTANT**: Since this is a SendGrid subdomain, check your email for a verification link
4. **Find the verification email** from SendGrid (check spam folder too)
5. **Click the verification link** in the email
6. Return to SendGrid dashboard - the sender should now show ✓ **Verified**

### Step 4: Alternative - Use Your Gmail
If SendGrid verification is problematic, temporarily use your Gmail:

1. Change in `Backend/.env`:
   ```
   FROM_EMAIL="your_gmail@gmail.com"
   ```

2. Add and verify your Gmail in SendGrid:
   - Settings → Sender Authentication
   - Add `your_gmail@gmail.com` as sender
   - SendGrid will send verification to your Gmail
   - Click the link to verify

### Step 5: Test
Once verified, run:
```bash
cd "c:\Users\demas\Desktop\8th Sem\Internship\Vrishank Soft\Internship Project"
echo "your_email@gmail.com" | python Backend/test_email_send.py
```

## Expected Results
- **Before**: HTTP Error 403: Forbidden
- **After**: SUCCESS! Test email sent

## Troubleshooting
- **Can't find verification email?** Check spam/junk folder
- **Link expired?** Click "Send Verification Email" again
- **Still not working?** Try the Gmail alternative above

## Status Checklist
- [ ] Go to SendGrid Settings → Sender Authentication
- [ ] Find or add `noreply@coneco.sendgrid.net`
- [ ] Click "Send Verification Email"
- [ ] Check email for verification link
- [ ] Click verification link
- [ ] Confirm ✓ Verified status
- [ ] Test email sending