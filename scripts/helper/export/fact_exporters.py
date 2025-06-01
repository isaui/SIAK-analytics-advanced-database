"""
Fungsi-fungsi untuk mengekspor tabel fakta dari MinIO processed ke warehouse PostgreSQL
"""

import logging
import pandas as pd
from typing import Dict, Any, List, Optional
from minio import Minio

from scripts.helper.export.export_utils import upsert_fact, read_processed_parquet_from_minio

logger = logging.getLogger('fact_exporters')

def export_fact_registration(minio_client: Minio, timestamp: str, bucket_name: str = 'processed') -> Dict[str, Any]:
    """
    Export fact_registration data to warehouse
    
    Args:
        minio_client: MinIO client
        timestamp: Processed data timestamp
        bucket_name: MinIO bucket name
        
    Returns:
        Dictionary with success status and metrics
    """
    try:
        object_name = f"{timestamp}/facts/fact_registration.parquet"
        df = read_processed_parquet_from_minio(minio_client, bucket_name, object_name)
        
        if df.empty:
            logger.warning(f"Empty DataFrame from {object_name}, skipping export")
            return {'success': False, 'rows': 0, 'message': 'Empty DataFrame'}
            
        # Composite key for fact_registration
        key_columns = ['student_id', 'course_id', 'semester_id']
        
        # Export to warehouse
        result = upsert_fact('fact_registration', df, key_columns)
        return result
    except Exception as e:
        error_msg = f"Error exporting fact_registration: {str(e)}"
        logger.error(error_msg)
        return {'success': False, 'rows': 0, 'message': error_msg}

def export_fact_fee(minio_client: Minio, timestamp: str, bucket_name: str = 'processed') -> Dict[str, Any]:
    """
    Export fact_fee data to warehouse
    
    Args:
        minio_client: MinIO client
        timestamp: Processed data timestamp
        bucket_name: MinIO bucket name
        
    Returns:
        Dictionary with success status and metrics
    """
    try:
        object_name = f"{timestamp}/facts/fact_fee.parquet"
        df = read_processed_parquet_from_minio(minio_client, bucket_name, object_name)
        
        if df.empty:
            logger.warning(f"Empty DataFrame from {object_name}, skipping export")
            return {'success': False, 'rows': 0, 'message': 'Empty DataFrame'}
            
        # Composite key for fact_fee
        key_columns = ['student_id', 'semester_id', 'fee_id']
        
        # Export to warehouse
        result = upsert_fact('fact_fee', df, key_columns)
        return result
    except Exception as e:
        error_msg = f"Error exporting fact_fee: {str(e)}"
        logger.error(error_msg)
        return {'success': False, 'rows': 0, 'message': error_msg}

def export_fact_academic(minio_client: Minio, timestamp: str, bucket_name: str = 'processed') -> Dict[str, Any]:
    """
    Export fact_academic data to warehouse
    
    Args:
        minio_client: MinIO client
        timestamp: Processed data timestamp
        bucket_name: MinIO bucket name
        
    Returns:
        Dictionary with success status and metrics
    """
    try:
        object_name = f"{timestamp}/facts/fact_academic.parquet"
        df = read_processed_parquet_from_minio(minio_client, bucket_name, object_name)
        
        if df.empty:
            logger.warning(f"Empty DataFrame from {object_name}, skipping export")
            return {'success': False, 'rows': 0, 'message': 'Empty DataFrame'}
            
        # Composite key for fact_academic
        key_columns = ['student_id', 'semester_id', 'academic_id']
        
        # Export to warehouse
        result = upsert_fact('fact_academic', df, key_columns)
        return result
    except Exception as e:
        error_msg = f"Error exporting fact_academic: {str(e)}"
        logger.error(error_msg)
        return {'success': False, 'rows': 0, 'message': error_msg}

def export_fact_grade(minio_client: Minio, timestamp: str, bucket_name: str = 'processed') -> Dict[str, Any]:
    """
    Export fact_grade data to warehouse
    
    Args:
        minio_client: MinIO client
        timestamp: Processed data timestamp
        bucket_name: MinIO bucket name
        
    Returns:
        Dictionary with success status and metrics
    """
    try:
        object_name = f"{timestamp}/facts/fact_grade.parquet"
        df = read_processed_parquet_from_minio(minio_client, bucket_name, object_name)
        
        if df.empty:
            logger.warning(f"Empty DataFrame from {object_name}, skipping export")
            return {'success': False, 'rows': 0, 'message': 'Empty DataFrame'}
            
        # Composite key for fact_grade
        key_columns = ['student_id', 'course_id', 'semester_id', 'grade_id']
        
        # Export to warehouse
        result = upsert_fact('fact_grade', df, key_columns)
        return result
    except Exception as e:
        error_msg = f"Error exporting fact_grade: {str(e)}"
        logger.error(error_msg)
        return {'success': False, 'rows': 0, 'message': error_msg}

