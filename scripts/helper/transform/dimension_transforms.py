"""
Fungsi-fungsi transformasi untuk dimension tables
"""

import pandas as pd
import logging

logger = logging.getLogger('dim_transforms')

def transform_dim_faculty(df: pd.DataFrame) -> pd.DataFrame:
    """
    Transform faculty data to dim_faculty format
    
    Args:
        df: Raw faculty data
        
    Returns:
        Transformed DataFrame
    """
    # Transform - rename columns to match warehouse schema
    df_transformed = df.rename(columns={
        'id': 'faculty_id',
        'faculty_code': 'faculty_code',
        'faculty_name': 'faculty_name'
    })
    
    # Select only needed columns
    df_transformed = df_transformed[['faculty_id', 'faculty_code', 'faculty_name']]
    
    return df_transformed


def transform_dim_program(df: pd.DataFrame) -> pd.DataFrame:
    """
    Transform program data to dim_program format
    
    Args:
        df: Raw program data
        
    Returns:
        Transformed DataFrame
    """
    # Transform - rename columns to match warehouse schema
    df_transformed = df.rename(columns={
        'id': 'program_id',
        'program_code': 'program_code',
        'program_name': 'program_name',
        'faculty_id': 'faculty_id'
    })
    
    # Select only needed columns
    df_transformed = df_transformed[['program_id', 'program_code', 'program_name', 'faculty_id']]
    
    return df_transformed


def transform_dim_student(df: pd.DataFrame) -> pd.DataFrame:
    """
    Transform student data to dim_student format
    
    Args:
        df: Raw student data
        
    Returns:
        Transformed DataFrame
    """
    # Transform - rename columns to match warehouse schema
    df_transformed = df.rename(columns={
        'id': 'student_id',
        'npm': 'npm',
        'username': 'username',
        'name': 'name',
        'email': 'email',
        'enrollment_date': 'enrollment_date',
        'is_active': 'is_active',
        'program_id': 'program_id'
    })
    
    # Select only needed columns
    df_transformed = df_transformed[[
        'student_id', 'npm', 'username', 'name', 'email', 
        'enrollment_date', 'is_active', 'program_id'
    ]]
    
    return df_transformed


def transform_dim_course(df: pd.DataFrame) -> pd.DataFrame:
    """
    Transform course data to dim_course format
    
    Args:
        df: Raw course data
        
    Returns:
        Transformed DataFrame
    """
    # Transform - rename columns to match warehouse schema
    df_transformed = df.rename(columns={
        'id': 'course_id',
        'course_code': 'course_code',
        'course_name': 'course_name',
        'credits': 'credits',
        'program_id': 'program_id'
    })
    
    # Select only needed columns
    df_transformed = df_transformed[['course_id', 'course_code', 'course_name', 'credits', 'program_id']]
    
    return df_transformed


def transform_dim_semester(df: pd.DataFrame) -> pd.DataFrame:
    """
    Transform semester data to dim_semester format
    
    Args:
        df: Raw semester data
        
    Returns:
        Transformed DataFrame
    """
    # Transform - rename columns to match warehouse schema
    df_transformed = df.rename(columns={
        'id': 'semester_id',
        'semester_code': 'semester_code',
        'start_date': 'start_date',
        'end_date': 'end_date'
    })
    
    # Extract academic year from semester code
    # Format from semester_faker.py: "{semester['code']}/{year}" (e.g., "1/2022" or "2/2022")
    def extract_academic_year(semester_code):
        if not semester_code:
            return "Unknown"
            
        try:
            # Parse the "X/YYYY" format from semester_faker.py
            if '/' in semester_code:
                year_part = semester_code.split('/')[1]
                if year_part.isdigit():
                    year = int(year_part)
                    return f"{year}/{year+1}"
        except (ValueError, IndexError):
            pass
            
        # If format doesn't match expected pattern, return as is
        return f"AY-{semester_code}"
    
    # Add academic_year column
    df_transformed['academic_year'] = df_transformed['semester_code'].apply(extract_academic_year)
    
    # Select only needed columns
    df_transformed = df_transformed[['semester_id', 'semester_code', 'start_date', 'end_date', 'academic_year']]
    
    return df_transformed


def transform_dim_lecturer(df: pd.DataFrame) -> pd.DataFrame:
    """
    Transform lecturer data to dim_lecturer format
    
    Args:
        df: Raw lecturer data
        
    Returns:
        Transformed DataFrame
    """
    # Transform - rename columns to match warehouse schema
    df_transformed = df.rename(columns={
        'id': 'lecturer_id',
        'nip': 'lecturer_code',
        'name': 'name',
        'email': 'email',
        'faculty_id': 'faculty_id'
    })
    
    # Add department column (not in raw data, using NULL)
    df_transformed['department'] = None
    
    # Select only needed columns
    df_transformed = df_transformed[['lecturer_id', 'lecturer_code', 'name', 'email', 'department', 'faculty_id']]
    
    return df_transformed


def transform_dim_class(df: pd.DataFrame, rooms_df: pd.DataFrame = None) -> pd.DataFrame:
    """
    Transform class_schedules to dim_class
    
    Args:
        df: Raw class_schedules data
        rooms_df: Optional rooms data for joining
        
    Returns:
        Transformed DataFrame
    """
    # Join with rooms to get room number if rooms_df is provided
    if rooms_df is not None and not rooms_df.empty:
        df = pd.merge(df, rooms_df, left_on='room_id', right_on='id', how='left')
    
    # Generate class_code (e.g., "COURSE1-SEM1-LEC1")
    df['class_code'] = 'C' + df['course_id'].astype(str) + '-S' + df['semester_id'].astype(str) + '-L' + df['lecturer_id'].astype(str)
    
    # Rename the ID column to class_id (handling both merged and non-merged cases)
    # When merged with rooms_df, class_schedules.id becomes id_x
    # When not merged, the original id column is used
    column_mapping = {}
    
    # Handle ID column - map to class_id in warehouse
    if 'id_x' in df.columns:  # Merged case: class_schedules.id became id_x
        column_mapping['id_x'] = 'class_id'
    else:  # Non-merged case: use original id column
        column_mapping['id'] = 'class_id'
    
    # Add other column mappings
    column_mapping.update({
        'course_id': 'course_id',
        'lecturer_id': 'lecturer_id',
        'semester_id': 'semester_id',
        'day_of_week': 'day_of_week',
        'start_time': 'start_time',
        'end_time': 'end_time'
    })
    
    # Handle room column if available
    if 'room_number' in df.columns:  # Merged case: got room_number from rooms table
        column_mapping['room_number'] = 'room'
    
    # Apply the column mapping
    df_transformed = df.rename(columns=column_mapping)
    
    # If room column wasn't created from join, create empty one
    if 'room' not in df_transformed.columns:
        df_transformed['room'] = None
    
    # Select only needed columns
    df_transformed = df_transformed[[
        'class_id', 'class_code', 'course_id', 'lecturer_id', 
        'semester_id', 'room', 'day_of_week', 'start_time', 'end_time'
    ]]
    
    return df_transformed
