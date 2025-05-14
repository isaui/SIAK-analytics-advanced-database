#!/usr/bin/env python
"""
Simulate incremental data changes for SIAK database

This script creates random changes (inserts and updates) for testing CDC functionality.
It uses existing generator modules and update modules to create realistic data changes.
"""

import random
import logging
import argparse
import os
import sys
from datetime import datetime
from dotenv import load_dotenv

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import database connection
from data_sources.siak_pool import get_db_connection

# Import generators for inserts
from generator.student_faker import generate_student
from generator.lecturer_faker import generate_lecturer
from generator.room_faker import generate_room
from generator.semester_faker import generate_semester

# Import updaters
from generator.update.student_updater import update_random_student
from generator.update.grade_updater import update_random_grade
from generator.update.course_updater import update_random_course
from generator.update.lecturer_updater import update_random_lecturer
from generator.update.academic_record_updater import update_random_academic_record

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('simulates_changes')

# Wrapper functions for generators
def insert_random_student():
    """Wrapper for student generation"""
    from data_sources.siak_pool import execute_query
    try:
        # Get a random program for the student
        program_result = execute_query("SELECT id, program_code FROM programs ORDER BY RANDOM() LIMIT 1")
        if not program_result:
            logger.warning("No programs found for student creation")
            return False
            
        program_id = program_result[0]['id']
        program_obj = [{"id": program_id, "program_code": program_result[0]['program_code']}]
        
        # Generate one student
        student = generate_student(program_obj, n=1)[0]
        
        # Check if username or npm already exists
        existing = execute_query(
            "SELECT id FROM students WHERE username = %s OR npm = %s",
            params=(student['username'], student['npm'])
        )
        
        if existing:
            logger.info(f"Student with username {student['username']} or npm {student['npm']} already exists, skipping")
            return False
        
        # Make username unique by adding random numbers if needed
        student['username'] = f"{student['username']}_{random.randint(1000, 9999)}"
        
        # Insert the student
        execute_query(
            """INSERT INTO students 
               (npm, username, name, email, enrollment_date, program_id, is_active) 
               VALUES (%s, %s, %s, %s, %s, %s, %s)""",
            params=(student['npm'], student['username'], student['name'], 
                    student['email'], student['enrollment_date'], 
                    student['program_id'], student['is_active']),
            fetch_none=True
        )
        logger.info(f"Inserted new student: {student['name']} (NPM: {student['npm']})")
        return True
    except Exception as e:
        logger.error(f"Error inserting student: {str(e)}")
        return False


def insert_random_registration():
    """Wrapper for registration generation"""
    from data_sources.siak_pool import execute_query
    try:
        # Get a random student
        student_result = execute_query("SELECT id FROM students ORDER BY RANDOM() LIMIT 1")
        if not student_result:
            logger.warning("No students found for registration creation")
            return False
        
        # Get a random course
        course_result = execute_query("SELECT id FROM courses ORDER BY RANDOM() LIMIT 1")
        if not course_result:
            logger.warning("No courses found for registration creation")
            return False
        
        # Get a random semester
        semester_result = execute_query("SELECT id FROM semesters ORDER BY RANDOM() LIMIT 1")
        if not semester_result:
            logger.warning("No semesters found for registration creation")
            return False
            
        student_id = student_result[0]['id']
        course_id = course_result[0]['id']
        semester_id = semester_result[0]['id']
        
        # Check if registration already exists
        existing = execute_query(
            "SELECT id FROM registrations WHERE student_id = %s AND course_id = %s AND semester_id = %s",
            params=(student_id, course_id, semester_id)
        )
        
        if existing:
            logger.info("Registration already exists, skipping")
            return False
        
        # Create a new registration
        execute_query(
            """INSERT INTO registrations 
               (student_id, course_id, semester_id, registration_date) 
               VALUES (%s, %s, %s, CURRENT_DATE)""",
            params=(student_id, course_id, semester_id),
            fetch_none=True
        )
        logger.info(f"Created new registration for student_id={student_id}, course_id={course_id}")
        return True
    except Exception as e:
        logger.error(f"Error creating registration: {str(e)}")
        return False

