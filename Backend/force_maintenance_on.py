from database import get_db_connection

def set_maintenance(active=True):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        val = 'true' if active else 'false'
        cursor.execute("""
            INSERT INTO platform_settings (setting_key, setting_value)
            VALUES ('server_maintenance_mode', %s)
            ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)
        """, (val,))
        conn.commit()
        print(f"Maintenance mode set to: {val}")
        cursor.close()
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    set_maintenance(True)
