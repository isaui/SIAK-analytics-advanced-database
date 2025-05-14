#!/usr/bin/env python
"""
Script to generate data and seed it into the SIAK database.
This script uses the functions from generator/index.py for cleaner code organization.
"""

import os
import sys
import argparse
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
    save_to_json,
    save_to_csv,
    save_to_postgres,
    save_attendance_to_csv
)


def main():
    """Main function to handle command-line arguments and execute data generation and seeding"""
    # Load environment variables
    load_dotenv()
    
    # Parse command-line arguments
    parser = argparse.ArgumentParser(
        description="Generate and seed data for SIAK database",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter
    )
    
    parser.add_argument(
        "--output", 
        choices=["json", "csv", "postgres", "all"], 
        default="postgres",
        help="Output format for generated data"
    )
    
    parser.add_argument(
        "--generate-attendance",
        action="store_true",
        help="Generate attendance data and save to CSV (uses same seed data as PostgreSQL)"
    )
    
    parser.add_argument(
        "--output-dir", 
        default="data",
        help="Directory to save output files (for json/csv output)"
    )
    
    parser.add_argument(
        "--faculty-count", 
        type=int, 
        default=int(os.getenv("FACULTY_COUNT", "15")),
        help="Number of faculties to generate"
    )
    
    parser.add_argument(
        "--program-count", 
        type=int, 
        default=int(os.getenv("PROGRAM_COUNT", "65")),
        help="Number of programs to generate"
    )
    
    parser.add_argument(
        "--lecturer-count", 
        type=int, 
        default=int(os.getenv("LECTURER_COUNT", "3500")),
        help="Number of lecturers to generate"
    )
    
    parser.add_argument(
        "--student-count", 
        type=int, 
        default=int(os.getenv("STUDENT_COUNT", "45000")),
        help="Number of students to generate"
    )
    
    args = parser.parse_args()
    
    # Configure data generation counts
    counts = {
        "faculty": args.faculty_count,
        "program": args.program_count,
        "lecturer": args.lecturer_count,
        "student": args.student_count,
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
    
    # Process according to output format
    if args.output == "json" or args.output == "all":
        print(f"\nSaving data to JSON files in {args.output_dir}...")
        save_to_json(data, args.output_dir)
        
    if args.output == "csv" or args.output == "all":
        print(f"\nSaving data to CSV files in {args.output_dir}...")
        save_to_csv(data, args.output_dir)
        
    if args.output == "postgres" or args.output == "all":
        # Save data using the connection pool
        print("\nSaving data to PostgreSQL database...")
        save_to_postgres(data)
    
    # Generate attendance data if requested
    if args.generate_attendance or args.output == "all":
        # Get attendance CSV path from environment or use default
        attendance_csv_path = os.getenv("ATTENDANCE_CSV_PATH", os.path.join(args.output_dir, "attendance.csv"))
        
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
        attendance_records = save_attendance_to_csv(data, attendance_csv_path, max_rows=attendance_max_rows)
    
    print("\nData generation and seeding complete!")


if __name__ == "__main__":
    main()