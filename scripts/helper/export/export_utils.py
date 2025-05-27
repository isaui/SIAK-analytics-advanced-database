"""
Utility functions for exporting data from MinIO processed to warehouse PostgreSQL
"""

import logging
import pandas as pd
import numpy as np
import sys
import os
from io import BytesIO
from datetime import datetime
from typing import Dict, List, Any, Optional, Union, Tuple
from minio import Minio

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

# Import warehouse connection pool functions
from data_sources.data_warehouse_pool import execute_query, execute_values

# Import minio utilities
from scripts.helper.utils.minio_utils import get_latest_timestamp_from_bucket

# Configure logging
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger('export_utils')

def read_processed_parquet_from_minio(minio_client: Minio, bucket_name: str, object_name: str) -> pd.DataFrame:
    """
    Read a parquet file from MinIO processed bucket
    
    Args:
        minio_client: MinIO client
        bucket_name: Name of the bucket (usually 'processed')
        object_name: Name of the object to read
        
    Returns:
        DataFrame containing the data
    """
    try:
        response = minio_client.get_object(bucket_name, object_name)
        data = response.read()
        buffer = BytesIO(data)
        df = pd.read_parquet(buffer)
        logger.info(f"Successfully read parquet from MinIO: {bucket_name}/{object_name}")
        return df
    except Exception as e:
        logger.error(f"Error reading parquet from MinIO: {str(e)}")
        return pd.DataFrame()

def get_latest_processed_timestamp(minio_client: Minio, bucket_name: str = 'processed') -> str:
    """
    Get the latest timestamp from the processed bucket
    
    Args:
        minio_client: MinIO client
        bucket_name: MinIO bucket name
        
    Returns:
        Latest timestamp as string
    """
    # Using the centralized function from minio_utils
    return get_latest_timestamp_from_bucket(minio_client, bucket_name)

def upsert_dimension(table_name: str, df: pd.DataFrame, id_column: str = 'id', schema: str = 'public') -> Dict[str, Any]:
    """
    Load dimension data into warehouse using upsert (INSERT ON CONFLICT UPDATE)
    
    Args:
        table_name: Name of the table to load data into
        df: DataFrame containing the data to load
        id_column: Primary key column for conflict detection
        schema: Database schema
        
    Returns:
        Dictionary with success status and metrics
    """
    if df.empty:
        logger.warning(f"Empty DataFrame provided for {table_name}, skipping")
        return {'success': True, 'rows': 0, 'message': 'Empty DataFrame, nothing to load'}
    
    start_time = datetime.now()
    result = {'table': table_name, 'success': False, 'rows': 0}
    
    try:
        # Get columns from DataFrame excluding None/NaN values
        columns = df.columns.tolist()
        column_names = ', '.join([f'"{col}"' for col in columns])
        
        # Build the ON CONFLICT clause
        updates = ', '.join([f'"{col}" = EXCLUDED."{col}"' for col in columns if col != id_column])
        
        # Create the INSERT ON CONFLICT statement
        query = f"""
        INSERT INTO {schema}."{table_name}" ({column_names})
        VALUES %s
        ON CONFLICT ("{id_column}")
        DO UPDATE SET {updates}
        """
        
        # Replace NaN with None for database compatibility
        df = df.replace({np.nan: None})
        
        # Convert DataFrame to list of tuples
        records = [tuple(x) for x in df.to_numpy()]
        
        # Use execute_values from data_warehouse_pool to handle the insert efficiently
        execute_values(query, records)
        
        # Get number of affected rows
        result['rows'] = len(df)
        result['success'] = True
        result['duration'] = (datetime.now() - start_time).total_seconds()
        logger.info(f"Successfully loaded {result['rows']} rows into {schema}.{table_name}")
    except Exception as e:
        error_msg = f"Error loading dimension {table_name}: {str(e)}"
        logger.error(error_msg)
        result['message'] = error_msg
    
    return result