def insert_random_grade():
    """Wrapper for grade insertion"""
    from data_sources.siak_pool import execute_query
    try:
        # Find a registration without a grade
        reg_result = execute_query(
            """SELECT r.id 
               FROM registrations r 
               LEFT JOIN grades g ON g.registration_id = r.id 
               WHERE g.id IS NULL
               ORDER BY RANDOM() LIMIT 1"""
        )
        
        if not reg_result:
            logger.warning("No registrations without grades found")
            return False
            
        reg_id = reg_result[0]['id']
        
        # Generate a random grade
        final_grade = round(random.uniform(1.0, 4.0), 2)
        
        # Determine letter grade
        letter_grade = 'E'
        if final_grade >= 3.5:
            letter_grade = 'A'
        elif final_grade >= 3.0:
            letter_grade = 'B'
        elif final_grade >= 2.0:
            letter_grade = 'C'
        elif final_grade >= 1.0:
            letter_grade = 'D'
            
        # Insert the grade
        execute_query(
            """INSERT INTO grades 
               (registration_id, final_grade, letter_grade) 
               VALUES (%s, %s, %s)""",
            params=(reg_id, final_grade, letter_grade),
            fetch_none=True
        )
        logger.info(f"Added new grade: {letter_grade} ({final_grade}) for registration_id={reg_id}")
        return True
    except Exception as e:
        logger.error(f"Error inserting grade: {str(e)}")
        return False

def insert_random_lecturer():
    """Wrapper for lecturer generation"""
    from data_sources.siak_pool import execute_query
    try:
        # Get a random faculty
        faculty_result = execute_query("SELECT id FROM faculties ORDER BY RANDOM() LIMIT 1")
        if not faculty_result:
            logger.warning("No faculties found for lecturer creation")
            return False
            
        faculty_id = faculty_result[0]['id']
        
        # Generate one lecturer
        lecturer = generate_lecturer([{"id": faculty_id}], n=1)[0]
        
        # Insert the lecturer
        execute_query(
            """INSERT INTO lecturers 
               (nip, name, email, faculty_id) 
               VALUES (%s, %s, %s, %s)""",
            params=(lecturer['nip'], lecturer['name'], lecturer['email'], lecturer['faculty_id']),
            fetch_none=True
        )
        logger.info(f"Inserted new lecturer: {lecturer['name']} (NIP: {lecturer['nip']})")
        return True
    except Exception as e:
        logger.error(f"Error inserting lecturer: {str(e)}")
        return False

def insert_random_room():
    """Wrapper for room generation"""
    from data_sources.siak_pool import execute_query
    try:
        # Generate one room
        room = generate_room(n=1)[0]
        
        # Insert the room
        execute_query(
            """INSERT INTO rooms 
               (room_number, building, capacity) 
               VALUES (%s, %s, %s)""",
            params=(room['room_number'], room['building'], room['capacity']),
            fetch_none=True
        )
        logger.info(f"Inserted new room: {room['building']}-{room['room_number']} (Capacity: {room['capacity']})")
        return True
    except Exception as e:
        logger.error(f"Error inserting room: {str(e)}")
        return False

def insert_random_semester():
    """Wrapper for semester generation"""
    from data_sources.siak_pool import execute_query
    try:
        # Generate one semester
        semester = generate_semester(n=1)[0]
        
        # Check if the semester code already exists
        existing = execute_query(
            "SELECT id FROM semesters WHERE semester_code = %s",
            params=(semester['semester_code'],)
        )
        
        if existing:
            logger.info(f"Semester {semester['semester_code']} already exists, skipping")
            return False
        
        # Insert the semester
        execute_query(
            """INSERT INTO semesters 
               (semester_code, start_date, end_date) 
               VALUES (%s, %s, %s)""",
            params=(semester['semester_code'], semester['start_date'], semester['end_date']),
            fetch_none=True
        )
        logger.info(f"Inserted new semester: {semester['semester_code']} ({semester['start_date']} to {semester['end_date']})")
        return True
    except Exception as e:
        logger.error(f"Error inserting semester: {str(e)}")
        return False

