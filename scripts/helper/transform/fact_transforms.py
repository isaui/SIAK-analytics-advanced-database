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
    if df.empty:
        return pd.DataFrame()
    
    # Print data types for debugging
    print(f"Attendance class_schedule_id dtype: {df['class_schedule_id'].dtype}")
    print(f"Class schedules id dtype: {class_schedules_df['id'].dtype}")
    
    # Make copies to avoid modifying original dataframes
    attendance_df = df.copy()
    schedules_df = class_schedules_df.copy()
    
    # Ensure consistent data types for join columns
    attendance_df['class_schedule_id'] = attendance_df['class_schedule_id'].astype(int)
    schedules_df['id'] = schedules_df['id'].astype(int)
    
    # Rename class_schedules columns to avoid confusion
    schedules_df = schedules_df.rename(columns={'id': 'class_id'})
    
    # Join attendance with class_schedules
    try:
        merged_df = pd.merge(
            attendance_df, 
            schedules_df,
            left_on='class_schedule_id',
            right_on='class_id',
            how='inner'
        )
    except Exception as e:
        print(f"Error during merge: {str(e)}")
        # Alternative approach if merge fails
        print("Trying alternative approach with explicit type conversion")
        attendance_df['class_schedule_id'] = attendance_df['class_schedule_id'].astype(str)
        schedules_df['class_id'] = schedules_df['class_id'].astype(str)
        merged_df = pd.merge(
            attendance_df, 
            schedules_df,
            left_on='class_schedule_id',
            right_on='class_id',
            how='inner'
        )
    
    # Create attendance_id as index
    merged_df = merged_df.reset_index(drop=True)
    merged_df['attendance_id'] = merged_df.index + 1
    
    # Resolve any column name conflicts
    column_mapping = {}
    # Handle potential suffixes from merge
    if 'student_id_x' in merged_df.columns:
        column_mapping['student_id_x'] = 'student_id'
    if 'course_id_x' in merged_df.columns:
        column_mapping['course_id_x'] = 'course_id'
    
    # Apply column renaming if needed
    if column_mapping:
        merged_df = merged_df.rename(columns=column_mapping)
    
    # Ensure class_id is included
    if 'class_id' not in merged_df.columns and 'class_schedule_id' in merged_df.columns:
        merged_df['class_id'] = merged_df['class_schedule_id']
    
    # Transform to match warehouse schema
    column_mapping = {
        'semester_id': 'semester_id',
        'meeting_date': 'attendance_date',
        'check_in_time': 'check_in_time'
    }
    
    # Apply remaining column renaming
    merged_df = merged_df.rename(columns=column_mapping)
    
    # Select only needed columns
    needed_columns = [
        'attendance_id', 'student_id', 'course_id', 'class_id',
        'attendance_date', 'check_in_time'
    ]
    
    # Ensure all needed columns exist
    for col in needed_columns:
        if col not in merged_df.columns:
            print(f"Warning: Column {col} missing from merged dataframe")
            merged_df[col] = None
    
    # Create the final transformed dataframe with only the needed columns
    df_transformed = merged_df[needed_columns]
    
    return df_transformed
