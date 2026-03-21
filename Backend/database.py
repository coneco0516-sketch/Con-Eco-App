import mysql.connector
from mysql.connector import pooling

import os
from dotenv import load_dotenv

load_dotenv()

dbconfig = {
    "database": os.environ.get("DB_NAME", "ConEcoDB"),
    "user": os.environ.get("DB_USER", "root"),
    "password": os.environ.get("DB_PASS", ""),
    "host": os.environ.get("DB_HOST", "localhost")
}

try:
    pool = mysql.connector.pooling.MySQLConnectionPool(pool_name="mypool", pool_size=5, **dbconfig)
except Exception as e:
    print(f"Error initializing connection pool: {e}")

def get_db_connection():
    return pool.get_connection()