def upsert_fact(table_name: str, df: pd.DataFrame, key_columns: List[str], schema: str = 'public') -> Dict[str, Any]:
    """
    Load fact data into warehouse using direct upsert (INSERT ON CONFLICT UPDATE)
    This handles cases where the same facts might appear in different snapshots
    
    Args:
        table_name: Name of the table to load data into
        df: DataFrame containing the data to load
        key_columns: List of columns that form the business key for conflict detection
        schema: Database schema
        
    Returns:
        Dictionary with success status and metrics
    """
    if df.empty:
        logger.warning(f"Empty DataFrame provided for {table_name}, skipping")
        return {'success': True, 'rows': 0, 'message': 'Empty DataFrame, nothing to load'}
    
    start_time = datetime.now()
    result = {'table': table_name, 'success': False, 'rows': 0}
    
    try:
        # Get columns from DataFrame
        columns = df.columns.tolist()
        column_names = ', '.join([f'"{col}"' for col in columns])
        
        # Format the fully qualified table name
        full_table = f"{schema}.\"{table_name}\""
        
        # Format key columns for ON CONFLICT clause
        key_cols_quoted = ', '.join([f'"{col}"' for col in key_columns])
        
        # Replace NaN with None for database compatibility
        df = df.replace({np.nan: None})
        
        # Convert DataFrame to list of tuples
        records = [tuple(x) for x in df.to_numpy()]
        
        # Build update clause for non-key columns
        updates = ', '.join([f'"{col}" = EXCLUDED."{col}"' for col in columns if col not in key_columns])
        
        # Create the upsert query
        if updates:
            query = f"""
            INSERT INTO {full_table} ({column_names}) 
            VALUES %s
            ON CONFLICT ({key_cols_quoted}) 
            DO UPDATE SET {updates}
            """
        else:
            query = f"""
            INSERT INTO {full_table} ({column_names}) 
            VALUES %s
            ON CONFLICT ({key_cols_quoted}) 
            DO NOTHING
            """
        
        # Use execute_values from data_warehouse_pool to handle the insert efficiently
        rows_affected = execute_values(query, records)
        
        # Get number of affected rows
        result['rows'] = len(df)
        result['success'] = True
        result['duration'] = (datetime.now() - start_time).total_seconds()
        logger.info(f"Successfully upserted {result['rows']} rows into {schema}.{table_name}")
    except Exception as e:
        error_msg = f"Error upserting to {table_name}: {str(e)}"
        logger.error(error_msg)
        result['message'] = error_msg
    
    return result

# Removed incremental_fact_load as it's been replaced by the more versatile upsert_fact function

def create_export_manifest(
    minio_client: Minio, 
    processed_timestamp: str, 
    export_timestamp: str,
    results: Dict[str, Dict[str, Any]],
    bucket_name: str = 'processed'
) -> bool:
    """
    Create and upload a manifest for the export process
    
    Args:
        minio_client: MinIO client
        processed_timestamp: Timestamp of the processed data that was exported
        export_timestamp: Timestamp of this export process
        results: Dictionary with export results for each table
        bucket_name: MinIO bucket name
        
    Returns:
        True if successful, False otherwise
    """
    try:
        # Get some database info for the manifest
        db_info = execute_query("SELECT current_database() as db_name, current_user as username, version() as version")
        
        # Calculate success metrics
        total_tables = len(results)
        successful_tables = sum(1 for table, info in results.items() if info.get('success', False))
        total_rows = sum(info.get('rows', 0) for table, info in results.items())
        
        # Create manifest
        manifest = {
            "export_timestamp": export_timestamp,
            "processed_data_timestamp": processed_timestamp,
            "database_info": {
                "name": db_info[0]['db_name'] if db_info else "unknown",
                "user": db_info[0]['username'] if db_info else "unknown",
                "version": db_info[0]['version'] if db_info else "unknown"
            },
            "success_rate": f"{successful_tables}/{total_tables}",
            "total_rows_loaded": total_rows,
            "tables": results
        }
        
        # Convert to JSON and upload to MinIO
        import json
        
        manifest_json = json.dumps(manifest, indent=2)
        manifest_bytes = manifest_json.encode('utf-8')
        manifest_stream = BytesIO(manifest_bytes)
        
        object_name = f"{processed_timestamp}/export_manifest_{export_timestamp}.json"
        
        minio_client.put_object(
            bucket_name,
            object_name,
            manifest_stream,
            len(manifest_bytes),
            content_type="application/json"
        )
        
        logger.info(f"Export manifest uploaded to {bucket_name}/{object_name}")
        return True
        
    except Exception as e:
        logger.error(f"Error creating export manifest: {str(e)}")
        return False
