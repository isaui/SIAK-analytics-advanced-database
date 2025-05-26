#!/usr/bin/env python
"""
Generate changes to attendance CSV based on current database state.
This script fetches random data from PostgreSQL and creates a new attendance.csv
file with the specified number of changes.
"""

import os
import sys
import csv
import random
import logging
from datetime import datetime, timedelta, date
from dotenv import load_dotenv

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import the database connection pool
from data_sources.siak_pool import execute_query

# Configure logging
logging.basicConfig(level=logging.INFO, 
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger('update_attendance_csv')

def fetch_data_for_attendance(num_students=20):
    """
    Fetch necessary data from PostgreSQL to generate attendance records
    Only select a random subset of students
    
    Args:
        num_students: Number of random students to fetch
    """
    logger.info(f"Fetching data for {num_students} random students from PostgreSQL...")
    
    try:
        # Fetch random active students
        logger.info(f"Fetching {num_students} random active students...")
        students_query = f"""
            SELECT id, npm, name 
            FROM students 
            WHERE is_active = TRUE 
            ORDER BY RANDOM() 
            LIMIT {num_students}
        """
        students = execute_query(students_query)
        logger.info(f"Selected {len(students)} random students")
        
        if not students:
            logger.error("No active students found")
            return None
            
        # Get student IDs for further queries
        student_ids = [s['id'] for s in students]
        student_ids_str = ','.join(str(id) for id in student_ids)
        
        # Fetch registrations for these students with course and class schedule info
        logger.info("Fetching class info for selected students...")
        class_info_query = f"""
            SELECT 
                r.student_id, 
                r.course_id,
                s.npm,
                c.course_code,
                cs.id as class_schedule_id,
                sem.semester_code,
                cs.day_of_week,
                cs.start_time
            FROM registrations r
            JOIN students s ON r.student_id = s.id
            JOIN courses c ON r.course_id = c.id
            JOIN class_schedules cs ON r.course_id = cs.course_id AND r.semester_id = cs.semester_id
            JOIN semesters sem ON r.semester_id = sem.id
            WHERE r.student_id IN ({student_ids_str})
            AND r.semester_id = (SELECT MAX(id) FROM semesters)
        """
        class_info = execute_query(class_info_query)
        logger.info(f"Found {len(class_info)} class registrations for selected students")
        
        return {
            "students": students,
            "class_info": class_info
        }
        
    except Exception as e:
        logger.error(f"Error fetching data: {str(e)}")
        return None

def generate_attendance_records(data, num_changes):
    """
    Generate attendance records for the selected students and their classes
    
    Args:
        data: Dictionary containing students and class_info data
        num_changes: Number of attendance records to generate
    """
    logger.info(f"Generating {num_changes} attendance records...")
    
    class_info = data["class_info"]
    
    if not class_info or len(class_info) == 0:
        logger.error("No class information found for students")
        return []
    
    # Make sure we don't try to generate more records than we have class info
    max_possible = min(num_changes, len(class_info))
    
    # Randomly select class info records to use
    selected_classes = random.sample(class_info, max_possible)
    
    attendance_records = []
    
    # Current date/time for reference
    now = datetime.now()
    
    # Generate attendance records
    for i, class_record in enumerate(selected_classes):
        # Create a meeting date that's recent but random
        days_ago = random.randint(1, 14)  # Random day in last 2 weeks
        meeting_date = (now - timedelta(days=days_ago)).date()
        
        # Parse start time from class schedule
        try:
            base_time = datetime.strptime(str(class_record["start_time"]), "%H:%M:%S").time()
        except ValueError:
            # If time format is different
            base_time = datetime.strptime("08:00", "%H:%M").time()
        
        # Generate check-in time with small random variation (early or late)
        minutes_offset = random.randint(-10, 15)  # -10 minutes early to 15 minutes late
        check_in_dt = datetime.combine(meeting_date, base_time) + timedelta(minutes=minutes_offset)
        check_in_time = check_in_dt.time().strftime("%H:%M:%S")
        
        # Create attendance record - format identical to attendance_faker.py
        record = {
            "student_id": class_record["student_id"],
            "course_id": class_record["course_id"],
            "class_schedule_id": class_record["class_schedule_id"],
            "meeting_date": meeting_date,
            "check_in_time": check_in_time
        }
        
        attendance_records.append(record)
    
    return attendance_records

def save_attendance_to_csv(attendance_records, output_file="data/attendance.csv"):
    """
    Save attendance records to CSV file - always creates a new file
    """
    # Create directory if it doesn't exist
    os.makedirs(os.path.dirname(os.path.abspath(output_file)), exist_ok=True)
    
    # Define fieldnames exactly like attendance_faker.py
    fieldnames = [
        "student_id", "course_id", "class_schedule_id", 
        "meeting_date", "check_in_time"
    ]
    
    # Always create a new file (overwrite existing if any)
    with open(output_file, 'w', newline='') as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        
        for record in attendance_records:
            # Convert meeting_date to string format if it's a date object
            csv_record = {}
            for field in fieldnames:
                value = record.get(field, '')
                # Convert date object to string
                if field == 'meeting_date' and isinstance(value, (datetime, date)):
                    csv_record[field] = value.strftime('%Y-%m-%d')
                else:
                    csv_record[field] = value
            writer.writerow(csv_record)
    
    logger.info(f"Saved {len(attendance_records)} new attendance records to {output_file}")
    return True



def main(changes=20):
    """
    Main function
    
    Args:
        changes: Number of changes to make to CSV (default: 20)
    """
    # Load environment variables
    load_dotenv()
    
    # Get CSV path from environment variable or use default
    csv_path = os.getenv('ATTENDANCE_CSV_PATH', 'data/attendance.csv')
    
    logger.info(f"Starting attendance CSV update process. Changes to make: {changes}")
    
    # Fetch random students data from PostgreSQL
    # Number of students = number of changes (each student gets one new attendance record)
    data = fetch_data_for_attendance(num_students=changes)
    if not data:
        logger.error("Failed to fetch data. Exiting.")
        return False
    
    # Generate attendance records
    attendance_records = generate_attendance_records(data, changes)
    
    if not attendance_records:
        logger.error("Failed to generate attendance records. Exiting.")
        return False
    
    # Save to CSV (appending to existing if it exists)
    success = save_attendance_to_csv(attendance_records, csv_path)
    
    if success:
        logger.info(f"Successfully added {len(attendance_records)} new attendance records")
        return len(attendance_records)
    else:
        logger.error("Failed to save attendance CSV.")
        return False
