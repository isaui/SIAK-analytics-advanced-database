#!/usr/bin/env python
"""
Transform raw data from MinIO to processed star schema format

This script:
1. Gets the latest extraction timestamp from the raw bucket
2. Reads raw data from PostgreSQL and attendance sources
3. Transforms data to match warehouse star schema
4. Uploads transformed data to the processed bucket
"""

import os
import logging
from datetime import datetime
import sys
from typing import List, Dict, Any, Optional

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import environment variables
from dotenv import load_dotenv

# Import the MinIO client
from data_sources.minio_client import get_minio_client

# Import transformation functions
from scripts.helper.transform.dimension_transforms import (
    transform_dim_faculty,
    transform_dim_program,
    transform_dim_student,
    transform_dim_course,
    transform_dim_semester,
    transform_dim_lecturer,
    transform_dim_class
)

from scripts.helper.transform.fact_transforms import (
    transform_fact_registration,
    transform_fact_fee,
    transform_fact_academic,
    transform_fact_grade,
    transform_fact_attendance
)

# Import MinIO utilities
from scripts.helper.utils.minio_utils import (
    ensure_buckets_exist,
    upload_dataframe_to_minio,
    upload_json_to_minio,
    read_dataframe_from_minio,
    get_latest_timestamp_from_bucket,
    generate_timestamp
)

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger('transform_raw_to_processed')


