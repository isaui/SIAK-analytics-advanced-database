#!/usr/bin/env python
"""
SIAK Database Connection Pool

Provides a thread-safe connection pool for the SIAK PostgreSQL database.
Implements Singleton pattern to ensure only one pool exists across the application.
"""

import os
import time
import logging
from contextlib import contextmanager
from typing import List, Tuple, Dict, Any, Optional, Union

import psycopg2
from psycopg2 import pool, extras
from psycopg2.extensions import connection as pg_connection
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger('siak_pool')

# Load environment variables
load_dotenv()

# Default connection parameters
DEFAULT_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": int(os.getenv("DB_PORT", "5432")),
    "database": os.getenv("DB_NAME", "siak"),
    "user": os.getenv("DB_USER", "siak"),
    "password": os.getenv("DB_PASSWORD", "siak_password")
}

# Connection pool settings
MIN_CONNECTIONS = int(os.getenv("DB_MIN_CONNECTIONS", "1"))
MAX_CONNECTIONS = int(os.getenv("DB_MAX_CONNECTIONS", "10"))
MAX_RETRIES = int(os.getenv("DB_MAX_RETRIES", "3"))
RETRY_DELAY = int(os.getenv("DB_RETRY_DELAY", "2"))


class SiakConnectionPool:
    """Singleton connection pool for SIAK PostgreSQL database"""
    _instance = None
    _pool = None
    _db_config = None
    
    def __new__(cls, db_config=None):
        if cls._instance is None:
            cls._instance = super(SiakConnectionPool, cls).__new__(cls)
            cls._db_config = db_config or DEFAULT_CONFIG
            cls._create_pool()
        return cls._instance
    
    @classmethod
    def _create_pool(cls):
        """Create the connection pool"""
        try:
            # Close existing pool if it exists
            if cls._pool is not None:
                cls._pool.closeall()
                logger.info("Closed existing connection pool")
            
            # Create new pool
            cls._pool = pool.ThreadedConnectionPool(
                minconn=MIN_CONNECTIONS,
                maxconn=MAX_CONNECTIONS,
                **cls._db_config
            )
            logger.info(f"Created new connection pool (min={MIN_CONNECTIONS}, max={MAX_CONNECTIONS})")
        except psycopg2.Error as e:
            logger.error(f"Failed to create connection pool: {e}")
            raise
    
    @classmethod
    def get_connection(cls, retry=0):
        """Get a connection from the pool with retry logic"""
        try:
            conn = cls._pool.getconn()
            # Test connection validity
            cursor = conn.cursor()
            cursor.execute("SELECT 1")
            cursor.close()
            return conn
        except (psycopg2.Error, AttributeError) as e:
            if retry < MAX_RETRIES:
                logger.warning(f"Connection error (retry {retry+1}/{MAX_RETRIES}): {e}")
                time.sleep(RETRY_DELAY)
                # Pool might be closed or invalid, recreate it
                if retry == 0:
                    cls._create_pool()
                return cls.get_connection(retry + 1)
            else:
                logger.error(f"Failed to get connection after {MAX_RETRIES} retries")
                raise
    
    @classmethod
    def release_connection(cls, conn):
        """Return a connection to the pool"""
        try:
            # Rollback any uncommitted transactions
            if conn.status != psycopg2.extensions.STATUS_READY:
                conn.rollback()
                logger.debug("Rolled back uncommitted transaction")
            
            cls._pool.putconn(conn)
        except (psycopg2.Error, AttributeError) as e:
            logger.error(f"Error releasing connection: {e}")
            # Try to recreate the pool on serious errors
            if isinstance(e, AttributeError) or "connection is closed" in str(e):
                cls._create_pool()


@contextmanager
def get_db_connection():
    """Context manager for handling database connections"""
    conn = None
    try:
        conn = SiakConnectionPool().get_connection()
        yield conn
    finally:
        if conn is not None:
            SiakConnectionPool().release_connection(conn)


def execute_query(query: str, params: Optional[Tuple] = None, fetch_all: bool = True) -> List[Dict]:
    """Execute a query and return the results as a list of dictionaries"""
    with get_db_connection() as conn:
        with conn.cursor(cursor_factory=extras.RealDictCursor) as cursor:
            cursor.execute(query, params)
            if fetch_all:
                return cursor.fetchall()
            else:
                return cursor.fetchone()


def execute_batch(query: str, params_list: List[Tuple], page_size: int = 1000) -> int:
    """Execute a batch operation and return the number of affected rows"""
    with get_db_connection() as conn:
        with conn.cursor() as cursor:
            extras.execute_batch(cursor, query, params_list, page_size=page_size)
            conn.commit()
            return cursor.rowcount


def execute_values(query: str, params_list: List[Tuple], template: Optional[str] = None) -> int:
    """Execute a multi-value insert and return the number of inserted rows"""
    with get_db_connection() as conn:
        with conn.cursor() as cursor:
            extras.execute_values(cursor, query, params_list, template=template)
            conn.commit()
            return cursor.rowcount


def execute_transaction(statements: List[Dict[str, Union[str, Tuple]]]) -> bool:
    """Execute multiple statements in a single transaction
    
    Each statement in the list should be a dict with 'query' and 'params' keys
    Example: [{'query': 'INSERT INTO table VALUES (%s)', 'params': ('value',)}]
    """
    with get_db_connection() as conn:
        try:
            with conn.cursor() as cursor:
                for statement in statements:
                    cursor.execute(statement['query'], statement.get('params'))
                conn.commit()
                return True
        except Exception as e:
            conn.rollback()
            logger.error(f"Transaction failed: {e}")
            return False