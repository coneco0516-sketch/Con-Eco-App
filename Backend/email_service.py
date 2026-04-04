"""
ConEco Email Service - Production Ready
==========================================
Async email service using fastapi-mail (SMTP-based).
- Uses FastAPI BackgroundTasks for non-blocking sends
- Supports Gmail App Password (MAIL_PASSWORD)
- Retry logic (3 attempts)
- DB logging of all attempts
- Provider-agnostic: swap SMTP for API later without touching callers
"""

import os
import asyncio
import smtplib
import traceback
from typing import Optional
from datetime import datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv
from database import get_db_connection

load_dotenv()

# ─── CONFIGURATION ────────────────────────────────────────────────────────────
# Supports both new MAIL_* variables and legacy GMAIL_* variables
MAIL_USERNAME   = os.environ.get("MAIL_USERNAME")  or os.environ.get("GMAIL_SMTP_USER", "")
MAIL_PASSWORD   = os.environ.get("MAIL_PASSWORD")  or os.environ.get("GMAIL_APP_PASSWORD", "")
MAIL_FROM       = os.environ.get("MAIL_FROM")      or os.environ.get("FROM_EMAIL", MAIL_USERNAME)
MAIL_FROM_NAME  = os.environ.get("MAIL_FROM_NAME") or os.environ.get("FROM_NAME", "ConEco")
MAIL_PORT       = int(os.environ.get("MAIL_PORT", "587"))
MAIL_SERVER     = os.environ.get("MAIL_SERVER", "smtp.gmail.com")

# Backwards-compatibility aliases used by existing callers
GMAIL_SMTP_USER   = MAIL_USERNAME
GMAIL_APP_PASSWORD = MAIL_PASSWORD
FROM_EMAIL         = MAIL_FROM
FROM_NAME          = MAIL_FROM_NAME

APP_NAME = "ConEco"
APP_URL  = os.environ.get("APP_URL", "https://con-eco-app-production.up.railway.app")

EMAIL_CONFIGURED = bool(MAIL_USERNAME and MAIL_PASSWORD)

if not EMAIL_CONFIGURED:
    print("WARNING: Email credentials not configured. Emails will be skipped.")
else:
    print(f"INFO: Email service ready → {MAIL_USERNAME} via {MAIL_SERVER}:{MAIL_PORT}")


