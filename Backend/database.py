import psycopg2
from psycopg2 import pool
from psycopg2.extras import RealDictCursor
import os
from dotenv import load_dotenv

load_dotenv()

# PostgreSQL configuration
db_host = os.environ.get("DB_HOST", "localhost")
db_name = os.environ.get("DB_NAME", "postgres")
db_user = os.environ.get("DB_USER", "postgres")
db_pass = os.environ.get("DB_PASS", "")
db_port = os.environ.get("DB_PORT", "5432")

class PostgresPool:
    def __init__(self):
        self._pool = None
        self.initialize()

    def initialize(self):
        try:
            self._pool = psycopg2.pool.SimpleConnectionPool(
                1, 20,
                user=db_user,
                password=db_pass,
                host=db_host,
                port=db_port,
                database=db_name
            )
            print("PostgreSQL connection pool initialized.")
        except Exception as e:
            print(f"Error initializing PostgreSQL connection pool: {e}")

    def get_connection(self):
        if self._pool is None:
            self.initialize()
        
        conn = self._pool.getconn()
        
        # Wrap the connection to handle pooling 'close' behavior
        # and monkey patch cursor to support 'dictionary=True'
        original_close = conn.close
        original_cursor = conn.cursor
        pool_ref = self._pool

        def wrapped_close():
            if pool_ref and conn:
                try:
                    pool_ref.putconn(conn)
                except Exception as e:
                    print(f"Error returning connection to pool: {e}")
                    original_close()
            else:
                original_close()

        def compat_cursor(dictionary=False, **kwargs):
            if dictionary:
                return original_cursor(cursor_factory=RealDictCursor, **kwargs)
            return original_cursor(**kwargs)
        
        conn.close = wrapped_close
        conn.cursor = compat_cursor
        return conn

_pool_manager = PostgresPool()

def get_db_connection():
    return _pool_manager.get_connection()

def release_db_connection(conn):
    # Now that we've wrapped conn.close(), we can just call it
    if conn:
        conn.close()
