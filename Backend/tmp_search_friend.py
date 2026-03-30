import mysql.connector
import os
from dotenv import load_dotenv

load_dotenv()

dbconfig = {
    "database": os.environ.get("DB_NAME"),
    "user": os.environ.get("DB_USER"),
    "password": os.environ.get("DB_PASS"),
    "host": os.environ.get("DB_HOST"),
    "port": int(os.environ.get("DB_PORT", 3306))
}

def search_text():
    try:
        conn = mysql.connector.connect(**dbconfig)
        cursor = conn.cursor()
        
        cursor.execute("SHOW TABLES")
        tables = [t[0] for t in cursor.fetchall()]
        
        for table in tables:
            # For simplicity, we search in all columns if they are strings
            cursor.execute(f"DESCRIBE {table}")
            columns = [c[0] for c in cursor.fetchall() if "char" in c[1].lower() or "text" in c[1].lower()]
            if not columns: continue
            
            where_clause = " OR ".join([f"{col} LIKE '%tmarennavar093%'" for col in columns])
            query = f"SELECT * FROM {table} WHERE {where_clause}"
            try:
                cursor.execute(query)
                results = cursor.fetchall()
                if results:
                    print(f"Found in {table}: {results}")
            except:
                pass
                
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    search_text()