# ─── DB LOGGING ───────────────────────────────────────────────────────────────
def log_email_attempt(to_email: str, subject: str, status: str, error: str = None):
    """Log each email attempt to the database for auditability."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS email_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                to_email VARCHAR(255),
                subject VARCHAR(255),
                status VARCHAR(50),
                error_message TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.commit()
        cursor.execute(
            "INSERT INTO email_logs (to_email, subject, status, error_message) VALUES (%s, %s, %s, %s)",
            (to_email, subject, status, error)
        )
        conn.commit()
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"[email_log] Could not write log: {e}")


# ─── CORE SEND (SYNC, WITH RETRY) ────────────────────────────────────────────
def send_email(to_email: str, subject: str, html_content: str,
               plain_text: str = None, max_retries: int = 3) -> bool:
    """
    Core email send function.
    - Uses SMTP via smtplib (STARTTLS on port 587)
    - Retries up to max_retries times on transient errors
    - Logs every attempt to the DB
    - Never raises — returns True on success, False on failure
    """
    if not EMAIL_CONFIGURED:
        print(f"[email] SKIP (not configured) → {to_email} | {subject}")
        return False

    # Validate recipient
    if not to_email or "@" not in to_email:
        print(f"[email] INVALID recipient: {to_email}")
        return False

    # Build MIME message
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"]    = f"{MAIL_FROM_NAME} <{MAIL_FROM}>"
    msg["To"]      = to_email
    msg["Reply-To"] = MAIL_FROM

    msg.attach(MIMEText(plain_text or "This email requires an HTML-compatible client.", "plain"))
    msg.attach(MIMEText(html_content, "html"))

    last_error = None
    for attempt in range(1, max_retries + 1):
        try:
            print(f"[email] Attempt {attempt}/{max_retries} → {to_email}")
            with smtplib.SMTP(MAIL_SERVER, MAIL_PORT, timeout=15) as server:
                server.starttls()
                server.login(MAIL_USERNAME, MAIL_PASSWORD)
                server.send_message(msg)

            print(f"[email] SUCCESS → {to_email}")
            log_email_attempt(to_email, subject, "Success")
            return True

        except smtplib.SMTPAuthenticationError as auth_err:
            # Auth errors will never succeed on retry — fail fast
            error_msg = f"AUTH FAILED: {auth_err}"
            print(f"[email] CRITICAL AUTH ERROR for {MAIL_USERNAME}: {error_msg}")
            log_email_attempt(to_email, subject, "AuthError", error_msg)
            return False

        except Exception as e:
            last_error = str(e)
            print(f"[email] Attempt {attempt} failed: {last_error}")
            if attempt < max_retries:
                import time; time.sleep(2 ** attempt)  # exponential back-off

    traceback.print_exc()
    log_email_attempt(to_email, subject, "Failed", last_error)
    return False


# ─── ASYNC WRAPPER ────────────────────────────────────────────────────────────
async def send_email_async(to_email: str, subject: str, html_content: str,
                           plain_text: str = None) -> bool:
    """
    Async version of send_email — call from async routes.
    Runs the blocking SMTP call in a thread pool to avoid blocking the event loop.
    """
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(
        None, lambda: send_email(to_email, subject, html_content, plain_text)
    )


# ─── BACKGROUND TASK HELPER ───────────────────────────────────────────────────
def send_email_background(background_tasks, to_email: str, subject: str,
                          html_content: str, plain_text: str = None):
    """
    Queue an email to be sent in the background (non-blocking API response).
    Usage:
        from email_service import send_email_background
        @router.post("/register")
        def register(bg: BackgroundTasks, ...):
            send_email_background(bg, user_email, subject, html)
    """
    background_tasks.add_task(send_email, to_email, subject, html_content, plain_text)


# ─── HTML TEMPLATE HELPER ─────────────────────────────────────────────────────
def _wrap_html(title: str, header_color: str, body_html: str) -> str:
    """Wrap content in the ConEco branded email shell."""
    year = datetime.now().year
    return f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>{title}</title></head>
<body style="font-family:Arial,sans-serif;background-color:#f5f5f5;padding:20px;margin:0">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.1)">
    <!-- HEADER -->
    <div style="background:{header_color};padding:24px 30px">
      <h1 style="color:#fff;margin:0;font-size:22px">{APP_NAME}</h1>
    </div>
    <!-- BODY -->
    <div style="padding:30px">
      {body_html}
    </div>
    <!-- FOOTER -->
    <div style="background:#f9f9f9;padding:16px 30px;border-top:1px solid #eee;text-align:center">
      <p style="color:#aaa;font-size:12px;margin:0">
        &copy; {year} {APP_NAME}. This is an automated notification — please do not reply.
      </p>
    </div>
  </div>
</body>
</html>"""


# ─── NOTIFICATION FUNCTIONS ───────────────────────────────────────────────────

def send_email_verification(email: str, name: str, verification_token: str) -> bool:
    """Send email verification link on registration."""
    link = f"{APP_URL}/verify-email?token={verification_token}"
    body = f"""
      <h2 style="color:#2ecc71;margin-top:0">Verify Your Email</h2>
      <p>Hello <strong>{name}</strong>,</p>
      <p>Thank you for registering with {APP_NAME}! Click the button below to activate your account.</p>
      <div style="text-align:center;margin:30px 0">
        <a href="{link}" style="background:#2ecc71;color:#fff;padding:12px 32px;text-decoration:none;border-radius:5px;font-weight:bold;display:inline-block">Verify Email</a>
      </div>
      <p style="color:#888;font-size:13px">Or copy this link: <a href="{link}">{link}</a></p>
      <p style="color:#888;font-size:13px">This link expires in <strong>24 hours</strong>. If you did not register, you can safely ignore this email.</p>
    """
    return send_email(email, f"{APP_NAME} - Verify Your Email", _wrap_html("Verify Email", "#2ecc71", body))


def send_verification_email(email: str, token: str) -> bool:
    """Alias — matches function name requested in spec."""
    return send_email_verification(email, email.split("@")[0], token)


