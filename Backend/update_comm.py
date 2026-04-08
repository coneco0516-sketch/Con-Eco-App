from database import get_db_connection

def update_commission():
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO platform_settings (setting_key, setting_value) 
            VALUES ('service_commission_pct', '3'), ('product_commission_pct', '3')
            ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)
        """)
        conn.commit()
        print("Successfully updated platform commission to 3% for both Products and Services.")
    except Exception as e:
        print(f"Error updating commission: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    update_commission()
