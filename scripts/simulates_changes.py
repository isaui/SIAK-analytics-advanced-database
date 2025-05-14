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

def simulate_changes(num_changes=10):
    """
    Simulate a number of random changes to the database
    
    Args:
        num_changes: Number of changes to make
        
    Returns:
        Number of successful changes made
    """
    # Karena kebanyakan generator membutuhkan data yang sudah ada,
    # dan juga execute_query sudah menggunakan connection pool internal,
    # kita tidak perlu menggunakan koneksi database secara eksplisit
    
    # Define operations and their weights
    operations = [
        # Update operations - lebih sederhana dan tidak memerlukan referensi banyak data
        (update_random_student, 25),       # Update students frequently
        (update_random_grade, 40),         # Update grades most frequently
        (update_random_course, 15),        # Update courses sometimes
        (update_random_lecturer, 10),      # Update lecturers occasionally
        (update_random_academic_record, 10) # Update academic records regularly
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
