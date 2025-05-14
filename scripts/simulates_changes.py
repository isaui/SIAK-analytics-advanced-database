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
from generator.course_faker import generate_course
from generator.registration_faker import generate_registration
from generator.grade_faker import generate_grade
from generator.academic_record_faker import generate_academic_record
from generator.lecturer_faker import generate_lecturer
from generator.room_faker import generate_room
from generator.semester_faker import generate_semester
from generator.class_schedule_faker import generate_class_schedule
from generator.semester_fees_faker import generate_semester_fees
from generator.faculty_faker import generate_faculty
from generator.program_faker import generate_program

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

def insert_random_course():
    """Wrapper for course generation"""
    from data_sources.siak_pool import execute_query
    try:
        # Get a random program for the course
        program_result = execute_query("SELECT id FROM programs ORDER BY RANDOM() LIMIT 1")
        if not program_result:
            logger.warning("No programs found for course creation")
            return False
            
        program_id = program_result[0]['id']
        
        # Generate one course
        course = generate_course([{"id": program_id}], n=1)[0]
        
        # Insert the course
        execute_query(
            """INSERT INTO courses 
               (course_code, course_name, credits, program_id) 
               VALUES (%s, %s, %s, %s)""",
            params=(course['course_code'], course['course_name'], 
                    course['credits'], course['program_id']),
            fetch_none=True
        )
        logger.info(f"Inserted new course: {course['course_name']} (Code: {course['course_code']})")
        return True
    except Exception as e:
        logger.error(f"Error inserting course: {str(e)}")
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
        (insert_random_student, 10),         # Insert new students
        (insert_random_course, 5),           # Insert new courses (least frequent)
        (insert_random_registration, 10),    # Insert new registrations
        (insert_random_grade, 15)            # Insert new grades (second most frequent)
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
                       help='Commit changes to database (default: rollback)')
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
                logger.info("Use --commit flag to commit changes")
        except Exception as e:
            conn.rollback()
            logger.error(f"Error in simulation: {str(e)}")
    
    logger.info("Simulation completed")

if __name__ == "__main__":
    main()
