"""
Fungsi-fungsi transformasi untuk fact tables
"""

import pandas as pd
import logging

logger = logging.getLogger('fact_transforms')

def transform_fact_registration(df: pd.DataFrame) -> pd.DataFrame:
    """
    Transform registrations to fact_registration
    
    Args:
        df: Raw registration data
        
    Returns:
        Transformed DataFrame
    """
    # Transform - rename columns to match warehouse schema
    df_transformed = df.rename(columns={
        'id': 'registration_id',
        'student_id': 'student_id',
        'course_id': 'course_id',
        'semester_id': 'semester_id',
        'registration_date': 'registration_date'
    })
    
    # Select only needed columns
    df_transformed = df_transformed[[
        'registration_id', 'student_id', 'course_id', 
        'semester_id', 'registration_date'
    ]]
    
    return df_transformed


def transform_fact_fee(df: pd.DataFrame) -> pd.DataFrame:
    """
    Transform semester_fees to fact_fee
    
    Args:
        df: Raw semester_fees data
        
    Returns:
        Transformed DataFrame
    """
    # Transform - rename columns to match warehouse schema
    df_transformed = df.rename(columns={
        'id': 'fee_id',
        'student_id': 'student_id',
        'semester_id': 'semester_id',
        'fee_amount': 'fee_amount',
        'payment_date': 'payment_date'
    })
    
    # Select only needed columns
    df_transformed = df_transformed[[
        'fee_id', 'student_id', 'semester_id', 'fee_amount', 'payment_date'
    ]]
    
    return df_transformed


def transform_fact_academic(df: pd.DataFrame) -> pd.DataFrame:
    """
    Transform academic_records to fact_academic
    
    Args:
        df: Raw academic_records data
        
    Returns:
        Transformed DataFrame
    """
    # Transform - rename columns to match warehouse schema
    df_transformed = df.rename(columns={
        'id': 'academic_id',
        'student_id': 'student_id',
        'semester_id': 'semester_id',
        'semester_gpa': 'semester_gpa',
        'cumulative_gpa': 'cumulative_gpa',
        'semester_credits': 'semester_credits',
        'credits_passed': 'credits_passed',
        'total_credits': 'total_credits'
    })
    
    # Select only needed columns
    df_transformed = df_transformed[[
        'academic_id', 'student_id', 'semester_id', 'semester_gpa', 
        'cumulative_gpa', 'semester_credits', 'credits_passed', 'total_credits'
    ]]
    
    return df_transformed


def transform_fact_grade(df: pd.DataFrame, registrations_df: pd.DataFrame) -> pd.DataFrame:
    """
    Transform grades to fact_grade
    
    Args:
        df: Raw grades data
        registrations_df: Registrations data for joining
        
    Returns:
        Transformed DataFrame
    """
    # We need to join with registrations to get student_id, course_id, and semester_id
    # Join grades with registrations
    df = pd.merge(df, registrations_df, left_on='registration_id', right_on='id')
    
    # Transform - rename columns to match warehouse schema
    df_transformed = df.rename(columns={
        'id_x': 'grade_id',
        'student_id': 'student_id',
        'course_id': 'course_id',
        'semester_id': 'semester_id',
        'final_grade': 'final_grade',
        'letter_grade': 'letter_grade'
    })
    
    # Select only needed columns
    df_transformed = df_transformed[[
        'grade_id', 'student_id', 'course_id', 'semester_id', 
        'final_grade', 'letter_grade'
    ]]
    
    return df_transformed


def transform_fact_attendance(df: pd.DataFrame, class_schedules_df: pd.DataFrame) -> pd.DataFrame:
    """
    Transform attendance to fact_attendance
    
    Args:
        df: Raw attendance data
        class_schedules_df: Class schedules data for joining
        
    Returns:
        Transformed DataFrame
    """
    # Rename class_schedules columns to avoid confusion
    class_schedules_df = class_schedules_df.rename(columns={'id': 'class_id'})
    
    # Join attendance with class_schedules
    df = pd.merge(
        df, 
        class_schedules_df,
        left_on='class_schedule_id',
        right_on='class_id',
        how='inner'
    )
    
    # Create attendance_id as index
    df = df.reset_index()
    df['attendance_id'] = df.index + 1
    
    # Transform to match warehouse schema
    df_transformed = df.rename(columns={
        'student_id_x': 'student_id' if 'student_id_x' in df.columns else 'student_id',
        'course_id_x': 'course_id' if 'course_id_x' in df.columns else 'course_id',
        'class_id': 'class_id',
        'semester_id': 'semester_id',
        'meeting_date': 'attendance_date',
        'check_in_time': 'check_in_time'
    })
    
    # Select only needed columns
    df_transformed = df_transformed[[
        'attendance_id', 'student_id', 'course_id', 'class_id',
        'semester_id', 'attendance_date', 'check_in_time'
    ]]
    
    return df_transformed
