"""
Email notification service using Resend API
Handles all email sending for login notifications, account updates, verification, etc.
NOTE: Uses Resend (https://resend.com) via HTTPS — works on Railway, excellent Gmail deliverability.
"""

import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from database import get_db_connection
from dotenv import load_dotenv

load_dotenv()

def log_email_attempt(to_email, subject, status, error=None):
    """Log email attempt to database for debugging"""
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
        cursor.execute("""
            INSERT INTO email_logs (to_email, subject, status, error_message)
            VALUES (%s, %s, %s, %s)
        """, (to_email, subject, status, error))
        conn.commit()
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"DEBUG: Could not log email attempt: {str(e)}")

# --- Gmail SMTP Configuration ---
GMAIL_SMTP_SERVER = "smtp.gmail.com"
GMAIL_SMTP_PORT   = 587
GMAIL_SMTP_USER   = os.environ.get("GMAIL_SMTP_USER", "coneco0516@gmail.com")
GMAIL_APP_PASSWORD = os.environ.get("GMAIL_APP_PASSWORD", "lbzezfzzcfbcncsr")
FROM_EMAIL        = os.environ.get("FROM_EMAIL", GMAIL_SMTP_USER)
FROM_NAME         = os.environ.get("FROM_NAME", "ConEco")
REPLY_TO_EMAIL    = os.environ.get("REPLY_TO_EMAIL", GMAIL_SMTP_USER)
APP_NAME          = FROM_NAME
APP_URL           = os.environ.get("APP_URL", "https://con-eco-app-production.up.railway.app")

if not GMAIL_APP_PASSWORD:
    print("CRITICAL WARNING: GMAIL_APP_PASSWORD (App Password) is missing!")
else:
    print(f"INFO: Gmail SMTP service configured for user: {GMAIL_SMTP_USER}")

def send_email(to_email, subject, html_content, plain_text=None):
    """
    Send email using Gmail SMTP (SSL/TLS).
    Requires a Google App Password if 2FA is enabled.
    """
    if not GMAIL_APP_PASSWORD:
        error_msg = "GMAIL_APP_PASSWORD is missing from environment variables."
        print(f"WARNING: {error_msg} Email to {to_email} not sent.")
        log_email_attempt(to_email, subject, "ConfigError", error_msg)
        return False

    try:
        # Create message container
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = f"{FROM_NAME} <{FROM_EMAIL}>"
        msg['To'] = to_email
        msg['Reply-To'] = REPLY_TO_EMAIL

        # Add body to email
        if plain_text:
            msg.attach(MIMEText(plain_text, 'plain'))
        
        if html_content:
            msg.attach(MIMEText(html_content, 'html'))
        else:
            msg.attach(MIMEText("<p>No content</p>", 'html'))

        # Create connection and send
        print(f"DEBUG SMTP: Connecting to {GMAIL_SMTP_SERVER}:{GMAIL_SMTP_PORT} for {to_email}...")
        with smtplib.SMTP(GMAIL_SMTP_SERVER, GMAIL_SMTP_PORT, timeout=15) as server:
            server.set_debuglevel(1)  # ENABLED: shows full SMTP conversation in Railway logs
            server.starttls()
            print(f"DEBUG SMTP: Logging in as {GMAIL_SMTP_USER}...")
            server.login(GMAIL_SMTP_USER, GMAIL_APP_PASSWORD)
            print("DEBUG SMTP: Login OK, sending message...")
            server.send_message(msg)

        print(f"SUCCESS: Gmail email sent to {to_email}")
        log_email_attempt(to_email, subject, "Success")
        return True

    except smtplib.SMTPAuthenticationError as auth_err:
        error_msg = f"AUTH FAILED: {str(auth_err)}"
        print(f"CRITICAL: Gmail authentication failed for {GMAIL_SMTP_USER}. Check App Password. {error_msg}")
        log_email_attempt(to_email, subject, "AuthError", error_msg)
        return False
    except Exception as e:
        import traceback
        error_msg = str(e)
        print(f"SMTP ERROR sending to {to_email}: {error_msg}")
        traceback.print_exc()
        log_email_attempt(to_email, subject, "Error", error_msg)
        return False


