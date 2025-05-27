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
from io import BytesIO
from datetime import datetime
from dotenv import load_dotenv
import sys
from typing import List

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import the database connection pool
from data_sources.siak_pool import get_db_connection

# Import the MinIO client
from data_sources.minio_client import get_minio_client

# Import MinIO utilities
from scripts.helper.utils.minio_utils import (
    ensure_buckets_exist,
    upload_dataframe_to_minio,
    upload_json_to_minio,
    generate_timestamp
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


def extract_from_postgres_to_minio(minio_client, timestamp):
    """Extract data from PostgreSQL tables and upload to MinIO with versioning"""
    # Bucket for raw data
    raw_bucket = "raw"
    
    # Tables to extract
    tables = [
        "faculties", "programs", "students", "lecturers", 
        "courses", "semesters", "class_schedules", "rooms",
        "registrations", "grades", "semester_fees",
        "academic_records"
    ]
    
    # Base path with timestamp
    base_path = f"{timestamp}/postgres"
    
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
            
            # Path in MinIO
            object_name = f"{base_path}/{table}.parquet"
            
            # Upload to MinIO using helper function
            success = upload_dataframe_to_minio(
                minio_client=minio_client,
                df=df,
                bucket_name=raw_bucket,
                object_name=object_name,
                format='parquet'
            )
            
            if not success:
                logger.error(f"Failed to upload {table} to MinIO")
                continue
            
            # Update manifest
            manifest_entry = {
                "record_count": len(df),
                "columns": columns,
                "path": object_name
            }
            manifest["tables"][table] = manifest_entry
            
            logger.info(f"Uploaded {table} to MinIO: {len(df)} records")
        
        # Create manifest and save extraction info
        extraction_manifest = {
            'timestamp': timestamp,
            'source': 'postgresql',
            'tables_extracted': list(manifest["tables"].keys()),
            'record_counts': {table: info['record_count'] for table, info in manifest["tables"].items()}
        }
        
        # Upload manifest
        manifest_data = json.dumps(extraction_manifest, indent=2).encode('utf-8')
        object_name = f"{base_path}/_manifest.json"
        
        minio_client.put_object(
            "raw", 
            object_name, 
            BytesIO(manifest_data), 
            len(manifest_data),
            content_type="application/json"
        )
        
        logger.info(f"Uploaded extraction manifest to MinIO: {object_name}")
        logger.info(f"PostgreSQL extraction complete. Timestamp: {timestamp}")

def extract_attendance_to_minio(minio_client, attendance_csv_path, timestamp):
    """Extract attendance data from CSV and upload to MinIO"""
    # Bucket for raw data
    raw_bucket = "raw"
    
    logger.info(f"Extracting attendance data from CSV: {attendance_csv_path}")
    
    if not os.path.exists(attendance_csv_path):
        logger.error(f"Attendance CSV file not found at {attendance_csv_path}")
        return False
    
    # Read CSV file
    attendance_df = pd.read_csv(attendance_csv_path)
    record_count = len(attendance_df)
    
    # Upload to MinIO with common timestamp folder
    object_name = f"{timestamp}/attendance/attendance.parquet"
    
    # Upload to MinIO using helper function
    success = upload_dataframe_to_minio(
        minio_client=minio_client,
        df=attendance_df,
        bucket_name=raw_bucket,
        object_name=object_name,
        format='parquet'
    )
    
    if not success:
        logger.error(f"Failed to upload attendance data to MinIO")
        return False
    
    # Create and upload manifest
    manifest = {
        "extraction_time": datetime.now().isoformat(),
        "source": "attendance_csv",
        "record_count": record_count,
        "columns": list(attendance_df.columns),
        "path": object_name
    }
    
    # Upload manifest using helper function
    manifest_object_name = f"{timestamp}/attendance/_manifest.json"
    success = upload_json_to_minio(
        minio_client=minio_client,
        data=manifest,
        bucket_name=raw_bucket,
        object_name=manifest_object_name
    )
    
    if not success:
        logger.error(f"Failed to upload attendance manifest to MinIO")
        return False
    
    logger.info(f"Uploaded attendance data to MinIO: {record_count} records")
    logger.info(f"Uploaded attendance manifest to MinIO: {manifest_object_name}")
    
    return True

def main():
    """Main function to extract data and upload to MinIO"""
    logger.info("Starting process: Extract data and upload to MinIO Raw")
    
    # Get MinIO client
    minio_client = get_minio_client()
    
    # Generate single timestamp for this extraction run using helper function
    timestamp = generate_timestamp()
    logger.info(f"Using timestamp: {timestamp} for all extractions")
    
    # Ensure raw and processed buckets exist
    ensure_buckets_exist(minio_client, ["raw", "processed"])
    
    # Extract from PostgreSQL and upload to MinIO
    logger.info("Extracting from PostgreSQL")
    extract_from_postgres_to_minio(minio_client, timestamp)
    
    # Extract from attendance CSV and upload to MinIO
    logger.info("Extracting from Attendance CSV")
    attendance_csv_path = os.getenv('ATTENDANCE_CSV_PATH', 'data/attendance.csv')
    success = extract_attendance_to_minio(minio_client, attendance_csv_path, timestamp)
    
    if success:
        # Create a combined manifest for the entire extraction
        manifest = {
            "timestamp": timestamp,
            "extraction_time": datetime.now().isoformat(),
            "sources": ["postgres", "attendance"],
            "path": f"{timestamp}"
        }
        
        # Upload the combined manifest
        manifest_data = json.dumps(manifest, indent=2).encode('utf-8')
        minio_client.put_object(
            bucket_name="raw",
            object_name=f"{timestamp}/_manifest.json", 
            data=BytesIO(manifest_data),
            length=len(manifest_data),
            content_type="application/json"
        )
        
        logger.info(f"ETL Process completed successfully! All data extracted to raw/{timestamp}/")
    else:
        logger.error("ETL Process completed with errors.")

if __name__ == "__main__":
    main()