def insert_random_class_schedule():
    """Wrapper for class schedule generation"""
    from data_sources.siak_pool import execute_query
    try:
        # Get a random course, lecturer, room, and semester
        course_result = execute_query("SELECT id FROM courses ORDER BY RANDOM() LIMIT 1")
        lecturer_result = execute_query("SELECT id FROM lecturers ORDER BY RANDOM() LIMIT 1")
        room_result = execute_query("SELECT id FROM rooms ORDER BY RANDOM() LIMIT 1")
        semester_result = execute_query("SELECT id FROM semesters ORDER BY RANDOM() LIMIT 1")
        
        if not all([course_result, lecturer_result, room_result, semester_result]):
            logger.warning("Missing required data for class schedule creation")
            return False
            
        course_id = course_result[0]['id']
        lecturer_id = lecturer_result[0]['id']
        room_id = room_result[0]['id']
        semester_id = semester_result[0]['id']
        
        # Define days of week and generate time slots
        days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
        day = random.choice(days)
        
        # Generate random time slots (7am - 5pm)
        start_hour = random.randint(7, 16)  # 7am to 4pm
        start_time = f"{start_hour:02d}:00:00"
        end_hour = min(start_hour + 2, 17)  # Max 2 hours, end by 5pm
        end_time = f"{end_hour:02d}:00:00"
        
        # Check for conflicts (same room, day, and overlapping time)
        conflicts = execute_query(
            """SELECT id FROM class_schedules 
               WHERE room_id = %s AND day_of_week = %s
               AND ((start_time <= %s AND end_time > %s) OR
                    (start_time < %s AND end_time >= %s) OR
                    (start_time >= %s AND end_time <= %s))""",
            params=(room_id, day, end_time, start_time, end_time, start_time, start_time, end_time)
        )
        
        if conflicts:
            logger.info("Room schedule conflict detected, skipping")
            return False
        
        # Insert the class schedule
        execute_query(
            """INSERT INTO class_schedules 
               (course_id, lecturer_id, room_id, semester_id, day_of_week, start_time, end_time) 
               VALUES (%s, %s, %s, %s, %s, %s, %s)""",
            params=(course_id, lecturer_id, room_id, semester_id, day, start_time, end_time),
            fetch_none=True
        )
        logger.info(f"Created new class schedule: course_id={course_id} on {day} at {start_time}-{end_time}")
        return True
    except Exception as e:
        logger.error(f"Error creating class schedule: {str(e)}")
        return False

def insert_random_academic_record():
    """Wrapper for academic record generation"""
    from data_sources.siak_pool import execute_query
    try:
        # Get a random student and semester
        student_result = execute_query("SELECT id FROM students ORDER BY RANDOM() LIMIT 1")
        semester_result = execute_query("SELECT id FROM semesters ORDER BY RANDOM() LIMIT 1")
        
        if not all([student_result, semester_result]):
            logger.warning("Missing required data for academic record creation")
            return False
            
        student_id = student_result[0]['id']
        semester_id = semester_result[0]['id']
        
        # Check if the record already exists
        existing = execute_query(
            "SELECT id FROM academic_records WHERE student_id = %s AND semester_id = %s",
            params=(student_id, semester_id)
        )
        
        if existing:
            logger.info(f"Academic record for student_id={student_id}, semester_id={semester_id} already exists")
            return False
        
        # Generate semester credits (12-24)
        semester_credits = random.randint(12, 24)
        credits_passed = random.randint(0, semester_credits)
        semester_gpa = round(random.uniform(0.0, 4.0), 2)
        
        # Get total credits from previous records
        previous_records = execute_query(
            "SELECT COALESCE(SUM(semester_credits), 0) as total FROM academic_records WHERE student_id = %s",
            params=(student_id,)
        )
        previous_credits = previous_records[0]['total'] if previous_records else 0
        total_credits = previous_credits + semester_credits
        
        # Calculate cumulative GPA (simple average for this simulation)
        prev_gpa_result = execute_query(
            "SELECT COALESCE(AVG(semester_gpa), 0) as avg_gpa FROM academic_records WHERE student_id = %s",
            params=(student_id,)
        )
        
        # Convert decimal.Decimal to float to avoid type errors
        prev_gpa = float(prev_gpa_result[0]['avg_gpa']) if prev_gpa_result else 0.0
        previous_credits = float(previous_credits)
        total_credits = float(total_credits)
        
        # Simple weighted average
        if previous_credits > 0:
            cumulative_gpa = (prev_gpa * previous_credits + semester_gpa * semester_credits) / total_credits
        else:
            cumulative_gpa = semester_gpa
        
        cumulative_gpa = round(cumulative_gpa, 2)
        
        # Insert the academic record
        execute_query(
            """INSERT INTO academic_records 
               (student_id, semester_id, semester_credits, credits_passed, 
                semester_gpa, cumulative_gpa, total_credits) 
               VALUES (%s, %s, %s, %s, %s, %s, %s)""",
            params=(student_id, semester_id, semester_credits, credits_passed, 
                    semester_gpa, cumulative_gpa, total_credits),
            fetch_none=True
        )
        logger.info(f"Created academic record for student_id={student_id}, semester GPA={semester_gpa}")
        return True
    except Exception as e:
        logger.error(f"Error creating academic record: {str(e)}")
        return False