def send_order_confirmation_email(email: str, order_details: dict) -> bool:
    """Send order confirmation to customer."""
    order_id    = order_details.get("order_id", "N/A")
    amount      = order_details.get("total_amount", "—")
    status      = order_details.get("status", "Confirmed")
    date        = order_details.get("date", datetime.now().strftime("%d %b %Y %H:%M"))
    cust_name   = order_details.get("customer_name", "Customer")
    body = f"""
      <h2 style="color:#2ecc71;margin-top:0">Order Confirmed! 🎉</h2>
      <p>Hello <strong>{cust_name}</strong>,</p>
      <p>Thank you for your order. Here are the details:</p>
      <div style="background:#f9f9f9;padding:18px;border-radius:6px;margin:20px 0;border-left:4px solid #2ecc71">
        <p><strong>Order ID:</strong> #{order_id}</p>
        <p><strong>Date:</strong> {date}</p>
        <p><strong>Total Amount:</strong> ₹{amount}</p>
        <p><strong>Status:</strong> {status}</p>
      </div>
      <p>You will receive updates as your order progresses.</p>
      <div style="text-align:center;margin:24px 0">
        <a href="{APP_URL}/customer/orders" style="background:#3498db;color:#fff;padding:10px 24px;text-decoration:none;border-radius:5px;display:inline-block">View Order</a>
      </div>
    """
    return send_email(email, f"{APP_NAME} - Order Confirmation #{order_id}",
                      _wrap_html("Order Confirmation", "#2ecc71", body))


def send_order_confirmation(email: str, customer_name: str, order_details: dict) -> bool:
    """Backwards-compatible alias used by payment router."""
    order_details["customer_name"] = customer_name
    return send_order_confirmation_email(email, order_details)


def send_vendor_notification_email(email: str, order_info: dict) -> bool:
    """Notify vendor of a new order."""
    order_id    = order_info.get("order_id", "N/A")
    item_name   = order_info.get("item_name", "Item")
    quantity    = order_info.get("quantity", "")
    amount      = order_info.get("amount", "—")
    vendor_name = order_info.get("vendor_name", "Vendor")
    body = f"""
      <h2 style="color:#3498db;margin-top:0">New Order Received!</h2>
      <p>Hello <strong>{vendor_name}</strong>,</p>
      <p>You have received a new order on {APP_NAME}.</p>
      <div style="background:#f9f9f9;padding:18px;border-radius:6px;margin:20px 0;border-left:4px solid #3498db">
        <p><strong>Order ID:</strong> #{order_id}</p>
        <p><strong>Item:</strong> {item_name} × {quantity}</p>
        <p><strong>Amount:</strong> ₹{amount}</p>
      </div>
      <div style="text-align:center;margin:24px 0">
        <a href="{APP_URL}/vendor/orders" style="background:#3498db;color:#fff;padding:10px 24px;text-decoration:none;border-radius:5px;display:inline-block">View Orders</a>
      </div>
    """
    return send_email(email, f"{APP_NAME} - New Order #{order_id}",
                      _wrap_html("New Order", "#3498db", body))


def send_password_reset_email(email: str, reset_token: str) -> bool:
    """Send password reset link."""
    link = f"{APP_URL}/reset-password?token={reset_token}"
    body = f"""
      <h2 style="color:#e74c3c;margin-top:0">Password Reset Request</h2>
      <p>We received a request to reset the password for your {APP_NAME} account.</p>
      <div style="text-align:center;margin:30px 0">
        <a href="{link}" style="background:#e74c3c;color:#fff;padding:12px 32px;text-decoration:none;border-radius:5px;font-weight:bold;display:inline-block">Reset Password</a>
      </div>
      <p style="color:#888;font-size:13px">This link expires in <strong>1 hour</strong>.</p>
      <p style="color:#888;font-size:13px">If you did not request a password reset, ignore this email — your password will remain unchanged.</p>
    """
    return send_email(email, f"{APP_NAME} - Password Reset Request",
                      _wrap_html("Password Reset", "#e74c3c", body))


def send_login_notification(email: str, user_type: str, username: str,
                             ip_address: str = None, browser_info: str = None) -> bool:
    """Security alert when a new login is detected."""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    ip_row   = f"<p><strong>IP Address:</strong> {ip_address}</p>" if ip_address else ""
    dev_row  = f"<p><strong>Device/Browser:</strong> {browser_info}</p>" if browser_info else ""
    body = f"""
      <h2 style="color:#2ecc71;margin-top:0">New Login Detected</h2>
      <p>Hello <strong>{username}</strong>,</p>
      <p>A new login was detected on your {APP_NAME} {user_type.capitalize()} account.</p>
      <div style="background:#f9f9f9;padding:18px;border-radius:6px;margin:20px 0;border-left:4px solid #2ecc71">
        <p><strong>Date & Time:</strong> {timestamp}</p>
        {ip_row}{dev_row}
        <p><strong>Account Type:</strong> {user_type.capitalize()}</p>
      </div>
      <p>If this was not you, please change your password immediately.</p>
    """
    return send_email(email, f"{APP_NAME} - Login Notification",
                      _wrap_html("Login Alert", "#2ecc71", body))


