#!/usr/bin/env python
"""
Extract data from SIAK PostgreSQL and CSV and upload to MinIO

This script extracts data from:
1. PostgreSQL tables (using siak_pool connection with CDC support)
2. Attendance CSV file

Then uploads the data to MinIO in the /raw/ bucket with appropriate structure.

Additional Features:
- Change Data Capture (CDC) integration for efficient incremental updates
- Metadata checkpoint management for tracking extraction progress
- Avoids full table scans by using logical replication tracking
"""

import os
import pandas as pd
import json
import logging
import psycopg2
import psycopg2.extras
from io import BytesIO, StringIO
from datetime import datetime
from dotenv import load_dotenv
import sys
import os
from typing import Dict, List, Optional, Tuple, Any

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import the database connection pool
from data_sources.siak_pool import get_db_connection

# Import the MinIO client
from data_sources.minio_client import get_minio_client

# Import helper functions
from scripts.helper.checkpoint_manager import (
    get_latest_extraction_info, update_extraction_checkpoint,
    create_extraction_info, get_latest_cdc_lsn
)

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO, 
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger('extract_to_minio')


def get_table_schema(conn, table_name: str) -> List[str]:
    """
    Get the column names for a table without executing SELECT *
    
    Args:
        conn: Database connection
        table_name: Name of the table
        
    Returns:
        List of column names
    """
    try:
        with conn.cursor() as cursor:
            # Use information_schema to get columns - far more efficient than SELECT *
            query = """
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_schema = 'public' AND table_name = %s 
                ORDER BY ordinal_position
            """
            cursor.execute(query, (table_name,))
            columns = [row[0] for row in cursor.fetchall()]
            
            if not columns:
                logger.warning(f"No columns found for table {table_name}")
                return []
                
            return columns
    except Exception as e:
        logger.error(f"Error getting schema for {table_name}: {str(e)}")
        return []


def get_current_lsn(conn) -> Optional[str]:
    """Get the current WAL LSN from PostgreSQL"""
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT pg_current_wal_lsn()::text")
            result = cursor.fetchone()
            if result and result[0]:
                return result[0]
    except Exception as e:
        logger.error(f"Error getting current LSN: {str(e)}")
    return None


