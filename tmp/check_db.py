import mysql.connector
import os
from dotenv import load_dotenv

load_dotenv()

dbconfig = {
    "database": os.environ.get("DB_NAME", "ConEcoDB"),
    "user": os.environ.get("DB_USER", "root"),
    "password": os.environ.get("DB_PASS", ""),
    "host": os.environ.get("DB_HOST", "localhost"),
    "port": int(os.environ.get("DB_PORT", 3306))
}

try:
    conn = mysql.connector.connect(**dbconfig)
    cursor = conn.cursor()
    cursor.execute("DESCRIBE Users")
    columns = cursor.fetchall()
    for col in columns:
        print(col)
    cursor.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