def send_password_change_notification(email: str, username: str, user_type: str) -> bool:
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    body = f"""
      <h2 style="color:#e74c3c;margin-top:0">Password Changed</h2>
      <p>Hello <strong>{username}</strong>,</p>
      <p>Your {APP_NAME} password was changed on <strong>{timestamp}</strong>.</p>
      <p>If you did not make this change, <a href="{APP_URL}/reset-password">click here to secure your account</a>.</p>
    """
    return send_email(email, f"{APP_NAME} - Password Change Notification",
                      _wrap_html("Security Alert", "#e74c3c", body))


def send_profile_update_notification(email: str, username: str, user_type: str,
                                      updates: dict) -> bool:
    rows = "".join(f"<p><strong>{k}:</strong> {v}</p>" for k, v in updates.items())
    body = f"""
      <h2 style="color:#3498db;margin-top:0">Account Updated</h2>
      <p>Hello <strong>{username}</strong>,</p>
      <p>Your {APP_NAME} account information was updated on {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}.</p>
      <div style="background:#f9f9f9;padding:18px;border-radius:6px;margin:20px 0;border-left:4px solid #3498db">
        <p><strong>Changes Made:</strong></p>{rows}
      </div>
      <p>If you did not make these changes, please contact support immediately.</p>
    """
    return send_email(email, f"{APP_NAME} - Account Update Notification",
                      _wrap_html("Account Update", "#3498db", body))


def send_qc_status_notification(email: str, vendor_name: str, status: str,
                                 qc_score: int = None, feedback: str = None) -> bool:
    colors = {"Verified": "#2ecc71", "Rejected": "#e74c3c", "Pending": "#f39c12"}
    color = colors.get(status, "#95a5a6")
    score_row    = f"<p><strong>QC Score:</strong> {qc_score}/100</p>" if qc_score is not None else ""
    feedback_row = f"""<div style="background:#fff3cd;padding:15px;border-left:4px solid #ffc107;margin:16px 0">
                         <strong>Admin Feedback:</strong><p>{feedback}</p></div>""" if feedback else ""
    body = f"""
      <h2 style="color:{color};margin-top:0">QC Verification Status Update</h2>
      <p>Hello <strong>{vendor_name}</strong>,</p>
      <p>Your QC verification status has been updated.</p>
      <div style="background:#f9f9f9;padding:18px;border-radius:6px;margin:20px 0;border-left:4px solid {color}">
        <p><strong>Status:</strong> <span style="color:{color};font-weight:bold">{status}</span></p>
        {score_row}
      </div>
      {feedback_row}
      <div style="text-align:center;margin:24px 0">
        <a href="{APP_URL}/vendor/dashboard" style="background:#3498db;color:#fff;padding:10px 24px;text-decoration:none;border-radius:5px;display:inline-block">View Dashboard</a>
      </div>
    """
    return send_email(email, f"{APP_NAME} - QC Verification Status Update",
                      _wrap_html("QC Update", color, body))


def send_order_update(email: str, customer_name: str, order_id, new_status: str,
                      tracking_info: str = None) -> bool:
    tracking_row = f"<p><strong>Tracking Info:</strong> {tracking_info}</p>" if tracking_info else ""
    body = f"""
      <h2 style="color:#3498db;margin-top:0">Order Status Update</h2>
      <p>Hello <strong>{customer_name}</strong>,</p>
      <div style="background:#f9f9f9;padding:18px;border-radius:6px;margin:20px 0;border-left:4px solid #3498db">
        <p><strong>Order ID:</strong> #{order_id}</p>
        <p><strong>Status:</strong> {new_status}</p>
        {tracking_row}
      </div>
      <div style="text-align:center;margin:24px 0">
        <a href="{APP_URL}/customer/orders" style="background:#3498db;color:#fff;padding:10px 24px;text-decoration:none;border-radius:5px;display:inline-block">Track Order</a>
      </div>
    """
    return send_email(email, f"{APP_NAME} - Order #{order_id} Update",
                      _wrap_html("Order Update", "#3498db", body))