def get_cdc_data(conn, minio_client, slot_name='siak_cdc_slot') -> Tuple[Dict[str, Dict], Optional[str]]:
    """
    Get CDC data from PostgreSQL using the CDC replication slot, starting from the last checkpoint
    
    Args:
        conn: Database connection
        minio_client: MinIO client to get the last checkpoint LSN
        slot_name: Name of the CDC replication slot
        
    Returns:
        Tuple of (changes_info, current_lsn)
    """
    changes_info = {}
    current_lsn = None
    
    try:
        # Get the last LSN from checkpoint
        last_lsn = get_latest_cdc_lsn(minio_client)
        
        with conn.cursor() as cursor:
            # Check if CDC is properly set up
            cursor.execute("SELECT 1 FROM pg_replication_slots WHERE slot_name = %s", (slot_name,))
            if cursor.fetchone() is None:
                logger.warning(f"CDC slot '{slot_name}' not found. CDC might not be set up correctly.")
                return changes_info, None
            
            # Get current LSN for this checkpoint
            current_lsn = get_current_lsn(conn)
            
            # Get changes from CDC using the last LSN if available (incremental)
            if last_lsn:
                logger.info(f"Getting CDC changes from LSN {last_lsn}")
                cursor.execute("SELECT * FROM get_cdc_changes(%s, %s, 10000)", (slot_name, last_lsn))
            else:
                # First run or no last LSN available
                logger.info("No previous LSN found, getting recent CDC changes (limited to 1000 rows)")
                cursor.execute("SELECT * FROM get_cdc_changes(%s, NULL, 1000)", (slot_name,))
                
            changes = cursor.fetchall()
            
            if not changes:
                logger.info("No changes detected in CDC log.")
                return changes_info, current_lsn
            
            # Track affected tables and primary keys  
            for change_row in changes:
                change = change_row[0]  # The JSON object
                change_data = change.get('change', {})
                
                if isinstance(change_data, str):
                    import json
                    change_data = json.loads(change_data)
                
                # Extract table name and change type
                table_name = change_data.get('table')
                change_type = change_data.get('kind')  # insert, update, delete
                
                if not table_name:
                    continue
                
                # Initialize table entry if not exists
                if table_name not in changes_info:
                    changes_info[table_name] = {
                        'affected_ids': set(),
                        'operations': {'insert': 0, 'update': 0, 'delete': 0}
                    }
                
                # Count by operation type
                op = change_type or 'unknown'
                if op in changes_info[table_name]['operations']:
                    changes_info[table_name]['operations'][op] += 1
                
                # Track primary key/id values that were changed
                if change_type in ('insert', 'update', 'delete'):
                    # Try to get id or primary key
                    if 'columnvalues' in change_data and 'id' in change_data['columnvalues']:
                        changes_info[table_name]['affected_ids'].add(change_data['columnvalues']['id'])
                    elif 'oldkeys' in change_data and 'keyvalues' in change_data['oldkeys']:
                        # For composite keys, we join them
                        key_values = change_data['oldkeys']['keyvalues']
                        if isinstance(key_values, list) and len(key_values) > 0:
                            changes_info[table_name]['affected_ids'].add(str(key_values[0]))
        
        # Convert sets to lists for JSON serialization
        for table_name in changes_info:
            changes_info[table_name]['affected_ids'] = list(changes_info[table_name]['affected_ids'])
            
        logger.info(f"Detected changes in {len(changes_info)} tables via CDC")
        return changes_info, current_lsn
    
    except Exception as e:
        logger.error(f"Error fetching CDC data: {str(e)}")
        return changes_info, None


