"""
Fungsi-fungsi transformasi untuk dimension tables dengan denormalisasi
sesuai dengan skema referensi warehouse
"""

import pandas as pd
import logging

logger = logging.getLogger('dim_transforms')

def transform_dim_room(df: pd.DataFrame) -> pd.DataFrame:
    """
    Transform room data to dim_room format
    
    Args:
        df: Raw room data
        
    Returns:
        Transformed DataFrame
    """
    # Transform - rename columns to match warehouse schema
    df_transformed = df.rename(columns={
        'id': 'room_id',
        'room_number': 'room_number',
        'building': 'building',
        'capacity': 'capacity'
    })
    
    # Select only needed columns
    df_transformed = df_transformed[['room_id', 'room_number', 'building', 'capacity']]
    
    return df_transformed


# Faculty and Program dimensions are no longer needed as separate tables
# They are denormalized into student, course, and lecturer dimensions


def transform_dim_student(df: pd.DataFrame, programs_df: pd.DataFrame = None, faculties_df: pd.DataFrame = None) -> pd.DataFrame:
    """
    Transform student data to denormalized dim_student format (includes program and faculty data)
    
    Args:
        df: Raw student data
        programs_df: Programs data for joining
        faculties_df: Faculties data for joining
        
    Returns:
        Transformed DataFrame with denormalized structure matching the warehouse schema
    """
    if df.empty:
        logger.warning("Empty students dataframe provided")
        return pd.DataFrame()
        
    # Create a copy to avoid modifying the original
    students = df.copy()
    
    # Start with basic student data
    result = pd.DataFrame()
    result['student_id'] = students['id']
    result['npm'] = students['npm']
    result['name'] = students['name']
    result['email'] = students['email']
    result['enrollment_date'] = students['enrollment_date']
    result['is_active'] = students['is_active']
    
    # Initialize program and faculty columns with None
    result['program_code'] = None
    result['program_name'] = None
    result['faculty_code'] = None
    result['faculty_name'] = None
    
    # If we have programs data, add program details
    if programs_df is not None and not programs_df.empty and 'program_id' in students.columns:
        programs = programs_df.copy()
        
        # Create a mapping from program_id to program details
        program_mapping = {}
        for _, program in programs.iterrows():
            program_mapping[program['id']] = {
                'program_code': program['program_code'],
                'program_name': program['program_name'],
                'faculty_id': program['faculty_id']
            }
        
        # Apply the mapping to each student
        for idx, student in result.iterrows():
            student_row = students.loc[students['id'] == student['student_id']].iloc[0]
            program_id = student_row['program_id']
            
            if program_id in program_mapping:
                result.at[idx, 'program_code'] = program_mapping[program_id]['program_code']
                result.at[idx, 'program_name'] = program_mapping[program_id]['program_name']
                
                # If we have faculties data, add faculty details
                if faculties_df is not None and not faculties_df.empty:
                    faculties = faculties_df.copy()
                    faculty_id = program_mapping[program_id]['faculty_id']
                    
                    faculty_row = faculties.loc[faculties['id'] == faculty_id]
                    if not faculty_row.empty:
                        result.at[idx, 'faculty_code'] = faculty_row.iloc[0]['faculty_code']
                        result.at[idx, 'faculty_name'] = faculty_row.iloc[0]['faculty_name']
    
    # Ensure all required columns exist and are in the right order as per schema
    required_columns = [
        'student_id', 'npm', 'name', 'email', 'enrollment_date', 'is_active',
        'program_code', 'program_name', 'faculty_code', 'faculty_name'
    ]
    
    for col in required_columns:
        if col not in result.columns:
            result[col] = None
    
    return result[required_columns]