def send_login_notification(email, user_type, username, ip_address=None, browser_info=None):
    """
    Send login notification email
    
    Args:
        email (str): User email
        user_type (str): admin, vendor, customer
        username (str): User's username or business name
        ip_address (str): IP address of login
        browser_info (str): Browser/device info
    """
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    html_content = f"""
    <html>
        <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h2 style="color: #2ecc71;">Login Notification</h2>
                <p>Hello {username},</p>
                
                <p>We detected a new login to your {APP_NAME} {user_type.capitalize()} account.</p>
                
                <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p><strong>Login Details:</strong></p>
                    <p><strong>Date & Time:</strong> {timestamp}</p>
                    {f'<p><strong>IP Address:</strong> {ip_address}</p>' if ip_address else ''}
                    {f'<p><strong>Device/Browser:</strong> {browser_info}</p>' if browser_info else ''}
                    <p><strong>Account Type:</strong> {user_type.capitalize()}</p>
                </div>
                
                <p>If this wasn't you, please change your password immediately and contact our support team.</p>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                    <p style="color: #888; font-size: 12px;">
                        © {datetime.now().year} {APP_NAME}. This is an automated notification. Please don't reply to this email.
                    </p>
                </div>
            </div>
        </body>
    </html>
    """
    
    return send_email(email, f"{APP_NAME} - Login Notification", html_content)


