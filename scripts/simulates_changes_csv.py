#!/usr/bin/env python
"""
Generate updated attendance CSV based on current database state.
This script fetches data from PostgreSQL and creates a new attendance.csv
file that reflects the latest state of the database.
"""

import os
import sys
import csv
import random
import logging
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import the database connection pool
from data_sources.siak_pool import get_db_connection, execute_query

# Configure logging
logging.basicConfig(level=logging.INFO, 
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger('update_attendance_csv')

def fetch_data_for_attendance():
    """
    Fetch necessary data from PostgreSQL to generate attendance records
    """
    logger.info("Fetching data from PostgreSQL for attendance CSV generation...")
    
    # Get database connection
    conn = get_db_connection()
    
    try:
        # Fetch active students
        logger.info("Fetching active students...")
        students_query = """
            SELECT id, npm, name, program_id 
            FROM students 
            WHERE is_active = TRUE 
            ORDER BY id
        """
        students = execute_query(students_query)
        logger.info(f"Found {len(students)} active students")
        
        # Fetch current class schedules with course and semester info
        logger.info("Fetching class schedules...")
        class_schedules_query = """
            SELECT cs.id, cs.course_id, cs.semester_id, cs.day_of_week, cs.start_time,
                   c.course_code, s.semester_code
            FROM class_schedules cs
            JOIN courses c ON cs.course_id = c.id
            JOIN semesters s ON cs.semester_id = s.id
            ORDER BY cs.semester_id DESC, cs.id
            LIMIT 500  -- Limit to recent class schedules
        """
        class_schedules = execute_query(class_schedules_query)
        logger.info(f"Found {len(class_schedules)} class schedules")
        
        # Fetch registrations to know which students are in which classes
        logger.info("Fetching registrations...")
        registrations_query = """
            SELECT student_id, course_id, semester_id
            FROM registrations
            WHERE semester_id = (SELECT MAX(id) FROM semesters)
            ORDER BY student_id
        """
        registrations = execute_query(registrations_query)
        logger.info(f"Found {len(registrations)} registrations")
        
        return {
            "students": students,
            "class_schedules": class_schedules,
            "registrations": registrations
        }
        
    except Exception as e:
        logger.error(f"Error fetching data: {str(e)}")
        return None
    finally:
        conn.close()

def generate_attendance_records(data, max_rows=None):
    """
    Generate realistic attendance records
    """
    logger.info("Generating attendance records...")
    
    students = data["students"]
    class_schedules = data["class_schedules"]
    registrations = data["registrations"]
    
    # Create a lookup for registrations
    reg_lookup = set()
    for reg in registrations:
        key = (reg["student_id"], reg["course_id"], reg["semester_id"])
        reg_lookup.add(key)
    
    attendance_records = []
    
    # Always set status to present
    statuses = ["present"]
    
    # For each class schedule
    for cs in class_schedules:
        class_id = cs["id"]
        course_id = cs["course_id"]
        semester_id = cs["semester_id"]
        course_code = cs["course_code"]
        semester_code = cs["semester_code"]
        day_of_week = cs["day_of_week"]
        
        # Get all students registered for this course in this semester
        class_students = [s for s in students if (s["id"], course_id, semester_id) in reg_lookup]
        
        if not class_students:
            continue  # Skip if no students in this class
        
        # Generate 14 meetings for the semester
        now = datetime.now()
        first_meeting = now - timedelta(days=90)  # Start ~3 months ago
        
        for meeting_num in range(1, 15):
            # Each meeting is 7 days apart
            meeting_date = first_meeting + timedelta(days=7 * meeting_num)
            
            # Generate attendance for each student
            for student in class_students:
                # Random chance for each student to have a record (some might be missing)
                if random.random() < 0.95:  # 95% chance to have a record
                    status = random.choice(statuses)
                    
                    # Check-in time varies based on status
                    if status == "present":
                        check_in_offset = random.randint(-5, 10)  # -5 to +10 minutes
                    elif status == "late":
                        check_in_offset = random.randint(11, 30)  # 11 to 30 minutes late
                    else:  # absent
                        check_in_offset = None
                    
                    base_time = datetime.strptime("08:00", "%H:%M").time()
                    check_in_time = None
                    if check_in_offset is not None:
                        check_in_dt = datetime.combine(meeting_date.date(), base_time) + timedelta(minutes=check_in_offset)
                        check_in_time = check_in_dt.time().strftime("%H:%M:%S")
                    
                    record = {
                        "student_id": student["id"],
                        "npm": student["npm"],
                        "course_id": course_id, 
                        "course_code": course_code,
                        "class_schedule_id": class_id,
                        "semester_code": semester_code,
                        "meeting_date": meeting_date.strftime("%Y-%m-%d"),
                        "check_in_time": check_in_time,
                        "status": status
                    }
                    attendance_records.append(record)
    
    # Limit records if max_rows specified
    if max_rows and len(attendance_records) > max_rows:
        logger.info(f"Limiting attendance records to {max_rows} (from {len(attendance_records)})")
        attendance_records = random.sample(attendance_records, max_rows)
    
    return attendance_records

def save_attendance_to_csv(attendance_records, output_file="data/attendance.csv"):
    """
    Save attendance records to CSV file
    """
    # Create directory if it doesn't exist
    os.makedirs(os.path.dirname(os.path.abspath(output_file)), exist_ok=True)
    
    # Save records to CSV
    with open(output_file, 'w', newline='') as csvfile:
        fieldnames = [
            "student_id", "npm", "course_id", "course_code", 
            "class_schedule_id", "semester_code", "meeting_date", 
            "check_in_time", "status"
        ]
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        
        for record in attendance_records:
            writer.writerow(record)
    
    logger.info(f"Saved {len(attendance_records)} attendance records to {output_file}")
    return True

def main():
    """Main function"""
    # Load environment variables
    load_dotenv()
    
    # Get max rows from environment variable or use default
    max_rows = int(os.getenv('ATTENDANCE_MAX_ROWS', '5000'))
    output_file = os.getenv('ATTENDANCE_CSV_PATH', 'data/attendance.csv')
    
    logger.info(f"Starting attendance CSV update process. Max rows: {max_rows}")
    
    # Fetch data from PostgreSQL
    data = fetch_data_for_attendance()
    if not data:
        logger.error("Failed to fetch data. Exiting.")
        return False
    
    # Generate attendance records
    attendance_records = generate_attendance_records(data, max_rows)
    
    # Save to CSV
    success = save_attendance_to_csv(attendance_records, output_file)
    
    if success:
        logger.info("Attendance CSV update completed successfully!")
    else:
        logger.error("Failed to update attendance CSV.")
    
    return success

if __name__ == "__main__":
    main()