def simulate_changes(num_changes=10):
    """
    Simulate a number of random changes to the database
    
    Args:
        num_changes: Number of changes to make
        
    Returns:
        Number of successful changes made
    """
    # Defines both update and insert operations with their relative weights
    operations = [
        # Update operations
        (update_random_student, 20),         # Update students
        (update_random_grade, 25),           # Update grades (most frequent update)
        (update_random_course, 10),          # Update courses 
        (update_random_lecturer, 5),         # Update lecturers (less frequent)
        (update_random_academic_record, 10), # Update academic records
        
        # Insert operations
        (insert_random_student, 8),          # Insert new students
        (insert_random_registration, 8),     # Insert new registrations
        (insert_random_grade, 10),           # Insert new grades
        (insert_random_lecturer, 3),         # Insert new lecturers
        (insert_random_room, 2),             # Insert new rooms
        (insert_random_semester, 1),         # Insert new semesters (rare)
        (insert_random_class_schedule, 4),   # Insert new class schedules
        (insert_random_academic_record, 6)   # Insert new academic records
    ]
    
    # Create weighted list for random selection
    weighted_ops = []
    for op, weight in operations:
        weighted_ops.extend([op] * weight)
    
    changes_made = 0
    attempts = 0
    max_attempts = num_changes * 3  # Allow for some failures
    
    while changes_made < num_changes and attempts < max_attempts:
        # Select random operation
        operation = random.choice(weighted_ops)
        
        # Try to execute it
        try:
            if operation():
                changes_made += 1
                # Small visual indicator of progress
                if changes_made % 5 == 0:
                    logger.info(f"Progress: {changes_made}/{num_changes} changes")
        except Exception as e:
            logger.error(f"Error in operation: {str(e)}")
        
        attempts += 1
    
    logger.info(f"Completed {changes_made} changes in {attempts} attempts")
    return changes_made

def main():
    """Main function"""
    parser = argparse.ArgumentParser(description='Simulate database changes for CDC testing')
    parser.add_argument('--changes', type=int, default=20, 
                       help='Number of changes to make (default: 20)')
    parser.add_argument('--commit', action='store_true', 
                       help='commit changes to database (default: ga commit)')
    args = parser.parse_args()
    
    # Load environment variables
    load_dotenv()
    
    logger.info(f"Starting simulation of {args.changes} data changes...")
    
    # Get database connection for transaction management
    with get_db_connection() as conn:
        try:
            # Run simulation
            changes = simulate_changes(args.changes)
            
            # Commit or rollback based on argument
            if args.commit:
                conn.commit()
                logger.info(f"Committed {changes} changes to database")
            else:
                conn.rollback()
                logger.info(f"Rolled back {changes} changes (dry run)")
                logger.info("Remove --no-commit flag to commit changes")
        except Exception as e:
            conn.rollback()
            logger.error(f"Error in simulation: {str(e)}")
    
    logger.info("Simulation completed")

if __name__ == "__main__":
    main()