def transform_dim_course(df: pd.DataFrame, programs_df: pd.DataFrame = None, faculties_df: pd.DataFrame = None) -> pd.DataFrame:
    """
    Transform course data to denormalized dim_course format (includes program and faculty data)
    
    Args:
        df: Raw course data
        programs_df: Programs data for joining
        faculties_df: Faculties data for joining
        
    Returns:
        Transformed DataFrame with denormalized structure matching warehouse schema
    """
    if df.empty:
        logger.warning("Empty courses dataframe provided")
        return pd.DataFrame()
    
    # Create a copy to avoid modifying the original
    courses = df.copy()
    
    # Start with basic course data
    result = pd.DataFrame()
    result['course_id'] = courses['id']
    result['course_code'] = courses['course_code']
    result['course_name'] = courses['course_name']
    result['credits'] = courses['credits']
    
    # Initialize program and faculty columns with None
    result['program_code'] = None
    result['program_name'] = None
    result['faculty_code'] = None
    result['faculty_name'] = None
    
    # If we have programs data, add program details
    if programs_df is not None and not programs_df.empty and 'program_id' in courses.columns:
        programs = programs_df.copy()
        
        # Create a mapping from program_id to program details
        program_mapping = {}
        for _, program in programs.iterrows():
            program_mapping[program['id']] = {
                'program_code': program['program_code'],
                'program_name': program['program_name'],
                'faculty_id': program['faculty_id']
            }
        
        # Apply the mapping to each course
        for idx, course in result.iterrows():
            course_row = courses.loc[courses['id'] == course['course_id']].iloc[0]
            program_id = course_row['program_id']
            
            if program_id in program_mapping:
                result.at[idx, 'program_code'] = program_mapping[program_id]['program_code']
                result.at[idx, 'program_name'] = program_mapping[program_id]['program_name']
                
                # If we have faculties data, add faculty details
                if faculties_df is not None and not faculties_df.empty:
                    faculties = faculties_df.copy()
                    faculty_id = program_mapping[program_id]['faculty_id']
                    
                    faculty_row = faculties.loc[faculties['id'] == faculty_id]
                    if not faculty_row.empty:
                        result.at[idx, 'faculty_code'] = faculty_row.iloc[0]['faculty_code']
                        result.at[idx, 'faculty_name'] = faculty_row.iloc[0]['faculty_name']
    
    # Ensure all required columns exist and are in the right order as per schema
    required_columns = [
        'course_id', 'course_code', 'course_name', 'credits',
        'program_code', 'program_name', 'faculty_code', 'faculty_name'
    ]
    
    for col in required_columns:
        if col not in result.columns:
            result[col] = None
    
    return result[required_columns]


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


def transform_dim_lecturer(df: pd.DataFrame, faculties_df: pd.DataFrame = None) -> pd.DataFrame:
    """
    Transform lecturer data to denormalized dim_lecturer format (includes faculty data)
    
    Args:
        df: Raw lecturer data
        faculties_df: Faculties data for joining
        
    Returns:
        Transformed DataFrame with denormalized structure matching warehouse schema
    """
    if df.empty:
        logger.warning("Empty lecturers dataframe provided")
        return pd.DataFrame()
    
    # Create a copy to avoid modifying the original
    lecturers = df.copy()
    
    # Start with basic lecturer data
    result = pd.DataFrame()
    result['lecturer_id'] = lecturers['id']
    result['nip'] = lecturers['nip']
    result['name'] = lecturers['name']
    result['email'] = lecturers['email']
    
    # Initialize faculty columns with None
    result['faculty_code'] = None
    result['faculty_name'] = None
    
    # If we have faculties data, add faculty details
    if faculties_df is not None and not faculties_df.empty and 'faculty_id' in lecturers.columns:
        faculties = faculties_df.copy()
        
        # Create a mapping from faculty_id to faculty details
        faculty_mapping = {}
        for _, faculty in faculties.iterrows():
            faculty_mapping[faculty['id']] = {
                'faculty_code': faculty['faculty_code'],
                'faculty_name': faculty['faculty_name']
            }
        
        # Apply the mapping to each lecturer
        for idx, lecturer in result.iterrows():
            lecturer_row = lecturers.loc[lecturers['id'] == lecturer['lecturer_id']].iloc[0]
            faculty_id = lecturer_row['faculty_id']
            
            if faculty_id in faculty_mapping:
                result.at[idx, 'faculty_code'] = faculty_mapping[faculty_id]['faculty_code']
                result.at[idx, 'faculty_name'] = faculty_mapping[faculty_id]['faculty_name']
    
    # Ensure all required columns exist and are in the right order as per schema
    required_columns = [
        'lecturer_id', 'nip', 'name', 'email',
        'faculty_code', 'faculty_name'
    ]
    
    for col in required_columns:
        if col not in result.columns:
            result[col] = None
    
    return result[required_columns]


