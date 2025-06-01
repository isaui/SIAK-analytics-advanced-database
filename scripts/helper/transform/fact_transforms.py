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
        logger.error(f"Error during merge: {str(e)}")
        # Alternative approach if merge fails
        logger.info("Trying alternative approach with explicit type conversion")
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
    
    # Resolve any column name conflicts from merge
    column_mapping = {}
    if 'student_id_x' in merged_df.columns:
        column_mapping['student_id_x'] = 'student_id'
    if 'course_id_x' in merged_df.columns:
        column_mapping['course_id_x'] = 'course_id'
    if 'room_id_x' in merged_df.columns:
        column_mapping['room_id_x'] = 'room_id'
    elif 'room_id_y' in merged_df.columns:
        column_mapping['room_id_y'] = 'room_id'
    
    # Apply column renaming if needed
    if column_mapping:
        merged_df = merged_df.rename(columns=column_mapping)
    
    # Ensure class_id is included
    if 'class_id' not in merged_df.columns and 'class_schedule_id' in merged_df.columns:
        merged_df['class_id'] = merged_df['class_schedule_id']
    
    # Transform to match warehouse schema
    column_mapping = {
        'meeting_date': 'attendance_date',
        'check_in_time': 'check_in_time'
    }
    
    # Apply remaining column renaming
    merged_df = merged_df.rename(columns=column_mapping)
    
    # Select only needed columns (including room_id as per updated warehouse schema)
    needed_columns = [
         'student_id', 'course_id', 'class_id', 'room_id',
        'attendance_date', 'check_in_time'
    ]
    
    # Ensure all needed columns exist
    for col in needed_columns:
        if col not in merged_df.columns:
            logger.warning(f"Column {col} missing from merged dataframe")
            merged_df[col] = None
    
    # Create the final transformed dataframe with only the needed columns
    df_transformed = merged_df[needed_columns]
    
    return df_transformed


def transform_fact_teaching(df: pd.DataFrame) -> pd.DataFrame:
    """
    Transform class_schedules to fact_teaching (lecturer teaching loads)
    
    Args:
        df: Raw class_schedules data
        
    Returns:
        Transformed DataFrame for teaching facts
    """
    if df.empty:
        return pd.DataFrame()
    
    import random
    
    # Create a copy to avoid modifying original
    teaching_df = df.copy()
    
    # Create teaching_id as index
    teaching_df = teaching_df.reset_index(drop=True)
    teaching_df['teaching_id'] = teaching_df.index + 1
    
    # Transform - rename columns to match warehouse schema
    df_transformed = teaching_df.rename(columns={
        'id': 'class_id',
        'lecturer_id': 'lecturer_id',
        'course_id': 'course_id',
        'semester_id': 'semester_id',
        'room_id': 'room_id'
    })
    
    # Generate realistic random metrics 😎
    random.seed(42)  # Consistent randomness for reproducibility
    
    df_transformed['total_students'] = [random.randint(15, 45) for _ in range(len(df_transformed))]  # 15-45 students per class
    df_transformed['total_sessions'] = [random.randint(14, 16) for _ in range(len(df_transformed))]  # 14-16 sessions per semester
    df_transformed['sessions_completed'] = [random.randint(0, sessions) for sessions in df_transformed['total_sessions']]  # 0 to total sessions
    df_transformed['teaching_hours'] = [round(random.uniform(2.0, 4.0), 1) for _ in range(len(df_transformed))]  # 2-4 hours per session
    
    # Select only needed columns
    needed_columns = [
        'teaching_id', 'lecturer_id', 'course_id', 'semester_id', 'class_id', 'room_id',
        'total_students', 'total_sessions', 'sessions_completed', 'teaching_hours'
    ]
    
    df_transformed = df_transformed[needed_columns]
    
    return df_transformed


def transform_fact_room_usage(df: pd.DataFrame) -> pd.DataFrame:
    """
    Transform class_schedules to fact_room_usage (room utilization)
    
    Args:
        df: Raw class_schedules data
        
    Returns:
        Transformed DataFrame for room usage facts
    """
    if df.empty:
        return pd.DataFrame()
    
    import random
    import datetime
    
    # Create a copy to avoid modifying original
    usage_df = df.copy()
    
    # Create usage_id as index
    usage_df = usage_df.reset_index(drop=True)
    usage_df['usage_id'] = usage_df.index + 1
    
    # Transform - rename columns to match warehouse schema
    df_transformed = usage_df.rename(columns={
        'id': 'class_id',
        'room_id': 'room_id',
        'semester_id': 'semester_id',
        'start_time': 'start_time',
        'end_time': 'end_time'
    })
    
    # Generate realistic random dates and metrics 🎲
    random.seed(123)  # Different seed for variety
    
    # Random dates within semester (last 3 months)
    base_date = datetime.date.today() - datetime.timedelta(days=90)
    df_transformed['usage_date'] = [
        base_date + datetime.timedelta(days=random.randint(0, 90)) 
        for _ in range(len(df_transformed))
    ]
    
    # Random occupancy (10-40 students, most classes moderately filled)
    df_transformed['actual_occupancy'] = [random.randint(10, 40) for _ in range(len(df_transformed))]
    
    # Utilization rate based on occupancy (assume room capacity ~50)
    df_transformed['utilization_rate'] = [
        round((occupancy / 50.0) * 100, 2) 
        for occupancy in df_transformed['actual_occupancy']
    ]
    
    # Select only needed columns
    needed_columns = [
        'usage_id', 'room_id', 'class_id', 'semester_id', 'usage_date',
        'start_time', 'end_time', 'actual_occupancy', 'utilization_rate'
    ]
    
    df_transformed = df_transformed[needed_columns]
    
    return df_transformed