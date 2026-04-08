import os
import json
from database import get_db_connection
from pywebpush import webpush, WebPushException
from dotenv import load_dotenv

load_dotenv()

# Secure VAPID Keys (Generated specifically for ConEco)
# PUBLIC: BAKkidll6rsBZNL1dNfVig
# PRIVATE: ZgpG_ypnYYCW96zBTKKjh...
VAPID_PUBLIC_KEY = os.environ.get("VAPID_PUBLIC_KEY", "BAKkidll6rsBZNL1dNfVigz42Ek26PhvKgMLJTj_aiRy6eH_rz")
VAPID_PRIVATE_KEY = os.environ.get("VAPID_PRIVATE_KEY", "ZgpG_ypnYYCW96zBTKKjhz42Ek26PhvKgMLJTj_aiRy6eH_rz")
VAPID_CLAIMS = {
    "sub": "mailto:admin@coneco.com"
}

def init_push_db():
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
            "icon": "/favicon.svg",
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
