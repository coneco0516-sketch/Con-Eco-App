# 🛠️ Referral Program — Update Features Plan

> **Type:** Feature Implementation Plan  
> **Project:** Con-Eco B2B Marketplace  
> **Based on:** REFERRAL_PROGRAM_PLAN.md (codebase audit)  
> **Last Updated:** July 2026

---

## Overview

Three missing features need to be built to make the Referral Program fully functional. They are ordered by priority — **Step 1 must be done first** as it closes the biggest gap.

---

## Feature 1 — Referral Code Input in Register Page ✅ [IMPLEMENTED]

### Problem
Currently, referral code is **only captured via URL** (`?ref=XXXXXXXX`). If a user shares just the **code** via WhatsApp text or word-of-mouth, the referral is **completely lost** — there is no input box on the register page to manually enter it.

### What to Build
An **optional referral code input field** on the Register page that:
- Auto-fills from `?ref=` URL param if present
- Is manually editable if user has a code but no link
- Passes the code to the backend registration endpoint
- Backend links the new user to the referrer via `referred_by_user_id`

---

### Files to Modify

#### [MODIFY] `Frontend/src/pages/Register.jsx`

```jsx
// Read ?ref= param on page load:
const searchParams = new URLSearchParams(window.location.search);
const refFromUrl = searchParams.get('ref') || '';

// State:
const [referralCode, setReferralCode] = useState(refFromUrl);

// Add this input in the form (below password field):
<div className="form-group">
  <label>
    Referral Code
    <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
      (optional)
    </span>
  </label>
  <input
    type="text"
    placeholder="Enter referral code e.g. AB3KX9QZ"
    value={referralCode}
    onChange={e => setReferralCode(e.target.value.toUpperCase().trim())}
    maxLength={8}
    style={{ fontFamily: 'monospace', letterSpacing: '2px' }}
  />
</div>

// In the submit payload, add:
referral_code: referralCode || null
```

---

#### [MODIFY] `Backend/routers/auth.py`

```python
# In RegisterRequest model, add:
referral_code: Optional[str] = None

# After creating the new user, add:
if data.referral_code:
    cursor.execute(
        "SELECT user_id FROM users WHERE referral_code = %s AND user_id != %s",
        (data.referral_code.upper(), new_user_id)
    )
    referrer = cursor.fetchone()
    if referrer:
        cursor.execute(
            "UPDATE users SET referred_by_user_id = %s WHERE user_id = %s",
            (referrer["user_id"], new_user_id)
        )
        conn.commit()
```

---

### Acceptance Criteria
- [ ] `/register?ref=AB3KX9QZ` pre-fills the referral code field
- [ ] User can manually type a code without a URL param
- [ ] Invalid/wrong codes are silently ignored — registration still succeeds
- [ ] Valid code → new user's `referred_by_user_id` is set in DB
- [ ] Referrer's count increments after new user verifies email

---

## Feature 2 — In-App Notification on Milestone Achieved 🟡 IMPORTANT

### Problem
Users have no way of knowing they've hit a milestone unless they manually visit `/referral`. There is no alert or notification badge anywhere in the app.

### What to Build
When `check_and_award_milestones()` detects a new milestone, also insert a **notification** into the existing notifications table so the user sees a badge/alert inside the app.

---

### Files to Modify

#### [MODIFY] `Backend/routers/referrals.py`

Inside `check_and_award_milestones()`, after the milestone INSERT:

```python
# After inserting the milestone row, add:
cursor.execute("""
    INSERT INTO notifications (user_id, title, message, type, is_read)
    VALUES (%s, %s, %s, 'referral_milestone', FALSE)
""", (
    referrer_id,
    f"🎉 Referral Milestone — Tier {tier} Achieved!",
    f"You've unlocked Tier {tier} in the Referral Loyalty Program! "
    f"Our team will reach out to you soon with your surprise prize. "
    f"Keep referring to unlock higher tiers!"
))
conn.commit()
```

> **Note:** Verify exact column names in your `notifications` table by checking `create_notification_schema.py` before writing this query.

---

### Acceptance Criteria
- [ ] Hitting a milestone threshold triggers a new notification for the user
- [ ] Notification title: "🎉 Referral Milestone — Tier X Achieved!"
- [ ] Notification is `is_read = FALSE` on creation
- [ ] Appears in the existing notification bell/list in the app
- [ ] Does NOT duplicate — UNIQUE constraint on milestone prevents re-triggering

