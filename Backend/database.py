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

pool = None
pool_error = None

try:
    pool = mysql.connector.pooling.MySQLConnectionPool(pool_name="mypool", pool_size=5, **dbconfig)
except Exception as e:
    pool_error = str(e)
    print(f"Error initializing connection pool: {e}")

def get_db_connection():
    if pool is None:
        raise Exception(f"Pool not initialized. DB Error: {pool_error} | Config attempted: Host={dbconfig.get('host')}, User={dbconfig.get('user')}")
    return pool.get_connection()
