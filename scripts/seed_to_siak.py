#!/usr/bin/env python
"""
Script to generate initial data and seed it into the SIAK database.
This script uses the functions from generator/index.py for cleaner code organization.
"""

import os
import sys
import logging
from dotenv import load_dotenv
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

# Add the project root to the path to enable imports
project_root = Path(__file__).parent.parent
sys.path.append(str(project_root))

# Import the generator functions
from generator.index import (
    generate_all_data,
    save_to_postgres,
    save_attendance_to_csv
)


def main():
    """Main function to generate data and seed it into the PostgreSQL database"""
    # Load environment variables
    load_dotenv()
    
    # Configure data generation counts from environment variables
    counts = {
        "faculty": int(os.getenv("FACULTY_COUNT", "15")),
        "program": int(os.getenv("PROGRAM_COUNT", "65")),
        "lecturer": int(os.getenv("LECTURER_COUNT", "3500")),
        "student": int(os.getenv("STUDENT_COUNT", "45000")),
        "room": int(os.getenv("ROOM_COUNT", "350")),
        "course": int(os.getenv("COURSE_COUNT", "2500")),
        "semester": int(os.getenv("SEMESTER_COUNT", "18")),
        "class_schedule": int(os.getenv("CLASS_SCHEDULE_COUNT", "5000")),
        "registration": int(os.getenv("REGISTRATION_COUNT", "200000")),
    }
    
    print(f"\nGenerating data with the following counts:")
    for key, value in counts.items():
        print(f"  {key}: {value:,}")
    print()
    
    # Generate data
    print("Generating data...")
    data = generate_all_data(counts)
    
    # Save data to PostgreSQL
    print("\nSaving data to PostgreSQL database...")
    save_to_postgres(data)
    
    # Generate attendance data
    attendance_csv_path = os.getenv("ATTENDANCE_CSV_PATH", "data/attendance.csv")
    
    # Get maximum attendance rows from environment variable
    attendance_max_rows = os.getenv("ATTENDANCE_MAX_ROWS")
    if attendance_max_rows:
        try:
            attendance_max_rows = int(attendance_max_rows)
        except ValueError:
            print(f"Warning: ATTENDANCE_MAX_ROWS is not a valid integer: {attendance_max_rows}")
            attendance_max_rows = None
    
    # Ensure directory exists
    os.makedirs(os.path.dirname(os.path.abspath(attendance_csv_path)), exist_ok=True)
    
    print(f"\nGenerating attendance data and saving to {attendance_csv_path}...")
    
    # Use the same seed data that was used for PostgreSQL to ensure consistency
    save_attendance_to_csv(data, attendance_csv_path, max_rows=attendance_max_rows)
    
    print("\nData generation and seeding complete!")