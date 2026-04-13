import os
import mysql.connector
from mysql.connector import pooling
from dotenv import load_dotenv

load_dotenv()

# --- Railway MySQL Configuration ---
mysql_host = os.environ.get("MYSQLHOST", "caboose.proxy.rlwy.net")
mysql_port = int(os.environ.get("MYSQLPORT", 31353))
mysql_user = os.environ.get("MYSQLUSER", "root")
mysql_pass = os.environ.get("MYSQLPASSWORD", "XbRyzQaaWKiYnvEFBgXdWYhSruLGvPnA")
mysql_db = os.environ.get("MYSQLDATABASE", "railway")

# --- MySQL Connection Pool ---
try:
    mysql_pool = mysql.connector.pooling.MySQLConnectionPool(
        pool_name="coneco_pool",
        pool_size=10,
        host=mysql_host,
        port=mysql_port,
        user=mysql_user,
        password=mysql_pass,
        database=mysql_db
    )
    print("Railway MySQL connection pool initialized.")
except Exception as e:
    print(f"Error initializing Railway MySQL pool: {e}")
    mysql_pool = None

def get_db_connection():
    if mysql_pool:
        return mysql_pool.get_connection()
    raise RuntimeError("Railway MySQL connection pool is unavailable.")

def release_db_connection(conn):
    if conn:
        conn.close()
