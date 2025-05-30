"""
Fungsi-fungsi untuk mengekspor tabel dimensi dari MinIO processed ke warehouse PostgreSQL
"""

import logging
import pandas as pd
from typing import Dict, Any, Optional
from minio import Minio

from scripts.helper.export.export_utils import upsert_dimension, read_processed_parquet_from_minio

logger = logging.getLogger('dimension_exporters')

def export_dim_faculty(minio_client: Minio, timestamp: str, bucket_name: str = 'processed') -> Dict[str, Any]:
    """
    Export dim_faculty data to warehouse
    
    Args:
        minio_client: MinIO client
        timestamp: Processed data timestamp
        bucket_name: MinIO bucket name
        
    Returns:
        Dictionary with success status and metrics
    """
    try:
        object_name = f"{timestamp}/dimensions/dim_faculty.parquet"
        df = read_processed_parquet_from_minio(minio_client, bucket_name, object_name)
        
        if df.empty:
            logger.warning(f"Empty DataFrame from {object_name}, skipping export")
            return {'success': False, 'rows': 0, 'message': 'Empty DataFrame'}
            
        # Export to warehouse
        result = upsert_dimension('dim_faculty', df, 'faculty_id')
        return result
    except Exception as e:
        error_msg = f"Error exporting dim_faculty: {str(e)}"
        logger.error(error_msg)
        return {'success': False, 'rows': 0, 'message': error_msg}

def export_dim_program(minio_client: Minio, timestamp: str, bucket_name: str = 'processed') -> Dict[str, Any]:
    """
    Export dim_program data to warehouse
    
    Args:
        minio_client: MinIO client
        timestamp: Processed data timestamp
        bucket_name: MinIO bucket name
        
    Returns:
        Dictionary with success status and metrics
    """
    try:
        object_name = f"{timestamp}/dimensions/dim_program.parquet"
        df = read_processed_parquet_from_minio(minio_client, bucket_name, object_name)
        
        if df.empty:
            logger.warning(f"Empty DataFrame from {object_name}, skipping export")
            return {'success': False, 'rows': 0, 'message': 'Empty DataFrame'}
            
        # Export to warehouse
        result = upsert_dimension('dim_program', df, 'program_id')
        return result
    except Exception as e:
        error_msg = f"Error exporting dim_program: {str(e)}"
        logger.error(error_msg)
        return {'success': False, 'rows': 0, 'message': error_msg}

def export_dim_student(minio_client: Minio, timestamp: str, bucket_name: str = 'processed') -> Dict[str, Any]:
    """
    Export dim_student data to warehouse
    
    Args:
        minio_client: MinIO client
        timestamp: Processed data timestamp
        bucket_name: MinIO bucket name
        
    Returns:
        Dictionary with success status and metrics
    """
    try:
        object_name = f"{timestamp}/dimensions/dim_student.parquet"
        df = read_processed_parquet_from_minio(minio_client, bucket_name, object_name)
        
        if df.empty:
            logger.warning(f"Empty DataFrame from {object_name}, skipping export")
            return {'success': False, 'rows': 0, 'message': 'Empty DataFrame'}
            
        # Export to warehouse
        result = upsert_dimension('dim_student', df, 'student_id')
        return result
    except Exception as e:
        error_msg = f"Error exporting dim_student: {str(e)}"
        logger.error(error_msg)
        return {'success': False, 'rows': 0, 'message': error_msg}

def export_dim_course(minio_client: Minio, timestamp: str, bucket_name: str = 'processed') -> Dict[str, Any]:
    """
    Export dim_course data to warehouse
    
    Args:
        minio_client: MinIO client
        timestamp: Processed data timestamp
        bucket_name: MinIO bucket name
        
    Returns:
        Dictionary with success status and metrics
    """
    try:
        object_name = f"{timestamp}/dimensions/dim_course.parquet"
        df = read_processed_parquet_from_minio(minio_client, bucket_name, object_name)
        
        if df.empty:
            logger.warning(f"Empty DataFrame from {object_name}, skipping export")
            return {'success': False, 'rows': 0, 'message': 'Empty DataFrame'}
            
        # Export to warehouse
        result = upsert_dimension('dim_course', df, 'course_id')
        return result
    except Exception as e:
        error_msg = f"Error exporting dim_course: {str(e)}"
        logger.error(error_msg)
        return {'success': False, 'rows': 0, 'message': error_msg}