def transform_dimensions(minio_client, raw_timestamp: str, process_timestamp: str) -> Dict[str, bool]:
    """
    Transform all dimension tables
    
    Args:
        minio_client: MinIO client instance
        raw_timestamp: Raw data timestamp
        process_timestamp: Processing timestamp
        
    Returns:
        Dictionary with transformation results for each dimension
    """
    results = {}
    
    # Transform faculty dimension
    try:
        logger.info("Transforming dimension: faculty")
        df = read_dataframe_from_minio(
            minio_client, 
            "raw", 
            f"{raw_timestamp}/postgres/faculties.parquet"
        )
        
        if df is not None and not df.empty:
            df_transformed = transform_dim_faculty(df)
            success = upload_dataframe_to_minio(
                minio_client,
                df_transformed,
                "processed",
                f"{process_timestamp}/dimensions/dim_faculty.parquet"
            )
            results['dim_faculty'] = success
        else:
            logger.warning(f"No faculty data found for timestamp {raw_timestamp}")
            results['dim_faculty'] = False
    except Exception as e:
        logger.error(f"Error transforming faculty dimension: {str(e)}")
        results['dim_faculty'] = False
    
    # Transform program dimension
    try:
        logger.info("Transforming dimension: program")
        df = read_dataframe_from_minio(
            minio_client, 
            "raw", 
            f"{raw_timestamp}/postgres/programs.parquet"
        )
        
        if df is not None and not df.empty:
            df_transformed = transform_dim_program(df)
            success = upload_dataframe_to_minio(
                minio_client,
                df_transformed,
                "processed",
                f"{process_timestamp}/dimensions/dim_program.parquet"
            )
            results['dim_program'] = success
        else:
            logger.warning(f"No program data found for timestamp {raw_timestamp}")
            results['dim_program'] = False
    except Exception as e:
        logger.error(f"Error transforming program dimension: {str(e)}")
        results['dim_program'] = False
    
    # Transform student dimension
    try:
        logger.info("Transforming dimension: student")
        df = read_dataframe_from_minio(
            minio_client, 
            "raw", 
            f"{raw_timestamp}/postgres/students.parquet"
        )
        
        if df is not None and not df.empty:
            df_transformed = transform_dim_student(df)
            success = upload_dataframe_to_minio(
                minio_client,
                df_transformed,
                "processed",
                f"{process_timestamp}/dimensions/dim_student.parquet"
            )
            results['dim_student'] = success
        else:
            logger.warning(f"No student data found for timestamp {raw_timestamp}")
            results['dim_student'] = False
    except Exception as e:
        logger.error(f"Error transforming student dimension: {str(e)}")
        results['dim_student'] = False
    
    # Transform course dimension
    try:
        logger.info("Transforming dimension: course")
        df = read_dataframe_from_minio(
            minio_client, 
            "raw", 
            f"{raw_timestamp}/postgres/courses.parquet"
        )
        
        if df is not None and not df.empty:
            df_transformed = transform_dim_course(df)
            success = upload_dataframe_to_minio(
                minio_client,
                df_transformed,
                "processed",
                f"{process_timestamp}/dimensions/dim_course.parquet"
            )
            results['dim_course'] = success
        else:
            logger.warning(f"No course data found for timestamp {raw_timestamp}")
            results['dim_course'] = False
    except Exception as e:
        logger.error(f"Error transforming course dimension: {str(e)}")
        results['dim_course'] = False
    
    # Transform semester dimension
    try:
        logger.info("Transforming dimension: semester")
        df = read_dataframe_from_minio(
            minio_client, 
            "raw", 
            f"{raw_timestamp}/postgres/semesters.parquet"
        )
        
        if df is not None and not df.empty:
            df_transformed = transform_dim_semester(df)
            success = upload_dataframe_to_minio(
                minio_client,
                df_transformed,
                "processed",
                f"{process_timestamp}/dimensions/dim_semester.parquet"
            )
            results['dim_semester'] = success
        else:
            logger.warning(f"No semester data found for timestamp {raw_timestamp}")
            results['dim_semester'] = False
    except Exception as e:
        logger.error(f"Error transforming semester dimension: {str(e)}")
        results['dim_semester'] = False
    
    # Transform lecturer dimension
    try:
        logger.info("Transforming dimension: lecturer")
        df = read_dataframe_from_minio(
            minio_client, 
            "raw", 
            f"{raw_timestamp}/postgres/lecturers.parquet"
        )
        
        if df is not None and not df.empty:
            df_transformed = transform_dim_lecturer(df)
            success = upload_dataframe_to_minio(
                minio_client,
                df_transformed,
                "processed",
                f"{process_timestamp}/dimensions/dim_lecturer.parquet"
            )
            results['dim_lecturer'] = success
        else:
            logger.warning(f"No lecturer data found for timestamp {raw_timestamp}")
            results['dim_lecturer'] = False
    except Exception as e:
        logger.error(f"Error transforming lecturer dimension: {str(e)}")
        results['dim_lecturer'] = False
    
    # Transform class dimension (needs class_schedules and rooms)
    try:
        logger.info("Transforming dimension: class")
        df = read_dataframe_from_minio(
            minio_client, 
            "raw", 
            f"{raw_timestamp}/postgres/class_schedules.parquet"
        )
        
        if df is not None and not df.empty:
            # Check if rooms table exists, use it if available
            rooms_df = None
            try:
                rooms_df = read_dataframe_from_minio(
                    minio_client, 
                    "raw", 
                    f"{raw_timestamp}/postgres/rooms.parquet"
                )
            except Exception:
                logger.warning("Rooms data not available, using None for room information")
            
            df_transformed = transform_dim_class(df, rooms_df)
            success = upload_dataframe_to_minio(
                minio_client,
                df_transformed,
                "processed",
                f"{process_timestamp}/dimensions/dim_class.parquet"
            )
            results['dim_class'] = success
        else:
            logger.warning(f"No class_schedules data found for timestamp {raw_timestamp}")
            results['dim_class'] = False
    except Exception as e:
        logger.error(f"Error transforming class dimension: {str(e)}")
        results['dim_class'] = False
    
    return results