def send_password_change_notification(email, username, user_type):
    """Send password change notification"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    html_content = f"""
    <html>
        <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h2 style="color: #e74c3c;">Password Changed</h2>
                <p>Hello {username},</p>
                
                <p>Your {APP_NAME} password was successfully changed on {timestamp}.</p>
                
                <p>If you did not make this change, please click the link below to secure your account:</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{APP_URL}/reset-password" style="background-color: #e74c3c; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Secure Account</a>
                </div>
                
                <p>For security reasons, we recommend you reset your password again and update any connected applications.</p>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                    <p style="color: #888; font-size: 12px;">
                        © {datetime.now().year} {APP_NAME}. This is an automated notification. Please don't reply to this email.
                    </p>
                </div>
            </div>
        </body>
    </html>
    """
    
    return send_email(email, f"{APP_NAME} - Password Change Notification", html_content)


def send_profile_update_notification(email, username, user_type, updates):
    """
    Send account update notification
    
    Args:
        updates (dict): Dictionary of updated fields
    """
    updates_html = ""
    for field, value in updates.items():
        updates_html += f"<p><strong>{field}:</strong> {value}</p>"
    
    html_content = f"""
    <html>
        <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h2 style="color: #3498db;">Account Updated</h2>
                <p>Hello {username},</p>
                
                <p>Your {APP_NAME} account information was updated on {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}.</p>
                
                <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p><strong>Changes Made:</strong></p>
                    {updates_html}
                </div>
                
                <p>If you did not make these changes, please contact our support team immediately.</p>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                    <p style="color: #888; font-size: 12px;">
                        © {datetime.now().year} {APP_NAME}. This is an automated notification. Please don't reply to this email.
                    </p>
                </div>
            </div>
        </body>
    </html>
    """
    
    return send_email(email, f"{APP_NAME} - Account Update Notification", html_content)


def send_email_verification(email, username, verification_token):
    """
    Send email verification link
    
    Args:
        email (str): User email
        username (str): User's name
        verification_token (str): Verification token
    """
    verification_link = f"{APP_URL}/verify-email?token={verification_token}"
    
    html_content = f"""
    <html>
        <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h2 style="color: #2ecc71;">Verify Your Email</h2>
                <p>Hello {username},</p>
                
                <p>Thank you for registering with {APP_NAME}! Please verify your email address to activate your account.</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{verification_link}" style="background-color: #2ecc71; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Verify Email</a>
                </div>
                
                <p>Or copy this link in your browser:</p>
                <p style="word-break: break-all; color: #666; font-size: 12px;">{verification_link}</p>
                
                <p>This verification link will expire in 24 hours.</p>
                
                <p>If you did not create this account, please ignore this email.</p>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                    <p style="color: #888; font-size: 12px;">
                        © {datetime.now().year} {APP_NAME}. This is an automated notification. Please don't reply to this email.
                    </p>
                </div>
            </div>
        </body>
    </html>
    """
    
    return send_email(email, f"{APP_NAME} - Verify Your Email", html_content)


def send_qc_status_notification(email, vendor_name, status, qc_score=None, feedback=None):
    """
    Send QC verification status notification
    
    Args:
        email (str): Vendor email
        vendor_name (str): Vendor business name
        status (str): Verified, Rejected, Pending
        qc_score (int): QC score (0-100)
        feedback (str): Admin feedback
    """
    status_colors = {
        'Verified': '#2ecc71',
        'Rejected': '#e74c3c',
        'Pending': '#f39c12'
    }
    status_color = status_colors.get(status, '#95a5a6')
    
    html_content = f"""
    <html>
        <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h2 style="color: {status_color};">QC Verification Status Update</h2>
                <p>Hello {vendor_name},</p>
                
                <p>Your QC verification status has been updated.</p>
                
                <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p><strong>Status:</strong> <span style="color: {status_color}; font-weight: bold;">{status}</span></p>
                    {f'<p><strong>QC Score:</strong> {qc_score}/100</p>' if qc_score is not None else ''}
                </div>
                
                {f'<div style="background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0;"><p><strong>Feedback from Admin:</strong></p><p>{feedback}</p></div>' if feedback else ''}
                
                <p>Login to your dashboard to view more details and manage your products/services.</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{APP_URL}/vendor/dashboard" style="background-color: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View Dashboard</a>
                </div>
                
                {f'<p style="color: #e74c3c;"><strong>Note:</strong> Your products and services will not be visible to customers until your account is verified.</p>' if status != 'Verified' else ''}
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                    <p style="color: #888; font-size: 12px;">
                        © {datetime.now().year} {APP_NAME}. This is an automated notification. Please don't reply to this email.
                    </p>
                </div>
            </div>
        </body>
    </html>
    """
    
    return send_email(email, f"{APP_NAME} - QC Verification Status Update", html_content)


def send_order_confirmation(email, customer_name, order_details):
    """
    Send order/booking confirmation
    
    Args:
        email (str): Customer email
        customer_name (str): Customer name
        order_details (dict): Order details
    """
    html_content = f"""
    <html>
        <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h2 style="color: #2ecc71;">Order Confirmation</h2>
                <p>Hello {customer_name},</p>
                
                <p>Thank you for your order! Here are the details:</p>
                
                <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    {f'<p><strong>Order ID:</strong> {order_details.get("order_id")}</p>' if order_details.get("order_id") else ''}
                    {f'<p><strong>Date:</strong> {order_details.get("date")}</p>' if order_details.get("date") else ''}
                    {f'<p><strong>Total Amount:</strong> ₹{order_details.get("total_amount")}</p>' if order_details.get("total_amount") else ''}
                    {f'<p><strong>Status:</strong> {order_details.get("status")}</p>' if order_details.get("status") else ''}
                </div>
                
                <p>You will receive updates about your order status via email.</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{APP_URL}/customer/orders" style="background-color: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View Order</a>
                </div>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                    <p style="color: #888; font-size: 12px;">
                        © {datetime.now().year} {APP_NAME}. This is an automated notification. Please don't reply to this email.
                    </p>
                </div>
            </div>
        </body>
    </html>
    """
    
    return send_email(email, f"{APP_NAME} - Order Confirmation #{order_details.get('order_id', 'N/A')}", html_content)


def send_order_update(email, customer_name, order_id, new_status, tracking_info=None):
    """
    Send order status update email
    
    Args:
        email (str): Customer email
        customer_name (str): Customer name
        order_id (str): Order ID
        new_status (str): New order status
        tracking_info (str): Tracking information if available
    """
    status_messages = {
        'processing': 'Your order is being processed',
        'shipped': 'Your order has been shipped',
        'delivered': 'Your order has been delivered',
        'cancelled': 'Your order has been cancelled'
    }
    status_message = status_messages.get(new_status.lower(), f'Status: {new_status}')
    
    html_content = f"""
    <html>
        <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h2 style="color: #3498db;">Order Update</h2>
                <p>Hello {customer_name},</p>
                
                <p>{status_message}.</p>
                
                <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p><strong>Order ID:</strong> {order_id}</p>
                    <p><strong>Status:</strong> {new_status}</p>
                    {f'<p><strong>Tracking Info:</strong> {tracking_info}</p>' if tracking_info else ''}
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{APP_URL}/customer/orders/{order_id}" style="background-color: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Track Order</a>
                </div>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                    <p style="color: #888; font-size: 12px;">
                        © {datetime.now().year} {APP_NAME}. This is an automated notification. Please don't reply to this email.
                    </p>
                </div>
            </div>
        </body>
    </html>
    """
    
    return send_email(email, f"{APP_NAME} - Order #{order_id} Update", html_content)


def save_notification_preference(user_id, user_type, preferences):
    """
    Save user notification preferences to database
    
    Args:
        user_id (int): User ID
        user_type (str): admin, vendor, customer
        preferences (dict): Notification preferences
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        prefs_json = str(preferences).replace("'", '"')
        
        cursor.execute("""
            INSERT INTO notification_preferences (user_id, user_type, login_alerts, password_change_alerts, 
                                                 profile_update_alerts, product_update_alerts, order_alerts, 
                                                 qc_status_alerts, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
            ON DUPLICATE KEY UPDATE
            login_alerts = VALUES(login_alerts),
            password_change_alerts = VALUES(password_change_alerts),
            profile_update_alerts = VALUES(profile_update_alerts),
            product_update_alerts = VALUES(product_update_alerts),
            order_alerts = VALUES(order_alerts),
            qc_status_alerts = VALUES(qc_status_alerts),
            updated_at = NOW()
        """, (
            user_id, user_type,
            preferences.get('login_alerts', True),
            preferences.get('password_change_alerts', True),
            preferences.get('profile_update_alerts', True),
            preferences.get('product_update_alerts', True),
            preferences.get('order_alerts', True),
            preferences.get('qc_status_alerts', True)
        ))
        
        conn.commit()
        cursor.close()
        conn.close()
        return True
        
    except Exception as e:
        print(f"Error saving notification preferences: {str(e)}")
        return False


