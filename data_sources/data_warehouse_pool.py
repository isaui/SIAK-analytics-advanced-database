#!/usr/bin/env python
"""
Warehouse Database Connection Pool

Provides a thread-safe connection pool for the Warehouse PostgreSQL database.
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
logger = logging.getLogger('warehouse_pool')

# Load environment variables
load_dotenv()

# Default connection parameters
DEFAULT_CONFIG = {
    "host": os.getenv("WAREHOUSE_DB_HOST", "localhost"),
    "database": os.getenv("WAREHOUSE_DB_NAME", "siak_warehouse"),
    "user": os.getenv("WAREHOUSE_DB_USER", "warehouse_user"),
    "password": os.getenv("WAREHOUSE_DB_PASSWORD", "warehouse_password"),
    "port": os.getenv("WAREHOUSE_DB_PORT", 5432)
}

# Connection pool settings
MIN_CONNECTIONS = int(os.getenv("DB_MIN_CONNECTIONS", "1"))
MAX_CONNECTIONS = int(os.getenv("DB_MAX_CONNECTIONS", "10"))
MAX_RETRIES = int(os.getenv("DB_MAX_RETRIES", "3"))
RETRY_DELAY = int(os.getenv("DB_RETRY_DELAY", "2"))


class WarehouseConnectionPool:
    """Singleton connection pool for Warehouse PostgreSQL database"""
    _instance = None
    _pool = None
    _db_config = None
    
    def __new__(cls, db_config=None):
        if cls._instance is None:
            cls._instance = super(WarehouseConnectionPool, cls).__new__(cls)
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
            cls._pool.putconn(conn)
        except Exception as e:
            logger.error(f"Error returning connection to pool: {e}")


@contextmanager
def get_warehouse_connection():
    """Context manager for handling database connections"""
    conn = None
    try:
        conn = WarehouseConnectionPool().get_connection()
        yield conn
    finally:
        if conn is not None:
            WarehouseConnectionPool().release_connection(conn)


def execute_query(query: str, params: Optional[Tuple] = None, fetch_all: bool = True, fetch_none=False):
    """Execute a query and return the results as a list of dictionaries"""
    with get_warehouse_connection() as conn:
        with conn.cursor(cursor_factory=extras.RealDictCursor) as cursor:
            cursor.execute(query, params)
            if fetch_none:
                return None
            if fetch_all:
                return cursor.fetchall()
            return cursor.fetchone()


def execute_batch(query: str, params_list: List[Tuple], page_size: int = 1000):
    """Execute a batch operation and return the number of affected rows"""
    with get_warehouse_connection() as conn:
        with conn.cursor() as cursor:
            extras.execute_batch(cursor, query, params_list, page_size=page_size)
            conn.commit()
            return cursor.rowcount


def execute_values(query: str, params_list: List[Tuple], template: Optional[str] = None):
    """Execute a multi-value insert and return the number of inserted rows"""
    with get_warehouse_connection() as conn:
        with conn.cursor() as cursor:
            extras.execute_values(cursor, query, params_list, template=template)
            conn.commit()
            return cursor.rowcount


def execute_transaction(statements: List[Dict[str, Union[str, Tuple]]]):
    """
    Execute multiple statements in a single transaction
    
    Each statement in the list should be a dict with 'query' and 'params' keys
    Example: [{'query': 'INSERT INTO table VALUES (%s)', 'params': ('value',)}]
    
    Returns list of results from each statement
    """
    with get_warehouse_connection() as conn:
        with conn.cursor(cursor_factory=extras.RealDictCursor) as cursor:
            results = []
            try:
                for statement in statements:
                    query = statement['query']
                    params = statement.get('params')
                    cursor.execute(query, params)
                    if cursor.description:  # Has results to fetch
                        results.append(cursor.fetchall())
                    else:
                        results.append({'rowcount': cursor.rowcount})
                conn.commit()
                return results
            except Exception as e:
                conn.rollback()
                logger.error(f"Transaction failed, rolled back: {e}")
                raise