---

## Feature 3 — Email Notification on Milestone Achieved 🟡 IMPORTANT

### Problem
Users may not log in frequently. An email sent when a milestone is achieved makes the program feel professional and credible.

### What to Build
After a milestone is recorded, trigger an email to the user using the **existing Brevo email system** in `email_service.py`.

---

### Files to Modify

#### [MODIFY] `Backend/routers/referrals.py`

After the milestone INSERT, fetch user info and send email:

```python
cursor.execute(
    "SELECT name, email FROM users WHERE user_id = %s", (referrer_id,)
)
user_info = cursor.fetchone()

if user_info:
    from email_service import send_referral_milestone_email
    send_referral_milestone_email(
        to_email=user_info["email"],
        name=user_info["name"],
        tier=tier,
        role=role
    )
```

---

#### [MODIFY] `Backend/email_service.py`

Add new function `send_referral_milestone_email()`:

```python
def send_referral_milestone_email(to_email: str, name: str, tier: int, role: str):
    """Send congratulatory email when user hits a referral milestone."""
    tier_label = f"Tier {tier}"
    subject = f"🎉 You've unlocked {tier_label} on ConEco!"

    html_body = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;
                background: #0d1117; color: #e6edf3; padding: 2rem; border-radius: 12px;">
      <h2 style="color: #3fb950;">🎉 Congratulations, {name}!</h2>
      <p>You've hit the <strong style="color: #ffd700;">{tier_label} Milestone</strong>
         in the ConEco Referral Loyalty Program!</p>
      <p>You've referred enough people to earn an <strong>exclusive surprise prize</strong>.</p>
      <div style="background: #161b22; border: 1px solid #3fb950; border-radius: 8px;
                  padding: 1rem; margin: 1.5rem 0; text-align: center;">
        <p style="margin: 0; font-size: 1.1rem;">🎁 <strong>{tier_label} Prize Unlocked!</strong></p>
        <p style="margin: 0.5rem 0 0 0; color: #8b949e; font-size: 0.9rem;">
          Our team will contact you soon to deliver your prize.
        </p>
      </div>
      <p>Keep referring to unlock higher tiers and bigger prizes!</p>
      <a href="https://coneco.store/referral"
         style="display: inline-block; padding: 0.8rem 1.5rem; background: #2ea043;
                color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">
        View Your Referral Dashboard →
      </a>
      <p style="margin-top: 2rem; color: #8b949e; font-size: 0.8rem;">— The ConEco Team</p>
    </div>
    """
    # Use your existing Brevo send function — adjust to match actual signature:
    # Example: send_email_via_brevo(to_email=to_email, subject=subject, html=html_body)
```

---

### Acceptance Criteria
- [ ] Email sent automatically when a milestone is first recorded
- [ ] Email is NOT sent again on duplicate milestone (UNIQUE constraint prevents it)
- [ ] Email contains tier number, user's name, and link to `/referral`
- [ ] Sent via existing Brevo infrastructure in `email_service.py`

---

## 📅 Build Order & Timeline

| Step | Feature | Est. Time | Priority |
|------|---------|-----------|----------|
| **1** | Referral code input — Register.jsx + auth.py | ~1.5 hrs | 🔴 Critical |
| **2** | In-app notification on milestone | ~1 hr | 🟡 Important |
| **3** | Email notification on milestone | ~1.5 hrs | 🟡 Important |

**Total: ~4 hours**

---

## ✅ End-to-End Acceptance Test

After all 3 features are built, run this full test:

```
1.  Log in as User A → go to /referral → copy referral code
2.  Open incognito browser → go to /register (no URL param)
3.  Manually type User A's code in the referral code field
4.  Complete registration with a new email
5.  Verify email for the new account
6.  Log back in as User A → /referral → count should have increased by 1
7.  Repeat until User A crosses Tier 1 threshold (25 for Customer / 50 for Vendor)
8.  Verify:
    ✅ Notification bell shows "🎉 Referral Milestone — Tier 1 Achieved!"
    ✅ Email received in User A's inbox with congratulation message
    ✅ /referral page shows "🎉 Achieved!" on Tier 1 card
9.  Admin logs into /admin/referrals → clicks "Mark Fulfilled" for User A Tier 1
10. User A refreshes /referral → sees "✅ Prize Claimed"
```

---

*Con-Eco Referral Program | Update Features Plan v1.0 | July 2026*