def get_notification_preferences(user_id):
    """Get user notification preferences"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT * FROM notification_preferences WHERE user_id = %s
        """, (user_id,))
        
        result = cursor.fetchone()
        cursor.close()
        conn.close()
        
        return result or {
            'login_alerts': True,
            'password_change_alerts': True,
            'profile_update_alerts': True,
            'product_update_alerts': True,
            'order_alerts': True,
            'qc_status_alerts': True
        }
        
    except Exception as e:
        print(f"Error fetching notification preferences: {str(e)}")
        return {}

def send_contact_form(name, email, message):
    """
    Send contact form message to admin
    """
    admin_email = "coneco0516@gmail.com"
    subject = f"New Contact Form Submission from {name}"
    
    html_content = f"""
    <html>
        <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h2 style="color: #3498db; margin-top: 0;">New Contact Form Submission</h2>
                <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #3498db;">
                    <p style="margin: 0 0 10px 0;"><strong>From:</strong> {name}</p>
                    <p style="margin: 0;"><strong>Email:</strong> {email}</p>
                </div>
                <div style="padding: 10px 0;">
                    <p style="font-weight: bold; margin-bottom: 10px; color: #555;">Message:</p>
                    <div style="white-space: pre-wrap; line-height: 1.6; color: #333;">{message}</div>
                </div>
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                    <p style="color: #888; font-size: 12px; margin: 0;">
                        Submitted at: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
                    </p>
                </div>
            </div>
        </body>
    </html>
    """
    
    return send_email(admin_email, subject, html_content)


def send_contact_acknowledgment(name, email):
    """
    Send acknowledgment email to the user after contact form submission
    """
    html_content = f"""
    <html>
        <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h2 style="color: #2ecc71; margin-top: 0;">Thank You for Contacting Us!</h2>
                <p>Hello {name},</p>
                
                <p>We have received your message and our team is reviewing it. We will get back to you as soon as possible.</p>
                
                <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #2ecc71;">
                    <p style="margin: 0;"><strong>What happens next?</strong></p>
                    <ul style="color: #555; line-height: 1.8;">
                        <li>Our support team will review your message</li>
                        <li>You will receive a response via email</li>
                        <li>Typical response time: 24-48 hours</li>
                    </ul>
                </div>
                
                <p>If you have any urgent queries, feel free to reach us at <a href="mailto:coneco0516@gmail.com" style="color: #3498db;">coneco0516@gmail.com</a></p>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                    <p style="color: #888; font-size: 12px; margin: 0;">
                        &copy; {datetime.now().year} {APP_NAME}. This is an automated notification. Please don't reply to this email.
                    </p>
                </div>
            </div>
        </body>
    </html>
    """
    
    return send_email(email, f"{APP_NAME} - We Received Your Message", html_content)


def send_contact_reply(name, email, original_message, reply_message):
    """
    Send admin reply to a contact message as an official branded email
    """
    html_content = f"""
    <html>
        <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h2 style="color: #3498db; margin-top: 0;">Response from {APP_NAME} Support</h2>
                <p>Hello {name},</p>
                
                <p>Thank you for reaching out to us. Here is our response to your enquiry:</p>
                
                <div style="background-color: #eaf7ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3498db;">
                    <p style="font-weight: bold; margin-top: 0; color: #333;">Our Response:</p>
                    <div style="white-space: pre-wrap; line-height: 1.6; color: #333;">{reply_message}</div>
                </div>
                
                <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p style="font-weight: bold; margin-top: 0; color: #888; font-size: 0.9rem;">Your Original Message:</p>
                    <div style="white-space: pre-wrap; line-height: 1.5; color: #999; font-size: 0.9rem;">{original_message}</div>
                </div>
                
                <p>If you have further questions, feel free to reply to this email or contact us at <a href="mailto:coneco0516@gmail.com" style="color: #3498db;">coneco0516@gmail.com</a></p>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                    <p style="color: #888; font-size: 12px; margin: 0;">
                        &copy; {datetime.now().year} {APP_NAME}. All rights reserved.
                    </p>
                </div>
            </div>
        </body>
    </html>
    """
    
    return send_email(email, f"{APP_NAME} - Response to Your Enquiry", html_content)

    return send_email(email, f"{APP_NAME} - Response to Your Enquiry", html_content)
