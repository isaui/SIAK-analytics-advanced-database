"""
Utility functions for MinIO operations (extraction and transformation)
"""
import logging
import json
from io import BytesIO
from datetime import datetime
from typing import Dict, List, Optional, Any

import pandas as pd

logger = logging.getLogger('minio_utils')

def ensure_bucket_exists(minio_client, bucket_name: str) -> bool:
    """
    Ensure that a bucket exists in MinIO, create it if it doesn't
    
    Args:
        minio_client: MinIO client instance
        bucket_name: Name of the bucket to check/create
        
    Returns:
        True if bucket exists or was created, False otherwise
    """
    try:
        if not minio_client.bucket_exists(bucket_name):
            logger.info(f"Bucket {bucket_name} does not exist, creating...")
            minio_client.make_bucket(bucket_name)
            logger.info(f"Bucket {bucket_name} created successfully")
        return True
    except Exception as e:
        logger.error(f"Error ensuring bucket {bucket_name} exists: {str(e)}")
        return False


def ensure_buckets_exist(minio_client, bucket_names: List[str]) -> bool:
    """
    Ensure that all specified buckets exist in MinIO, create them if they don't
    
    Args:
        minio_client: MinIO client instance
        bucket_names: List of bucket names to check/create
        
    Returns:
        True if all buckets exist or were created, False otherwise
    """
    try:
        for bucket in bucket_names:
            if not ensure_bucket_exists(minio_client, bucket):
                return False
        return True
    except Exception as e:
        logger.error(f"Error ensuring buckets exist: {str(e)}")
        return False


def upload_dataframe_to_minio(
    minio_client, 
    df: pd.DataFrame,
    bucket_name: str, 
    object_name: str,
    format: str = 'parquet'
) -> bool:
    """
    Upload a DataFrame to MinIO
    
    Args:
        minio_client: MinIO client instance
        df: DataFrame to upload
        bucket_name: Bucket name
        object_name: Object name in the bucket
        format: Format to save the DataFrame (parquet or csv)
        
    Returns:
        True if successful, False otherwise
    """
    try:
        # Create buffer for the data
        buffer = BytesIO()
        
        # Save DataFrame to buffer in the specified format
        if format.lower() == 'parquet':
            df.to_parquet(buffer, index=False)
            content_type = 'application/octet-stream'
        elif format.lower() == 'csv':
            df.to_csv(buffer, index=False)
            content_type = 'text/csv'
        else:
            raise ValueError(f"Unsupported format: {format}")
            
        # Reset buffer position to the beginning
        buffer.seek(0)
        data_length = buffer.getbuffer().nbytes
        
        # Upload to MinIO
        minio_client.put_object(
            bucket_name,
            object_name,
            buffer,
            data_length,
            content_type=content_type
        )
        
        logger.info(f"Uploaded {format} data to MinIO: {bucket_name}/{object_name}")
        return True
        
    except Exception as e:
        logger.error(f"Error uploading data to MinIO: {str(e)}")
        return False


def read_dataframe_from_minio(
    minio_client,
    bucket_name: str,
    object_name: str,
    format: str = None
) -> Optional[pd.DataFrame]:
    """
    Read a DataFrame from MinIO
    
    Args:
        minio_client: MinIO client instance
        bucket_name: Bucket name
        object_name: Object name in the bucket
        format: Format of the file (if None, will be inferred from extension)
        
    Returns:
        DataFrame or None if error
    """
    try:
        # Check if object exists
        try:
            minio_client.stat_object(bucket_name, object_name)
        except Exception as e:
            logger.warning(f"Object {bucket_name}/{object_name} does not exist: {str(e)}")
            return None
            
        # Get object data
        response = minio_client.get_object(bucket_name, object_name)
        
        # If format is not specified, infer from file extension
        if format is None:
            if object_name.endswith('.parquet'):
                format = 'parquet'
            elif object_name.endswith('.csv'):
                format = 'csv'
            else:
                format = 'csv'  # Default to CSV
        
        # Read DataFrame from buffer
        if format.lower() == 'parquet':
            df = pd.read_parquet(BytesIO(response.read()))
        elif format.lower() == 'csv':
            df = pd.read_csv(BytesIO(response.read()))
        else:
            raise ValueError(f"Unsupported format: {format}")
            
        logger.info(f"Read {format} data from MinIO: {bucket_name}/{object_name}")
        return df
        
    except Exception as e:
        logger.error(f"Error reading data from MinIO: {str(e)}")
        return None