def export_dim_semester(minio_client: Minio, timestamp: str, bucket_name: str = 'processed') -> Dict[str, Any]:
    """
    Export dim_semester data to warehouse
    
    Args:
        minio_client: MinIO client
        timestamp: Processed data timestamp
        bucket_name: MinIO bucket name
        
    Returns:
        Dictionary with success status and metrics
    """
    try:
        object_name = f"{timestamp}/dimensions/dim_semester.parquet"
        df = read_processed_parquet_from_minio(minio_client, bucket_name, object_name)
        
        if df.empty:
            logger.warning(f"Empty DataFrame from {object_name}, skipping export")
            return {'success': False, 'rows': 0, 'message': 'Empty DataFrame'}
            
        # Export to warehouse
        result = upsert_dimension('dim_semester', df, 'semester_id')
        return result
    except Exception as e:
        error_msg = f"Error exporting dim_semester: {str(e)}"
        logger.error(error_msg)
        return {'success': False, 'rows': 0, 'message': error_msg}

def export_dim_lecturer(minio_client: Minio, timestamp: str, bucket_name: str = 'processed') -> Dict[str, Any]:
    """
    Export dim_lecturer data to warehouse
    
    Args:
        minio_client: MinIO client
        timestamp: Processed data timestamp
        bucket_name: MinIO bucket name
        
    Returns:
        Dictionary with success status and metrics
    """
    try:
        object_name = f"{timestamp}/dimensions/dim_lecturer.parquet"
        df = read_processed_parquet_from_minio(minio_client, bucket_name, object_name)
        
        if df.empty:
            logger.warning(f"Empty DataFrame from {object_name}, skipping export")
            return {'success': False, 'rows': 0, 'message': 'Empty DataFrame'}
            
        # Export to warehouse
        result = upsert_dimension('dim_lecturer', df, 'lecturer_id')
        return result
    except Exception as e:
        error_msg = f"Error exporting dim_lecturer: {str(e)}"
        logger.error(error_msg)
        return {'success': False, 'rows': 0, 'message': error_msg}

def export_dim_class(minio_client: Minio, timestamp: str, bucket_name: str = 'processed') -> Dict[str, Any]:
    """
    Export dim_class data to warehouse
    
    Args:
        minio_client: MinIO client
        timestamp: Processed data timestamp
        bucket_name: MinIO bucket name
        
    Returns:
        Dictionary with success status and metrics
    """
    try:
        object_name = f"{timestamp}/dimensions/dim_class.parquet"
        df = read_processed_parquet_from_minio(minio_client, bucket_name, object_name)
        
        if df.empty:
            logger.warning(f"Empty DataFrame from {object_name}, skipping export")
            return {'success': False, 'rows': 0, 'message': 'Empty DataFrame'}
            
        # Export to warehouse
        result = upsert_dimension('dim_class', df, 'class_id')
        return result
    except Exception as e:
        error_msg = f"Error exporting dim_class: {str(e)}"
        logger.error(error_msg)
        return {'success': False, 'rows': 0, 'message': error_msg}

def export_all_dimensions(minio_client: Minio, timestamp: str, bucket_name: str = 'processed') -> Dict[str, Dict[str, Any]]:
    """
    Export all dimension tables to warehouse
    
    Args:
        minio_client: MinIO client
        timestamp: Processed data timestamp
        bucket_name: MinIO bucket name
        
    Returns:
        Dictionary with results for each dimension
    """
    results = {}
    
    # Export dimensions in proper order (respect foreign key constraints)

    # # 2. Program (depends on faculty)
    # results['dim_program'] = export_dim_program(minio_client, timestamp, bucket_name)
    
    # 3. Student (depends on program)
    results['dim_student'] = export_dim_student(minio_client, timestamp, bucket_name)
    
    # 4. Course (depends on program)
    results['dim_course'] = export_dim_course(minio_client, timestamp, bucket_name)
    
    # 5. Semester (no dependencies)
    results['dim_semester'] = export_dim_semester(minio_client, timestamp, bucket_name)
    
    # 6. Lecturer (depends on faculty)
    results['dim_lecturer'] = export_dim_lecturer(minio_client, timestamp, bucket_name)
    
    # 7. Class (depends on course, lecturer, semester)
    results['dim_class'] = export_dim_class(minio_client, timestamp, bucket_name)
    
    return results
