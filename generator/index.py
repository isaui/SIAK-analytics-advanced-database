#!/usr/bin/env python
# Main seed utility for generating university ETL data

import json
import os
import psycopg2
from psycopg2 import extras

# Import the connection pool
from data_sources.siak_pool import (
    SiakConnectionPool, 
    execute_batch,
    execute_values,
    get_db_connection
)
from minio import Minio
from minio.error import S3Error
import pandas as pd
from io import BytesIO

# Import all faker modules
from faculty_faker import generate_faculty
from program_faker import generate_program
from lecturer_faker import generate_lecturer
from student_faker import generate_student
from room_faker import generate_room
from course_faker import generate_course
from semester_faker import generate_semester
from class_schedule_faker import generate_class_schedule
from registration_faker import generate_registration
from grade_faker import generate_grade
from semester_fees_faker import generate_semester_fees
from academic_record_faker import generate_academic_record


def generate_all_data(counts=None):
    """
    Generate all data for the university ETL pipeline
    
    Args:
        counts: Dictionary with counts for each entity
        
    Returns:
        Dictionary containing all generated data
    """
    if counts is None:
        counts = {
            "faculty": 15,         # 15 faculties (UI has around 14 faculties)
            "program": 65,         # 65 programs (multiple programs per faculty)
            "lecturer": 3500,       # 3500 lecturers (UI has around 3000+ lecturers)
            "student": 45000,       # 45000 students (UI has around 40000+ students)
            "room": 350,            # 350 rooms across campus
            "course": 2500,         # 2500 courses (many courses per program)
            "semester": 18,         # 18 semesters (9 years of data)
            "class_schedule": 5000, # 5000 class schedules
            "registration": 200000,  # 200000 registrations (many students taking many courses)
        }
    
    print("Generating faculties...")
    faculties = generate_faculty(counts["faculty"])
    
    print("Generating programs...")
    programs = generate_program(faculties, counts["program"])
    
    print("Generating lecturers...")
    lecturers = generate_lecturer(faculties, counts["lecturer"])
    
    print("Generating students...")
    students = generate_student(programs, counts["student"])
    
    print("Generating rooms...")
    rooms = generate_room(counts["room"])
    
    print("Generating courses...")
    courses = generate_course(programs, counts["course"])
    
    print("Generating semesters...")
    semesters = generate_semester(counts["semester"])
    
    print("Generating class schedules...")
    class_schedules = generate_class_schedule(
        courses, lecturers, rooms, semesters, counts["class_schedule"]
    )
    
    print("Generating registrations...")
    registrations = generate_registration(
        students, courses, semesters, counts["registration"]
    )
    
    print("Generating grades...")
    grades = generate_grade(registrations)
    
    print("Generating semester fees...")
    semester_fees = generate_semester_fees(students, semesters)
    
    print("Generating academic records...")
    academic_records = generate_academic_record(
        students, semesters, registrations, grades, courses
    )
    
    return {
        "faculties": faculties,
        "programs": programs,
        "lecturers": lecturers,
        "students": students,
        "rooms": rooms,
        "courses": courses,
        "semesters": semesters,
        "class_schedules": class_schedules,
        "registrations": registrations,
        "grades": grades,
        "semester_fees": semester_fees,
        "academic_records": academic_records
    }


def save_to_json(data, output_dir):
    """
    Save generated data to JSON files
    
    Args:
        data: Dictionary containing all generated data
        output_dir: Directory to save JSON files
    """
    os.makedirs(output_dir, exist_ok=True)
    
    for entity_name, entity_data in data.items():
        filepath = os.path.join(output_dir, f"{entity_name}.json")
        with open(filepath, 'w') as f:
            json.dump(entity_data, f, indent=2)
        print(f"Saved {len(entity_data)} {entity_name} records to {filepath}")


def save_to_csv(data, output_dir):
    """
    Save generated data to CSV files
    
    Args:
        data: Dictionary containing all generated data
        output_dir: Directory to save CSV files
    """
    os.makedirs(output_dir, exist_ok=True)
    
    for entity_name, entity_data in data.items():
        filepath = os.path.join(output_dir, f"{entity_name}.csv")
        df = pd.DataFrame(entity_data)
        df.to_csv(filepath, index=False)
        print(f"Saved {len(entity_data)} {entity_name} records to {filepath}")