def upload_json_to_minio(
    minio_client,
    data: Dict[str, Any],
    bucket_name: str,
    object_name: str
) -> bool:
    """
    Upload JSON data to MinIO
    
    Args:
        minio_client: MinIO client instance
        data: Dictionary to convert to JSON and upload
        bucket_name: Bucket name
        object_name: Object name in the bucket
        
    Returns:
        True if successful, False otherwise
    """
    try:
        # Convert data to JSON and encode as bytes
        json_data = json.dumps(data, indent=2).encode('utf-8')
        
        # Upload to MinIO
        minio_client.put_object(
            bucket_name,
            object_name,
            BytesIO(json_data),
            len(json_data),
            content_type="application/json"
        )
        
        logger.info(f"Uploaded JSON data to MinIO: {bucket_name}/{object_name}")
        return True
        
    except Exception as e:
        logger.error(f"Error uploading JSON to MinIO: {str(e)}")
        return False


def read_json_from_minio(
    minio_client,
    bucket_name: str,
    object_name: str
) -> Optional[Dict[str, Any]]:
    """
    Read JSON data from MinIO
    
    Args:
        minio_client: MinIO client instance
        bucket_name: Bucket name
        object_name: Object name in the bucket
        
    Returns:
        Dictionary with JSON data or None if error
    """
    try:
        # Check if object exists
        try:
            minio_client.stat_object(bucket_name, object_name)
        except Exception as e:
            logger.warning(f"Object {bucket_name}/{object_name} does not exist: {str(e)}")
            return None
            
        # Get object data
        response = minio_client.get_object(bucket_name, object_name)
        
        # Parse JSON
        json_data = json.loads(response.read().decode('utf-8'))
        
        logger.info(f"Read JSON data from MinIO: {bucket_name}/{object_name}")
        return json_data
        
    except Exception as e:
        logger.error(f"Error reading JSON from MinIO: {str(e)}")
        return None


def get_latest_timestamp_from_bucket(
    minio_client,
    bucket_name: str,
    prefix: str = ""
) -> Optional[str]:
    """
    Get the latest timestamp folder from a MinIO bucket
    
    Args:
        minio_client: MinIO client instance
        bucket_name: Bucket name
        prefix: Optional prefix to filter objects
        
    Returns:
        Latest timestamp as string (YYYYMMDD_HHMMSS) or None if no timestamps found
    """
    try:
        # List objects in the bucket with prefix
        objects = list(minio_client.list_objects(bucket_name, prefix=prefix, recursive=False))
        
        # Get timestamp folders (exclude files at root level)
        timestamps = []
        for obj in objects:
            # Get the object name without trailing slash
            obj_name = obj.object_name.rstrip('/')
            if prefix:
                # Remove prefix from object name
                obj_name = obj_name[len(prefix):].lstrip('/')
                
            # Check if it looks like a timestamp folder (YYYYMMDD_HHMMSS)
            if len(obj_name) == 15 and obj_name[8] == '_' and obj_name.replace('_', '').isdigit():
                timestamps.append(obj_name)
        
        if not timestamps:
            logger.warning(f"No timestamp folders found in {bucket_name}/{prefix}")
            return None
            
        # Sort timestamps and get the latest
        latest = sorted(timestamps, reverse=True)[0]
        logger.info(f"Latest timestamp in {bucket_name}/{prefix}: {latest}")
        return latest
        
    except Exception as e:
        logger.error(f"Error getting latest timestamp: {str(e)}")
        return None


def generate_timestamp() -> str:
    """
    Generate a timestamp string for MinIO folders
    
    Returns:
        Timestamp string in format YYYYMMDD_HHMMSS
    """
    return datetime.now().strftime('%Y%m%d_%H%M%S')
