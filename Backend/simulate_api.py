import json
from database import get_db_connection

def simulate_admin_get():
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT setting_key, setting_value FROM platformsettings")
        rows = cursor.fetchall()
        settings = {}
        for row in rows:
            val = row['setting_value']
            # Convert to appropriate type
            if str(val).lower() == 'true': val = True
            elif str(val).lower() == 'false': val = False
            else:
                try: 
                    if '.' in str(val): val = float(val)
                    else: val = int(val)
                except: pass
            settings[row['setting_key']] = val
        
        print(json.dumps({"status": "success", "settings": settings}, indent=2))
    finally:
        conn.close()

if __name__ == "__main__":
    simulate_admin_get()