def transform_facts(minio_client, raw_timestamp: str, process_timestamp: str) -> Dict[str, bool]:
    """
    Transform all fact tables
    
    Args:
        minio_client: MinIO client instance
        raw_timestamp: Raw data timestamp
        process_timestamp: Processing timestamp
        
    Returns:
        Dictionary with transformation results for each fact
    """
    results = {}
    
    # Transform registration fact
    try:
        logger.info("Transforming fact: registration")
        df = read_dataframe_from_minio(
            minio_client, 
            "raw", 
            f"{raw_timestamp}/postgres/registrations.parquet"
        )
        
        if df is not None and not df.empty:
            df_transformed = transform_fact_registration(df)
            success = upload_dataframe_to_minio(
                minio_client,
                df_transformed,
                "processed",
                f"{process_timestamp}/facts/fact_registration.parquet"
            )
            results['fact_registration'] = success
        else:
            logger.warning(f"No registrations data found for timestamp {raw_timestamp}")
            results['fact_registration'] = False
    except Exception as e:
        logger.error(f"Error transforming registration fact: {str(e)}")
        results['fact_registration'] = False
    
    # Transform fee fact
    try:
        logger.info("Transforming fact: fee")
        df = read_dataframe_from_minio(
            minio_client, 
            "raw", 
            f"{raw_timestamp}/postgres/semester_fees.parquet"
        )
        
        if df is not None and not df.empty:
            df_transformed = transform_fact_fee(df)
            success = upload_dataframe_to_minio(
                minio_client,
                df_transformed,
                "processed",
                f"{process_timestamp}/facts/fact_fee.parquet"
            )
            results['fact_fee'] = success
        else:
            logger.warning(f"No semester_fees data found for timestamp {raw_timestamp}")
            results['fact_fee'] = False
    except Exception as e:
        logger.error(f"Error transforming fee fact: {str(e)}")
        results['fact_fee'] = False
    
    # Transform academic fact
    try:
        logger.info("Transforming fact: academic")
        df = read_dataframe_from_minio(
            minio_client, 
            "raw", 
            f"{raw_timestamp}/postgres/academic_records.parquet"
        )
        
        if df is not None and not df.empty:
            df_transformed = transform_fact_academic(df)
            success = upload_dataframe_to_minio(
                minio_client,
                df_transformed,
                "processed",
                f"{process_timestamp}/facts/fact_academic.parquet"
            )
            results['fact_academic'] = success
        else:
            logger.warning(f"No academic_records data found for timestamp {raw_timestamp}")
            results['fact_academic'] = False
    except Exception as e:
        logger.error(f"Error transforming academic fact: {str(e)}")
        results['fact_academic'] = False
    
    # Transform grade fact (requires registrations to get dimensions references)
    try:
        logger.info("Transforming fact: grade")
        grades_df = read_dataframe_from_minio(
            minio_client, 
            "raw", 
            f"{raw_timestamp}/postgres/grades.parquet"
        )
        
        registrations_df = read_dataframe_from_minio(
            minio_client, 
            "raw", 
            f"{raw_timestamp}/postgres/registrations.parquet"
        )
        
        if grades_df is not None and not grades_df.empty and registrations_df is not None and not registrations_df.empty:
            df_transformed = transform_fact_grade(grades_df, registrations_df)
            success = upload_dataframe_to_minio(
                minio_client,
                df_transformed,
                "processed",
                f"{process_timestamp}/facts/fact_grade.parquet"
            )
            results['fact_grade'] = success
        else:
            logger.warning(f"No grades or registrations data found for timestamp {raw_timestamp}")
            results['fact_grade'] = False
    except Exception as e:
        logger.error(f"Error transforming grade fact: {str(e)}")
        results['fact_grade'] = False
    
    # Transform attendance fact
    try:
        logger.info("Transforming fact: attendance")
        attendance_df = read_dataframe_from_minio(
            minio_client, 
            "raw", 
            f"{raw_timestamp}/attendance/attendance.parquet"
        )
        
        class_schedules_df = read_dataframe_from_minio(
            minio_client, 
            "raw", 
            f"{raw_timestamp}/postgres/class_schedules.parquet"
        )
        
        if attendance_df is not None and not attendance_df.empty and class_schedules_df is not None and not class_schedules_df.empty:
            df_transformed = transform_fact_attendance(attendance_df, class_schedules_df)
            success = upload_dataframe_to_minio(
                minio_client,
                df_transformed,
                "processed",
                f"{process_timestamp}/facts/fact_attendance.parquet"
            )
            results['fact_attendance'] = success
        else:
            logger.warning(f"No attendance or class_schedules data found for timestamp {raw_timestamp}")
            results['fact_attendance'] = False
    except Exception as e:
        logger.error(f"Error transforming attendance fact: {str(e)}")
        results['fact_attendance'] = False
    
    return results


