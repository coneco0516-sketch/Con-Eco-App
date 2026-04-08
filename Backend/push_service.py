import os
import json
from database import get_db_connection
from pywebpush import webpush, WebPushException
from dotenv import load_dotenv

load_dotenv()

# Generate your VAPID keys if they don't exist
# vapid_keys = vapid.generate_vapid_keys()
VAPID_PUBLIC_KEY = os.environ.get("VAPID_PUBLIC_KEY", "BFA_O8W5_zD_2_yB_Z_8_Y_2_z_Y_8_Y_2_z_Y_8_Y_2_z_Y_8_Y_2_z_Y")
VAPID_PRIVATE_KEY = os.environ.get("VAPID_PRIVATE_KEY", "YOUR_PRIVATE_KEY_HERE")
VAPID_CLAIMS = {
    "sub": "mailto:admin@coneco.com"
}

def init_push_db():
    """Ensure the push notification tables exist."""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS user_push_subscriptions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                subscription_json TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY idx_user_id (user_id)
            )
        """)
        conn.commit()
        cursor.close()
    finally:
        conn.close()

def save_push_subscription(user_id, subscription_data):
    """Save or update a user's push subscription."""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO user_push_subscriptions (user_id, subscription_json)
            VALUES (%s, %s)
            ON DUPLICATE KEY UPDATE subscription_json = VALUES(subscription_json)
        """, (user_id, json.dumps(subscription_data)))
        conn.commit()
        cursor.close()
    finally:
        conn.close()

def send_push_notification(user_id, title, message, url="/"):
    """Send a push notification to a specific user's browser."""
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT subscription_json FROM user_push_subscriptions WHERE user_id = %s", (user_id,))
        row = cursor.fetchone()
        if not row:
            return False
            
        subscription_info = json.loads(row['subscription_json'])
        payload = {
            "title": title,
            "body": message,
            "icon": "/logo192.png",
            "data": {"url": url}
        }
        
        try:
            webpush(
                subscription_info=subscription_info,
                data=json.dumps(payload),
                vapid_private_key=VAPID_PRIVATE_KEY,
                vapid_claims=VAPID_CLAIMS
            )
            return True
        except WebPushException as ex:
            print(f"Push Notification Error: {ex}")
            return False
    finally:
        conn.close()

if __name__ == "__main__":
    init_push_db()
    print("Push notification database initialized.")
