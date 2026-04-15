import os
import psycopg2
from psycopg2 import pool
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

load_dotenv()

# --- PostgreSQL Configuration (Neon/Render Compatible) ---
DATABASE_URL = os.environ.get("DATABASE_URL")

# --- PostgreSQL Connection Pool ---
class PostgreSQLPool:
    def __init__(self):
        self._pool = None
        if not DATABASE_URL:
            print("WARNING: DATABASE_URL not found in environment variables.")
            return

        try:
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
        if dictionary:
            return self._conn.cursor(cursor_factory=RealDictCursor)
        return self._conn.cursor()

    def commit(self):
        self._conn.commit()

    def rollback(self):
        self._conn.rollback()

    def close(self):
        if self._pool and self._conn:
            self._pool.putconn(self._conn)
            self._conn = None

    def __getattr__(self, name):
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

def get_platform_setting(key, default=None):
    """
    Common helper to fetch platform settings from the DB with type conversion.
    """
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT setting_value FROM platformsettings WHERE setting_key = %s", (key,))
        row = cursor.fetchone()
        if row:
            val = row['setting_value']
            if str(val).lower() == 'true': return True
            if str(val).lower() == 'false': return False
            try:
                if '.' in str(val): return float(val)
                return int(val)
            except:
                return val
        return default
    except Exception as e:
        print(f"Error fetching platform setting {key}: {e}")
        return default
    finally:
        conn.close()

def get_all_platform_settings():
    """
    Returns all platform settings as a dictionary.
    """
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        # Ensure table exists
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS platformsettings (
                setting_key VARCHAR(100) PRIMARY KEY,
                setting_value TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.commit()
        
        cursor.execute("SELECT setting_key, setting_value FROM platformsettings")
        rows = cursor.fetchall()
        settings = {}
        for row in rows:
            val = row['setting_value']
            if str(val).lower() == 'true': val = True
            elif str(val).lower() == 'false': val = False
            else:
                try:
                    if '.' in str(val): val = float(val)
                    else: val = int(val)
                except: pass
            settings[row['setting_key']] = val
        return settings
    except Exception as e:
        print(f"Error fetching all platform settings: {e}")
        return {}
    finally:
        conn.close()