def export_fact_attendance(minio_client: Minio, timestamp: str, bucket_name: str = 'processed') -> Dict[str, Any]:
    """
    Export fact_attendance data to warehouse
    
    Args:
        minio_client: MinIO client
        timestamp: Processed data timestamp
        bucket_name: MinIO bucket name
        
    Returns:
        Dictionary with success status and metrics
    """
    try:
        object_name = f"{timestamp}/facts/fact_attendance.parquet"
        df = read_processed_parquet_from_minio(minio_client, bucket_name, object_name)
        
        if df.empty:
            logger.warning(f"Empty DataFrame from {object_name}, skipping export")
            return {'success': False, 'rows': 0, 'message': 'Empty DataFrame'}
            
        # Composite key for fact_attendance
        # This is potentially incremental data from CSV, handle it carefully
        key_columns = ['student_id', 'class_id', 'attendance_date']
        
        # Export to warehouse using the same upsert mechanism
        # Note: We could use the incremental approach, but upsert works well too
        result = upsert_fact('fact_attendance', df, key_columns)
        return result
    except Exception as e:
        error_msg = f"Error exporting fact_attendance: {str(e)}"
        logger.error(error_msg)
        return {'success': False, 'rows': 0, 'message': error_msg}

def export_fact_teaching(minio_client: Minio, timestamp: str, bucket_name: str = 'processed') -> Dict[str, Any]:
    """
    Export fact_teaching data to warehouse
    
    Args:
        minio_client: MinIO client
        timestamp: Processed data timestamp
        bucket_name: MinIO bucket name
        
    Returns:
        Dictionary with success status and metrics
    """
    try:
        object_name = f"{timestamp}/facts/fact_teaching.parquet"
        df = read_processed_parquet_from_minio(minio_client, bucket_name, object_name)
        
        if df.empty:
            logger.warning(f"Empty DataFrame from {object_name}, skipping export")
            return {'success': False, 'rows': 0, 'message': 'Empty DataFrame'}
            
        # Composite key for fact_teaching
        key_columns = ['lecturer_id', 'course_id', 'semester_id', 'class_id']
        
        # Export to warehouse
        result = upsert_fact('fact_teaching', df, key_columns)
        return result
    except Exception as e:
        error_msg = f"Error exporting fact_teaching: {str(e)}"
        logger.error(error_msg)
        return {'success': False, 'rows': 0, 'message': error_msg}

def export_fact_room_usage(minio_client: Minio, timestamp: str, bucket_name: str = 'processed') -> Dict[str, Any]:
    """
    Export fact_room_usage data to warehouse
    
    Args:
        minio_client: MinIO client
        timestamp: Processed data timestamp
        bucket_name: MinIO bucket name
        
    Returns:
        Dictionary with success status and metrics
    """
    try:
        object_name = f"{timestamp}/facts/fact_room_usage.parquet"
        df = read_processed_parquet_from_minio(minio_client, bucket_name, object_name)
        
        if df.empty:
            logger.warning(f"Empty DataFrame from {object_name}, skipping export")
            return {'success': False, 'rows': 0, 'message': 'Empty DataFrame'}
            
        # Composite key for fact_room_usage
        key_columns = ['room_id', 'class_id', 'usage_date', 'start_time']
        
        # Export to warehouse
        result = upsert_fact('fact_room_usage', df, key_columns)
        return result
    except Exception as e:
        error_msg = f"Error exporting fact_room_usage: {str(e)}"
        logger.error(error_msg)
        return {'success': False, 'rows': 0, 'message': error_msg}

def export_all_facts(minio_client: Minio, timestamp: str, bucket_name: str = 'processed') -> Dict[str, Dict[str, Any]]:
    """
    Export all fact tables to warehouse
    
    Args:
        minio_client: MinIO client
        timestamp: Processed data timestamp
        bucket_name: MinIO bucket name
        
    Returns:
        Dictionary with results for each fact
    """
    results = {}
    
    logger.info("Starting fact table exports...")
    
    # Export core business facts first
    results['fact_registration'] = export_fact_registration(minio_client, timestamp, bucket_name)
    results['fact_fee'] = export_fact_fee(minio_client, timestamp, bucket_name)
    results['fact_academic'] = export_fact_academic(minio_client, timestamp, bucket_name)
    results['fact_grade'] = export_fact_grade(minio_client, timestamp, bucket_name)
    results['fact_attendance'] = export_fact_attendance(minio_client, timestamp, bucket_name)
    
    # Export operational facts
    results['fact_teaching'] = export_fact_teaching(minio_client, timestamp, bucket_name)
    results['fact_room_usage'] = export_fact_room_usage(minio_client, timestamp, bucket_name)
    
    # Log summary
    total_success = sum(1 for result in results.values() if result.get('success', False))
    total_rows = sum(result.get('rows', 0) for result in results.values())
    logger.info(f"Fact export completed: {total_success}/{len(results)} successful, {total_rows} total rows")
    
    return results