def save_to_postgres(data, db_config=None):
    """
    Save generated data to PostgreSQL using the connection pool
    
    Args:
        data: Dictionary containing all generated data
        db_config: Dictionary with database connection parameters (optional)
                  If provided, will override the default pool configuration
    """
    try:
        # Initialize connection pool with custom config if provided
        pool = SiakConnectionPool()
        
        # For better performance with large datasets, we'll use batch inserts
        batch_size = 1000
        
        # Use a single connection for the entire operation
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            # Clear existing data (optional)
            print("Clearing existing data...")
            tables = [
                "academic_records", "grades", "semester_fees", "registrations", 
                "class_schedules", "rooms", "lecturers", "courses", "students", 
                "programs", "semesters", "faculties"
            ]
            
            for table in tables:
                cursor.execute(f"TRUNCATE TABLE {table} RESTART IDENTITY CASCADE")
            conn.commit()
        
        # Insert faculties
        print("Inserting faculties...")
        args = [(f["faculty_code"], f["faculty_name"]) for f in data["faculties"]]
        execute_batch(
            "INSERT INTO faculties (faculty_code, faculty_name) VALUES (%s, %s)", 
            args)
        
        # Insert programs
        print("Inserting programs...")
        args = [(p["program_code"], p["program_name"], p["faculty_id"]) for p in data["programs"]]
        execute_batch(
            "INSERT INTO programs (program_code, program_name, faculty_id) VALUES (%s, %s, %s)", 
            args)
        
        # Insert students
        print("Inserting students...")
        for i in range(0, len(data["students"]), batch_size):
            batch = data["students"][i:i+batch_size]
            args = [(
                s["npm"], s["username"], s["name"], s["email"], 
                s["birth_date"], s["address"], s["phone"], s["program_id"], s["enrollment_year"]
            ) for s in batch]
            execute_batch("""
                INSERT INTO students (npm, username, name, email, birth_date, address, phone, program_id, enrollment_year) 
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, args, page_size=batch_size)
            print(f"  Inserted {min(i+batch_size, len(data['students']))} of {len(data['students'])} students")
        
        # Insert lecturers
        print("Inserting lecturers...")
        for i in range(0, len(data["lecturers"]), batch_size):
            batch = data["lecturers"][i:i+batch_size]
            args = [(
                l["nip"], l["name"], l["email"], l["faculty_id"]
            ) for l in batch]
            execute_batch(
                "INSERT INTO lecturers (nip, name, email, faculty_id) VALUES (%s, %s, %s, %s)", 
                args, page_size=batch_size)
            print(f"  Inserted {min(i+batch_size, len(data['lecturers']))} of {len(data['lecturers'])} lecturers")
        
        # Insert rooms
        print("Inserting rooms...")
        args = [(r["room_number"], r["building"], r["capacity"]) for r in data["rooms"]]
        execute_batch(
            "INSERT INTO rooms (room_number, building, capacity) VALUES (%s, %s, %s)", 
            args)
        
        # Insert courses
        print("Inserting courses...")
        for i in range(0, len(data["courses"]), batch_size):
            batch = data["courses"][i:i+batch_size]
            args = [(
                c["course_code"], c["course_name"], c["credits"], c["program_id"]
            ) for c in batch]
            execute_batch(
                "INSERT INTO courses (course_code, course_name, credits, program_id) VALUES (%s, %s, %s, %s)", 
                args, page_size=batch_size)
            print(f"  Inserted {min(i+batch_size, len(data['courses']))} of {len(data['courses'])} courses")
        
        # Insert semesters
        print("Inserting semesters...")
        args = [(s["semester_code"], s["start_date"], s["end_date"]) for s in data["semesters"]]
        execute_batch(
            "INSERT INTO semesters (semester_code, start_date, end_date) VALUES (%s, %s, %s)", 
            args)
        
        # Insert class schedules
        print("Inserting class schedules...")
        for i in range(0, len(data["class_schedules"]), batch_size):
            batch = data["class_schedules"][i:i+batch_size]
            args = [(
                cs["course_id"], cs["lecturer_id"], cs["room_id"], cs["semester_id"],
                cs["day_of_week"], cs["start_time"], cs["end_time"]
            ) for cs in batch]
            execute_batch("""
                INSERT INTO class_schedules 
                (course_id, lecturer_id, room_id, semester_id, day_of_week, start_time, end_time) 
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, args, page_size=batch_size)
            print(f"  Inserted {min(i+batch_size, len(data['class_schedules']))} of {len(data['class_schedules'])} class schedules")
        
        # Insert registrations
        print("Inserting registrations...")
        for i in range(0, len(data["registrations"]), batch_size):
            batch = data["registrations"][i:i+batch_size]
            args = [(
                r["student_id"], r["course_id"], r["semester_id"], r["registration_date"]
            ) for r in batch]
            execute_batch(
                "INSERT INTO registrations (student_id, course_id, semester_id, registration_date) VALUES (%s, %s, %s, %s)", 
                args, page_size=batch_size)
            print(f"  Inserted {min(i+batch_size, len(data['registrations']))} of {len(data['registrations'])} registrations")
        
        # Insert grades
        print("Inserting grades...")
        for i in range(0, len(data["grades"]), batch_size):
            batch = data["grades"][i:i+batch_size]
            args = [(
                g["registration_id"], g["final_grade"], g["letter_grade"]
            ) for g in batch]
            execute_batch(
                "INSERT INTO grades (registration_id, final_grade, letter_grade) VALUES (%s, %s, %s)", 
                args, page_size=batch_size)
            print(f"  Inserted {min(i+batch_size, len(data['grades']))} of {len(data['grades'])} grades")
        
        # Insert semester fees
        print("Inserting semester fees...")
        for i in range(0, len(data["semester_fees"]), batch_size):
            batch = data["semester_fees"][i:i+batch_size]
            args = [(
                sf["student_id"], sf["semester_id"], sf["fee_amount"], sf["payment_date"]
            ) for sf in batch]
            execute_batch(
                "INSERT INTO semester_fees (student_id, semester_id, fee_amount, payment_date) VALUES (%s, %s, %s, %s)", 
                args, page_size=batch_size)
            print(f"  Inserted {min(i+batch_size, len(data['semester_fees']))} of {len(data['semester_fees'])} semester fees")
        
        # Insert academic records
        print("Inserting academic records...")
        for i in range(0, len(data["academic_records"]), batch_size):
            batch = data["academic_records"][i:i+batch_size]
            args = [(
                ar["student_id"], ar["semester_id"], ar["semester_gpa"], ar["cumulative_gpa"],
                ar["semester_credits"], ar["credits_passed"], ar["total_credits"]
            ) for ar in batch]
            execute_batch("""
                INSERT INTO academic_records 
                (student_id, semester_id, semester_gpa, cumulative_gpa, semester_credits, credits_passed, total_credits) 
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, args, page_size=batch_size)
            print(f"  Inserted {min(i+batch_size, len(data['academic_records']))} of {len(data['academic_records'])} academic records")
        
        print("Successfully inserted all data into PostgreSQL")
        
    except (psycopg2.Error, Exception) as e:
        print(f"Error inserting into PostgreSQL: {e}")
        # Connection pool handles rollbacks and connection cleanup


def save_to_minio(data, minio_config):
    """
    Save generated data to MinIO
    
    Args:
        data: Dictionary containing all generated data
        minio_config: Dictionary with MinIO connection parameters
    """
    try:
        # Create MinIO client
        client = Minio(
            f"{minio_config['host']}:{minio_config['port']}",
            access_key=minio_config["access_key"],
            secret_key=minio_config["secret_key"],
            secure=minio_config.get("secure", False)
        )
        
        # Check if bucket exists, create if it doesn't
        raw_bucket = "raw"
        if not client.bucket_exists(raw_bucket):
            client.make_bucket(raw_bucket)
        
        # Save each entity to MinIO as CSV
        for entity_name, entity_data in data.items():
            # Convert to DataFrame and then to CSV
            df = pd.DataFrame(entity_data)
            csv_data = df.to_csv(index=False).encode('utf-8')
            
            # Create BytesIO object
            csv_buffer = BytesIO(csv_data)
            
            # Upload to MinIO
            client.put_object(
                bucket_name=raw_bucket,
                object_name=f"{entity_name}.csv",
                data=csv_buffer,
                length=len(csv_data),
                content_type="text/csv"
            )
            print(f"Uploaded {entity_name}.csv to MinIO bucket 'raw'")
            
    except S3Error as e:
        print(f"Error uploading to MinIO: {e}")