def extract_from_postgres_to_minio(minio_client):
    """Extract data from PostgreSQL tables and upload to MinIO using CDC when available"""
    # Bucket for raw data
    raw_bucket = "raw"
    
    # Tables to extract
    tables = [
        "faculties", "programs", "students", "lecturers", 
        "courses", "semesters", "class_schedules", 
        "registrations", "grades", "semester_fees",
        "academic_records"
    ]
    
    # Timestamp for this extraction
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    base_path = f"postgres/{timestamp}"
    
    # Get information about the latest extraction
    latest_extraction = get_latest_extraction_info(minio_client)
    
    # Initialize extraction info for current run
    current_extraction = create_extraction_info(base_path)
    
    # Get a connection from the pool
    with get_db_connection() as conn:
        # First check for CDC changes, passing minio_client for LSN tracking
        cdc_changes, current_lsn = get_cdc_data(conn, minio_client)
        has_cdc_changes = len(cdc_changes) > 0
        
        # Log CDC status
        if has_cdc_changes:
            logger.info(f"Using CDC for incremental extraction. Changes detected in {len(cdc_changes)} tables.")
        else:
            logger.info("No CDC changes detected. Falling back to full table extraction.")
        
        cursor = conn.cursor()
        
        # Create a manifest to track extracted files
        manifest = {
            "extraction_time": datetime.now().isoformat(),
            "extraction_type": "cdc" if has_cdc_changes else "full",
            "source": "postgresql",
            "tables": {}
        }
        
        # Handle each table
        for table in tables:
            # Get columns for this table first without SELECT *
            columns = get_table_schema(conn, table)
            if not columns:
                logger.warning(f"Skipping {table} - could not retrieve schema")
                continue
                
            # Build proper column list for query
            column_list = ", ".join([f"\"{col}\"" for col in columns])
            
            # Check if table has CDC changes
            if has_cdc_changes and table in cdc_changes:
                changes_info = cdc_changes[table]
                affected_ids = changes_info.get('affected_ids', [])
                operations = changes_info.get('operations', {})
                
                logger.info(f"Extracting CDC changes for {table} from PostgreSQL. {len(affected_ids)} records affected.")
                
                if affected_ids:
                    # Efficient query - only get affected rows by ID
                    # Convert list to tuple for SQL IN clause
                    id_params = tuple(affected_ids) if len(affected_ids) > 1 else f"('{affected_ids[0]}')" 
                    
                    # Query with specific columns and ID filter
                    query = f"SELECT {column_list} FROM {table} WHERE id IN %s"
                    cursor.execute(query, (id_params,))
                    data = cursor.fetchall()
                    df = pd.DataFrame(data, columns=columns)
                    
                    # Get total count separately (more efficient)
                    cursor.execute(f"SELECT COUNT(*) FROM {table}")
                    count = cursor.fetchone()[0]
                else:
                    # No specific IDs but table was affected
                    # Still use column selection rather than SELECT *
                    query = f"SELECT {column_list} FROM {table}"
                    cursor.execute(query)
                    data = cursor.fetchall()
                    df = pd.DataFrame(data, columns=columns)
                    count = len(df)
                
                # Add CDC info to manifest
                cdc_info = {
                    "affected_records": len(affected_ids),
                    "operations": operations
                }
            else:
                # Standard extraction with specific columns
                logger.info(f"Extracting {table} from PostgreSQL...")
                
                # Query to get count
                cursor.execute(f"SELECT COUNT(*) FROM {table}")
                count = cursor.fetchone()[0]
                
                # If table is very large, consider sampling or limiting
                if count > 100000:  # Arbitrary threshold
                    logger.warning(f"Large table detected: {table} has {count} rows. Consider implementing pagination.")
                    
                # Query with specific columns
                query = f"SELECT {column_list} FROM {table}"
                cursor.execute(query)
                data = cursor.fetchall()
                df = pd.DataFrame(data, columns=columns)
                
                # No CDC info for this table
                cdc_info = None
            
            # Convert DataFrame to CSV
            csv_buffer = BytesIO()
            df.to_csv(csv_buffer, index=False)
            csv_buffer.seek(0)
            
            # Path in MinIO
            object_name = f"{base_path}/{table}.csv"
            
            # Upload to MinIO
            minio_client.put_object(
                bucket_name=raw_bucket,
                object_name=object_name, 
                data=csv_buffer,
                length=len(csv_buffer.getvalue()),
                content_type="text/csv"
            )
            
            # Update manifest
            manifest_entry = {
                "record_count": count,
                "columns": columns,
                "path": object_name
            }
            
            # Add CDC info if available
            if cdc_info:
                manifest_entry["cdc"] = cdc_info
            
            manifest["tables"][table] = manifest_entry
            
            # Update current extraction info
            current_extraction["tables"][table] = {
                "record_count": count,
                "path": object_name
            }
            
            logger.info(f"Uploaded {table} ({count} records) to MinIO: {object_name}")
        
        # Create manifest and save extraction info
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        extraction_manifest = {
            'timestamp': timestamp,
            'source': 'postgresql',
            'cdc_enabled': has_cdc_changes,
            'tables_extracted': list(manifest["tables"].keys()),
            'current_lsn': current_lsn,
            'record_counts': {table: info['record_count'] for table, info in manifest["tables"].items()}
        }
        
        # Upload manifest
        manifest_data = json.dumps(extraction_manifest, indent=2).encode('utf-8')
        object_name = f"postgres/{timestamp}/_manifest.json"
        
        minio_client.put_object(
            "raw", 
            object_name, 
            BytesIO(manifest_data), 
            len(manifest_data),
            content_type="application/json"
        )
        
        logger.info(f"Uploaded extraction manifest to MinIO: {object_name}")
        
        # Update checkpoint
        current_extraction = create_extraction_info(f"postgres/{timestamp}")
        current_extraction['cdc'] = {
            'last_lsn': current_lsn,
            'timestamp': datetime.now().isoformat()
        }
        
        # Pemanggilan fungsi dengan 2 argumen sesuai definisi di checkpoint_manager.py
        update_extraction_checkpoint(minio_client, current_extraction)
        
        # Log completion dengan proteksi jika latest_extraction None
        prev_time = 'unknown'
        if latest_extraction:
            prev_time = latest_extraction.get('timestamp', 'unknown')
        
        logger.info(f"Extraction complete. Previous: {prev_time}, Current: {timestamp}")