def transform_dim_class(df: pd.DataFrame, rooms_df: pd.DataFrame = None, 
                   courses_df: pd.DataFrame = None, lecturers_df: pd.DataFrame = None,
                   semesters_df: pd.DataFrame = None) -> pd.DataFrame:
    """
    Transform class_schedules to denormalized dim_class format
    
    Args:
        df: Raw class_schedules data
        rooms_df: Optional rooms data for joining
        courses_df: Optional courses data for joining
        lecturers_df: Optional lecturers data for joining
        semesters_df: Optional semesters data for joining
        
    Returns:
        Transformed DataFrame with denormalized structure matching warehouse schema
    """
    if df.empty:
        logger.warning("Empty class_schedules dataframe provided")
        return pd.DataFrame()
    
    # Create a copy to avoid modifying the original
    classes = df.copy()
    
    # Start with basic class data
    result = pd.DataFrame()
    result['class_id'] = classes['id']
    result['class_code'] = 'C' + classes['course_id'].astype(str) + \
                          '-S' + classes['semester_id'].astype(str) + \
                          '-L' + classes['lecturer_id'].astype(str)
    result['day_of_week'] = classes['day_of_week']
    result['start_time'] = classes['start_time']
    result['end_time'] = classes['end_time']
    
    # Initialize all denormalized columns with None
    result['course_code'] = None
    result['course_name'] = None
    result['lecturer_name'] = None
    result['room_number'] = None
    result['semester_code'] = None
    result['academic_year'] = None
    
    # Add course information if available
    if courses_df is not None and not courses_df.empty:
        courses = courses_df.copy()
        course_mapping = {}
        for _, course in courses.iterrows():
            course_mapping[course['id']] = {
                'course_code': course['course_code'],
                'course_name': course['course_name']
            }
            
        for idx, class_row in result.iterrows():
            class_data = classes.loc[classes['id'] == class_row['class_id']].iloc[0]
            course_id = class_data['course_id']
            
            if course_id in course_mapping:
                result.at[idx, 'course_code'] = course_mapping[course_id]['course_code']
                result.at[idx, 'course_name'] = course_mapping[course_id]['course_name']
    
    # Add lecturer information if available
    if lecturers_df is not None and not lecturers_df.empty:
        lecturers = lecturers_df.copy()
        lecturer_mapping = {}
        for _, lecturer in lecturers.iterrows():
            lecturer_mapping[lecturer['id']] = lecturer['name']
            
        for idx, class_row in result.iterrows():
            class_data = classes.loc[classes['id'] == class_row['class_id']].iloc[0]
            lecturer_id = class_data['lecturer_id']
            
            if lecturer_id in lecturer_mapping:
                result.at[idx, 'lecturer_name'] = lecturer_mapping[lecturer_id]
    
    # Add room information if available
    if rooms_df is not None and not rooms_df.empty:
        rooms = rooms_df.copy()
        room_mapping = {}
        for _, room in rooms.iterrows():
            room_mapping[room['id']] = room['room_number']
            
        for idx, class_row in result.iterrows():
            class_data = classes.loc[classes['id'] == class_row['class_id']].iloc[0]
            room_id = class_data['room_id']
            
            if room_id in room_mapping:
                result.at[idx, 'room_number'] = room_mapping[room_id]
    
    # Add semester information if available
    if semesters_df is not None and not semesters_df.empty:
        semesters = semesters_df.copy()
        semester_mapping = {}
        for _, semester in semesters.iterrows():
            semester_mapping[semester['id']] = semester['semester_code']
            
        for idx, class_row in result.iterrows():
            class_data = classes.loc[classes['id'] == class_row['class_id']].iloc[0]
            semester_id = class_data['semester_id']
            
            if semester_id in semester_mapping:
                semester_code = semester_mapping[semester_id]
                result.at[idx, 'semester_code'] = semester_code
                
                # Extract academic year from semester code
                try:
                    if '/' in semester_code:
                        year_part = semester_code.split('/')[1]
                        if year_part.isdigit():
                            year = int(year_part)
                            result.at[idx, 'academic_year'] = f"{year}/{year+1}"
                        else:
                            result.at[idx, 'academic_year'] = f"AY-{semester_code}"
                    else:
                        result.at[idx, 'academic_year'] = f"AY-{semester_code}"
                except (ValueError, IndexError):
                    result.at[idx, 'academic_year'] = f"AY-{semester_code}"
    
    # Ensure all required columns exist and are in the right order as per schema
    required_columns = [
        'class_id', 'class_code', 'course_code', 'course_name', 'lecturer_name',
        'room_number', 'day_of_week', 'start_time', 'end_time',
        'semester_code', 'academic_year'
    ]
    
    for col in required_columns:
        if col not in result.columns:
            result[col] = None
    
    return result[required_columns]
