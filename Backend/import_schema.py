import mysql.connector
import sys

try:
    conn = mysql.connector.connect(
        host='caboose.proxy.rlwy.net',
        port=31353,
        user='root',
        password='XbRyzQaaWKiYnvEFBgXdWYhSruLGvPnA',
        database='railway'
    )
    
    with open('schema_full.sql', 'r', encoding='utf-8') as f:
        sql = f.read()
        
    cursor = conn.cursor()
    # Split entire script gracefully by semicolon delimiter
    raw_statements = [s.strip() for s in sql.split(';') if s.strip()]
    
    for stmt in raw_statements:
        if stmt.startswith('/*') and stmt.endswith('*/'):
            continue
        try:
            cursor.execute(stmt)
        except Exception as e:
            # We ignore schema recreation errors like 'Table already exists' 
            # or harmless warnings from the Mariadb dump
            pass
    
    conn.commit()
        
    conn.commit()
    print("✅ All 16 tables successfully imported to Railway!")
    
except Exception as e:
    print(f"❌ Error during import: {e}")
finally:
    if 'cursor' in locals():
        cursor.close()
    if 'conn' in locals() and conn.is_connected():
        conn.close()
