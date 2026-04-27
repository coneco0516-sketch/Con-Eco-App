# 📧 Brevo Email Setup Guide — ConEco

ConEco uses **[Brevo](https://brevo.com)** (formerly Sendinblue) as its transactional email platform for sending verification emails, order notifications, and security alerts.

---

## 📋 Why Brevo?

| Feature | Detail |
|---|---|
| **Free Tier** | 300 emails/day, unlimited contacts |
| **HTTP API** | Works on Render (no SMTP port blocking issues) |
| **Deliverability** | High inbox rates with domain authentication |
| **Templates** | Built-in email template builder |
| **Logs** | Full delivery tracking and logs |

---

## 🚀 1. Create a Brevo Account

1. Go to [https://app.brevo.com/account/register](https://app.brevo.com/account/register)
2. Sign up with your email
3. Complete email verification
4. Choose the **Free Plan**

---

## 🔑 2. Generate an API Key

1. In Brevo Dashboard → click your **Profile (top right)**
2. Go to **SMTP & API → API Keys**
3. Click **Generate a New API Key**
4. Name: `ConEco Production`
5. Copy the key — it looks like:
   ```
   xkeysib-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-xxxxxxxx
   ```

> ⚠️ **Save this key immediately** — Brevo only shows it once.

---

## ✅ 3. Verify Your Sender Email

Before sending emails, you must verify the sender address:

1. Go to **Senders & IP → Senders**
2. Click **Add a Sender**
3. Fill in:
   - **From Name:** `ConEco`
   - **From Email:** `noreply@coneco.com` (or your domain email)
4. Brevo sends a verification email — click the link to confirm

> **No custom domain?** Use a Gmail address like `coneco0516@gmail.com` and verify it the same way.

---

## ⚙️ 4. Set Environment Variables

Add to `Backend/.env` and your Render environment:

```env
BREVO_API_KEY=xkeysib-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-xxxxxxxx
FROM_EMAIL=noreply@coneco.com
FROM_NAME=ConEco
```

---

## 📨 5. Email Events in ConEco

Brevo sends the following transactional emails:

| Event | Trigger | Recipient |
|---|---|---|
| **Email Verification** | New user registers | Customer / Vendor |
| **Welcome Email** | After email verified | Customer / Vendor |
| **Order Confirmation** | Order placed | Customer |
| **Vendor Notification** | New order received | Vendor |
| **Order Status Update** | Vendor changes order status | Customer |
| **Password Reset** | User requests reset | Customer / Vendor |
| **Login Alert** | Login from new device (optional) | Customer / Vendor |
| **QC Status Update** | Admin verifies vendor | Vendor |

---

## 🔁 6. How It Works in the Code

ConEco's `email_service.py` uses the **Brevo HTTP API** (not SMTP) for reliability on Render:

```python
import requests

headers = {
    "api-key": os.environ.get("BREVO_API_KEY"),
    "Content-Type": "application/json"
}

payload = {
    "sender": {"name": "ConEco", "email": "noreply@coneco.com"},
    "to": [{"email": recipient_email, "name": recipient_name}],
    "subject": "Your Subject Here",
    "htmlContent": "<h1>Email Body</h1>"
}

response = requests.post(
    "https://api.brevo.com/v3/smtp/email",
    headers=headers,
    json=payload
)
```

---

## 🛡️ 7. Optional: Domain Authentication (SPF/DKIM)

For higher deliverability if you have a custom domain:

1. Brevo Dashboard → **Senders & IP → Domains**
2. Click **Add a Domain**
3. Enter your domain (e.g., `coneco.com`)
4. Add the DNS records Brevo provides to your domain registrar
5. Click **Authenticate**

This prevents emails from landing in spam.

---

## 📊 8. Monitor Email Logs

View sent emails and delivery status:

1. Brevo Dashboard → **Transactional → Email Logs**
2. Filter by date, status (Delivered / Bounced / Spam)
3. Check for failed deliveries

---

## ⚠️ Free Tier Limits

| Limit | Value |
|---|---|
| Emails per day | 300 |
| Emails per month | 9,000 |
| Contacts | Unlimited |
| API requests | Unlimited |
| Email logs retention | 30 days |

**For production with more volume:** Upgrade to **Starter (€19/month)** for 20,000 emails/month.

---

## 🛠 Troubleshooting

### `401 Unauthorized`
Your `BREVO_API_KEY` is incorrect or not set. Double-check the environment variable.

### `Sender not verified`
Go to Brevo → Senders & IP → Senders and verify the `FROM_EMAIL` address.

### Emails going to spam
- Complete domain authentication (SPF/DKIM)
- Avoid spam trigger words in subject lines
- Ensure `FROM_EMAIL` is a verified sender

### `400 Bad Request`
Check that the `to` field has a valid email address and the `htmlContent` is not empty.

### Rate limit hit (300/day)
Upgrade your Brevo plan or spread email sends across time.

---

## 🔗 Quick Links

- Brevo Dashboard: [https://app.brevo.com](https://app.brevo.com)
- API Docs: [https://developers.brevo.com](https://developers.brevo.com)
- Email Logs: [https://app.brevo.com/transactional/email/logs](https://app.brevo.com/transactional/email/logs)
- API Keys: [https://app.brevo.com/settings/keys/api](https://app.brevo.com/settings/keys/api)

---

*Last updated: April 2026 | ConEco Team*
