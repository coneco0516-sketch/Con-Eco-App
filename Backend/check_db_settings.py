from database import get_db_connection

def check_settings():
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM platformsettings")
        rows = cursor.fetchall()
        print("PLATFORM SETTINGS IN DB:")
        for row in rows:
            print(f"{row['setting_key']}: {row['setting_value']} (Updated at: {row['updated_at']})")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    check_settings()
