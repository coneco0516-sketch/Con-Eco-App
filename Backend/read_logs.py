from database import get_db_connection
conn = get_db_connection()
cursor = conn.cursor(dictionary=True)
cursor.execute("SELECT id, to_email, subject, status, error_message, created_at FROM email_logs ORDER BY created_at DESC LIMIT 5")
for r in cursor.fetchall():
    print(f"ID:{r['id']} | Status:{r['status']} | Time:{r['created_at']}")
    print(f"  Error: {r['error_message']}")
cursor.close()
conn.close()