def extract_attendance_to_minio(minio_client, attendance_csv_path):
    """Extract attendance data from CSV and upload to MinIO"""
    # Bucket for raw data
    raw_bucket = "raw"
    
    logger.info(f"Extracting attendance data from CSV: {attendance_csv_path}")
    
    if not os.path.exists(attendance_csv_path):
        logger.error(f"Attendance CSV file not found at {attendance_csv_path}")
        return False
    
    # Timestamp for this extraction
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    # Read CSV file
    attendance_df = pd.read_csv(attendance_csv_path)
    record_count = len(attendance_df)
    
    # Convert to CSV (in memory)
    csv_buffer = BytesIO()
    attendance_df.to_csv(csv_buffer, index=False)
    csv_buffer.seek(0)
    
    # Upload to MinIO
    object_name = f"csv/{timestamp}/attendance.csv"
    
    minio_client.put_object(
        bucket_name=raw_bucket,
        object_name=object_name, 
        data=csv_buffer,
        length=csv_buffer.getbuffer().nbytes,
        content_type="text/csv"
    )
    
    # Create and upload manifest
    manifest = {
        "extraction_time": datetime.now().isoformat(),
        "source": "csv",
        "file": "attendance.csv",
        "record_count": record_count,
        "columns": attendance_df.columns.tolist(),
        "path": object_name
    }
    
    manifest_json = json.dumps(manifest, indent=2)
    manifest_bytes = BytesIO(manifest_json.encode('utf-8'))
    
    minio_client.put_object(
        bucket_name=raw_bucket,
        object_name=f"csv/{timestamp}/_manifest.json", 
        data=manifest_bytes,
        length=len(manifest_json),
        content_type="application/json"
    )
    
    logger.info(f"Uploaded attendance data ({record_count} records) to MinIO: {object_name}")
    logger.info(f"Uploaded attendance manifest to MinIO: csv/{timestamp}/_manifest.json")
    
    return True

def ensure_buckets_exist(bucket_names):
    """
    Ensure that the specified buckets exist in MinIO, create them if they don't
    
    Args:
        bucket_names: List of bucket names to check/create
        
    Returns:
        None
    """
    minio_client = get_minio_client()
    
    for bucket in bucket_names:
        # Check if bucket exists
        try:
            if not minio_client.bucket_exists(bucket):
                logger.info(f"Creating bucket: {bucket}")
                minio_client.make_bucket(bucket)
                logger.info(f"Bucket created: {bucket}")
            else:
                logger.info(f"Bucket already exists: {bucket}")
        except Exception as e:
            logger.error(f"Error checking/creating bucket {bucket}: {str(e)}")
            raise

def main():
    """Main function to extract data and upload to MinIO"""
    logger.info("Starting ETL process: Extract data and upload to MinIO with CDC support")
    
    # CDC automatically handles incremental extraction when changes are detected
    
    # Get MinIO client
    minio_client = get_minio_client()
    
    # Ensure buckets exist
    ensure_buckets_exist(["raw", "processed", "checkpoints"])
    
    # Extract from PostgreSQL and upload to MinIO
    logger.info("Extracting from PostgreSQL")
    extract_from_postgres_to_minio(minio_client)
    
    # Extract from attendance CSV and upload to MinIO
    logger.info("Extracting from Attendance CSV")
    attendance_csv_path = os.getenv('ATTENDANCE_CSV_PATH', 'data/attendance.csv')
    success = extract_attendance_to_minio(minio_client, attendance_csv_path)
    
    if success:
        logger.info("ETL Process completed successfully!")
    else:
        logger.error("ETL Process completed with errors.")

if __name__ == "__main__":
    main()