def create_transformation_manifest(
    minio_client, 
    raw_timestamp: str, 
    process_timestamp: str,
    dimension_results: Dict[str, bool],
    fact_results: Dict[str, bool]
) -> bool:
    """
    Create and upload a manifest for the transformation process
    
    Args:
        minio_client: MinIO client instance
        raw_timestamp: Raw data timestamp that was processed
        process_timestamp: Processing timestamp
        dimension_results: Results of dimension transformations
        fact_results: Results of fact transformations
        
    Returns:
        True if successful, False otherwise
    """
    try:
        # Count successful transformations
        successful_dimensions = sum(1 for result in dimension_results.values() if result)
        successful_facts = sum(1 for result in fact_results.values() if result)
        total_success = successful_dimensions + successful_facts
        total_count = len(dimension_results) + len(fact_results)
        
        # Create manifest data
        manifest = {
            "transformation_time": datetime.now().isoformat(),
            "raw_timestamp": raw_timestamp,
            "process_timestamp": process_timestamp,
            "success_rate": f"{total_success}/{total_count}",
            "dimensions": {
                "success_count": successful_dimensions,
                "total_count": len(dimension_results),
                "details": dimension_results
            },
            "facts": {
                "success_count": successful_facts,
                "total_count": len(fact_results),
                "details": fact_results
            }
        }
        
        # Upload manifest
        object_name = f"{process_timestamp}/_manifest.json"
        success = upload_json_to_minio(
            minio_client,
            manifest,
            "processed",
            object_name
        )
        
        if success:
            logger.info(f"Transformation manifest uploaded: {object_name}")
        else:
            logger.error("Failed to upload transformation manifest")
            
        return success
    except Exception as e:
        logger.error(f"Error creating transformation manifest: {str(e)}")
        return False


def transform_raw_to_processed(raw_timestamp: Optional[str] = None) -> bool:
    """
    Main function to transform raw data to processed star schema format
    
    Args:
        raw_timestamp: Optional specific raw timestamp to process. 
                      If None, the latest raw timestamp will be used.
                      
    Returns:
        True if successful, False if any major step failed
    """
    try:
        logger.info("Starting transformation: raw to processed")
        
        # Get MinIO client
        minio_client = get_minio_client()
        
        # Ensure required buckets exist
        if not ensure_buckets_exist(minio_client, ["raw", "processed"]):
            logger.error("Failed to ensure required buckets exist")
            return False
        
        # Get the raw timestamp to process
        if not raw_timestamp:
            raw_timestamp = get_latest_timestamp_from_bucket(minio_client, "raw")
            if not raw_timestamp:
                logger.error("No raw data timestamps found to process")
                return False
        
        logger.info(f"Processing raw data from timestamp: {raw_timestamp}")
        
        # Generate processing timestamp
        process_timestamp = generate_timestamp()
        logger.info(f"Using process timestamp: {process_timestamp}")
        
        # Transform dimensions
        logger.info("Transforming dimension tables...")
        dimension_results = transform_dimensions(minio_client, raw_timestamp, process_timestamp)
        
        # Check if critical dimensions were processed successfully
        critical_dimensions = ['dim_student', 'dim_course', 'dim_semester']
        critical_success = all(dimension_results.get(dim, False) for dim in critical_dimensions)
        
        if not critical_success:
            logger.error("Failed to transform critical dimensions, aborting fact transformation")
            # Still create a manifest to record the failure
            create_transformation_manifest(
                minio_client, 
                raw_timestamp, 
                process_timestamp,
                dimension_results,
                {}
            )
            return False
        
        # Transform facts
        logger.info("Transforming fact tables...")
        fact_results = transform_facts(minio_client, raw_timestamp, process_timestamp)
        
        # Create and upload manifest
        logger.info("Creating transformation manifest...")
        manifest_success = create_transformation_manifest(
            minio_client, 
            raw_timestamp, 
            process_timestamp,
            dimension_results,
            fact_results
        )
        
        if not manifest_success:
            logger.warning("Failed to create transformation manifest, but data was processed")
        
        # Check overall success
        total_success = sum(1 for result in list(dimension_results.values()) + list(fact_results.values()) if result)
        total_count = len(dimension_results) + len(fact_results)
        
        logger.info(f"Transformation complete: {total_success}/{total_count} tables processed successfully")
        logger.info(f"Processed data available with timestamp: {process_timestamp}")
        
        return True
        
    except Exception as e:
        logger.error(f"Error in transform_raw_to_processed: {str(e)}")
        return False


if __name__ == "__main__":
    transform_raw_to_processed()