def send_contact_form(name: str, email: str, message: str) -> bool:
    """Forward contact form to admin."""
    admin_email = MAIL_FROM
    body = f"""
      <h2 style="color:#3498db;margin-top:0">New Contact Form Submission</h2>
      <div style="background:#f9f9f9;padding:18px;border-radius:6px;margin:20px 0;border-left:4px solid #3498db">
        <p><strong>From:</strong> {name}</p>
        <p><strong>Email:</strong> {email}</p>
      </div>
      <p><strong>Message:</strong></p>
      <div style="white-space:pre-wrap;color:#333;line-height:1.6">{message}</div>
      <p style="color:#aaa;font-size:12px">Submitted: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}</p>
    """
    return send_email(admin_email, f"Contact Form: {name}",
                      _wrap_html("Contact Form", "#3498db", body))


def send_contact_acknowledgment(name: str, email: str) -> bool:
    body = f"""
      <h2 style="color:#2ecc71;margin-top:0">Thank You for Contacting Us!</h2>
      <p>Hello <strong>{name}</strong>,</p>
      <p>We have received your message and will get back to you within 24–48 hours.</p>
      <p>For urgent queries, email us at <a href="mailto:{MAIL_FROM}">{MAIL_FROM}</a>.</p>
    """
    return send_email(email, f"{APP_NAME} - We Received Your Message",
                      _wrap_html("Message Received", "#2ecc71", body))


def send_contact_reply(name: str, email: str, original_message: str,
                       reply_message: str) -> bool:
    body = f"""
      <h2 style="color:#3498db;margin-top:0">Response from {APP_NAME} Support</h2>
      <p>Hello <strong>{name}</strong>,</p>
      <div style="background:#eaf7ff;padding:20px;border-radius:8px;border-left:4px solid #3498db;margin:20px 0">
        <p style="font-weight:bold;margin:0 0 10px">Our Response:</p>
        <div style="white-space:pre-wrap;color:#333;line-height:1.6">{reply_message}</div>
      </div>
      <div style="background:#f9f9f9;padding:15px;border-radius:8px;margin:20px 0">
        <p style="color:#888;font-weight:bold;font-size:0.9rem;margin:0 0 8px">Your Original Message:</p>
        <div style="white-space:pre-wrap;color:#999;font-size:0.9rem;line-height:1.5">{original_message}</div>
      </div>
    """
    return send_email(email, f"{APP_NAME} - Response to Your Enquiry",
                      _wrap_html("Support Reply", "#3498db", body))


# ─── NOTIFICATION PREFERENCES (DB HELPERS) ────────────────────────────────────
def get_notification_preferences(user_id: int) -> dict:
    """Fetch user notification preferences from DB. Returns defaults if not found."""
    defaults = {
        "login_alerts": True, "password_change_alerts": True,
        "profile_update_alerts": True, "product_update_alerts": True,
        "order_alerts": True, "qc_status_alerts": True
    }
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM notification_preferences WHERE user_id = %s", (user_id,))
        result = cursor.fetchone()
        cursor.close()
        conn.close()
        return result or defaults
    except Exception as e:
        print(f"[prefs] Could not fetch preferences: {e}")
        return defaults


def save_notification_preference(user_id: int, user_type: str, preferences: dict) -> bool:
    """Upsert user notification preferences."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO notification_preferences
                (user_id, user_type, login_alerts, password_change_alerts,
                 profile_update_alerts, product_update_alerts, order_alerts,
                 qc_status_alerts, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
            ON DUPLICATE KEY UPDATE
                login_alerts=VALUES(login_alerts),
                password_change_alerts=VALUES(password_change_alerts),
                profile_update_alerts=VALUES(profile_update_alerts),
                product_update_alerts=VALUES(product_update_alerts),
                order_alerts=VALUES(order_alerts),
                qc_status_alerts=VALUES(qc_status_alerts),
                updated_at=NOW()
        """, (
            user_id, user_type,
            preferences.get("login_alerts", True),
            preferences.get("password_change_alerts", True),
            preferences.get("profile_update_alerts", True),
            preferences.get("product_update_alerts", True),
            preferences.get("order_alerts", True),
            preferences.get("qc_status_alerts", True),
        ))
        conn.commit()
        cursor.close()
        conn.close()
        return True
    except Exception as e:
        print(f"[prefs] Could not save preferences: {e}")
        return False
