import os
from database import get_db_connection

def check_email_logs():
    print("Checking email_logs table...")
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Check if table exists first
        cursor.execute("SHOW TABLES LIKE 'email_logs'")
        if not cursor.fetchone():
            print("Table 'email_logs' does not exist yet. This means no email attempts have been logged since the update.")
            return

        cursor.execute("SELECT * FROM email_logs ORDER BY created_at DESC LIMIT 10")
        logs = cursor.fetchall()
        
        if not logs:
            print("No email logs found in the table.")
        else:
            print(f"Found {len(logs)} recent logs:")
            for log in logs:
                print(f"ID: {log['id']} | To: {log['to_email']} | Subject: {log['subject']} | Status: {log['status']} | Time: {log['created_at']}")
                if log['error_message']:
                    print(f"   - Error: {log['error_message']}")
        
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"ERROR: {str(e)}")

if __name__ == "__main__":
    check_email_logs()
