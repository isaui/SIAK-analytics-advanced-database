#!/usr/bin/env python
"""
Extract data from SIAK PostgreSQL and CSV and upload to MinIO

This script extracts data from:
1. PostgreSQL tables (using siak_pool connection)
2. Attendance CSV file

Then uploads the data to MinIO in the /raw/ bucket with appropriate structure.

Additional Features:
- Timestamped versioning for all extracted data
- Metadata manifests for tracking extraction information
- Organized storage structure in MinIO
"""

import os
import pandas as pd
import json
import logging
import psycopg2.extras
from io import BytesIO
from datetime import datetime
from dotenv import load_dotenv
import sys
import os
from typing import List

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import the database connection pool
from data_sources.siak_pool import get_db_connection

# Import the MinIO client
from data_sources.minio_client import get_minio_client

# Import helper functions
from scripts.helper.checkpoint_manager import (
    update_extraction_checkpoint,
    create_extraction_info
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





def extract_from_postgres_to_minio(minio_client):
    """Extract data from PostgreSQL tables and upload to MinIO with versioning"""
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
    
    # Determine which tables to extract
    tables_to_extract = set(tables)
    logger.info(f"Extracting all {len(tables_to_extract)} tables")
    
    # Get a connection from the pool
    with get_db_connection() as conn:
        cursor = conn.cursor()
        
        # Create a manifest to track extracted files
        manifest = {
            "extraction_time": datetime.now().isoformat(),
            "source": "postgresql",
            "tables": {}
        }
        
        # Handle each table
        for table in tables_to_extract:
            # Get columns for this table first without SELECT *
            columns = get_table_schema(conn, table)
            if not columns:
                logger.warning(f"Skipping {table} - could not retrieve schema")
                continue
                
            # Build proper column list for query
            column_list = ", ".join([f"\"{col}\"" for col in columns])
            
            # Query with specific columns
            query = f"SELECT {column_list} FROM {table}"
            cursor.execute(query)
            data = cursor.fetchall()
            df = pd.DataFrame(data, columns=columns)
            
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
                "record_count": len(df),
                "columns": columns,
                "path": object_name
            }
            manifest["tables"][table] = manifest_entry
            
            logger.info(f"Uploaded {table} ({len(df)} records) to MinIO: {object_name}")
        
        # Create manifest and save extraction info
        extraction_manifest = {
            'timestamp': timestamp,
            'source': 'postgresql',
            'tables_extracted': list(manifest["tables"].keys()),
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
    logger.info("Starting process: Extract data and upload to MinIO Raw")
    
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
