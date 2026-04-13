import os
import psycopg2
from psycopg2 import pool
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

load_dotenv()

# --- PostgreSQL Configuration (Neon/Render Compatible) ---
# DATABASE_URL should be set in the environment or .env file
DATABASE_URL = os.environ.get("DATABASE_URL")

# --- PostgreSQL Connection Pool ---
class PostgreSQLPool:
    def __init__(self):
        self._pool = None
        if not DATABASE_URL:
            print("WARNING: DATABASE_URL not found in environment variables.")
            return

        try:
            # Using ThreadedConnectionPool for FastAPI (async/multi-threaded)
            # Neon recommends using the -pooler connection string which the user provided
            self._pool = psycopg2.pool.ThreadedConnectionPool(
                minconn=1,
                maxconn=20,
                dsn=DATABASE_URL
            )
            print("PostgreSQL connection pool initialized with Neon/Render.")
        except Exception as e:
            print(f"Error initializing PostgreSQL pool: {e}")
            self._pool = None

    def get_connection(self):
        if not self._pool:
            # Attempt to re-initialize if pool is missing (e.g. env var was set late)
            self.__init__()
            if not self._pool:
                raise RuntimeError("PostgreSQL connection pool is unavailable. Check your DATABASE_URL.")
        
        try:
            conn = self._pool.getconn()
            return PooledConnection(conn, self._pool)
        except Exception as e:
            print(f"Error getting connection from pool: {e}")
            raise

class PooledConnection:
    def __init__(self, conn, pool):
        self._conn = conn
        self._pool = pool

    def cursor(self, dictionary=False):
        # RealDictCursor makes results behave like dictionaries (compatible with previous MySQL logic)
        if dictionary:
            return self._conn.cursor(cursor_factory=RealDictCursor)
        return self._conn.cursor()

    def commit(self):
        self._conn.commit()

    def rollback(self):
        self._conn.rollback()

    def close(self):
        if self._pool and self._conn:
            # Returns the connection back to the pool instead of closing the physical connection
            self._pool.putconn(self._conn)
            self._conn = None

    def __getattr__(self, name):
        # Proxy other attributes to the underlying psycopg2 connection
        return getattr(self._conn, name)

# Global pool instance
_pg_pool_wrapper = PostgreSQLPool()

def get_db_connection():
    """Returns a pooled connection object."""
    return _pg_pool_wrapper.get_connection()

def release_db_connection(conn):
    """Explicitly releases a connection back to the pool."""
    if conn:
        conn.close()
