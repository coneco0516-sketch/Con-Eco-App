import os
import json
from database import get_db_connection
from pywebpush import webpush, WebPushException
from dotenv import load_dotenv

load_dotenv()

# Secure VAPID Keys (Generated specifically for ConEco)
# PUBLIC: BMWUGlFCX4gbzFvuIVv-C0l6xRNm2ymMTnd3-mQqoCwAC7TOkheENAnxhPqXJk-dLZq4DzSwd6lFVY_7QWcFBOM
# PRIVATE: eq-wTIxgAfDQF6O89K5AkqD9TEhAmtGDX2qoZq4Ewbk
VAPID_PUBLIC_KEY = os.environ.get("VAPID_PUBLIC_KEY", "BMWUGlFCX4gbzFvuIVv-C0l6xRNm2ymMTnd3-mQqoCwAC7TOkheENAnxhPqXJk-dLZq4DzSwd6lFVY_7QWcFBOM")
VAPID_PRIVATE_KEY = os.environ.get("VAPID_PRIVATE_KEY", "eq-wTIxgAfDQF6O89K5AkqD9TEhAmtGDX2qoZq4Ewbk")
VAPID_CLAIMS = {
    "sub": "mailto:admin@coneco.com"
}

def init_push_db():
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS user_push_subscriptions (
                id SERIAL PRIMARY KEY,
                user_id INT NOT NULL UNIQUE,
                subscription_json TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
        # PostgreSQL syntax for Upsert
        cursor.execute("""
            INSERT INTO user_push_subscriptions (user_id, subscription_json)
            VALUES (%s, %s)
            ON CONFLICT (user_id) DO UPDATE SET subscription_json = EXCLUDED.subscription_json
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
