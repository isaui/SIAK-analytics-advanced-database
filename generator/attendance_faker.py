#!/usr/bin/env python
"""
Attendance Faker for University ETL Pipeline

Generates realistic attendance records for class sessions. This simulates
data coming from an external attendance tracking system (like card swipers,
manual entry, or other systems) which would need cleaning and integration
through ETL processes.
"""

import random
from datetime import datetime, timedelta
from faker import Faker

# Initialize faker
fake = Faker('id_ID')

def generate_attendance(students, class_schedules, semesters, count=None):
    """
    Generate attendance records for class sessions
    
    Args:
        students: List of student records
        class_schedules: List of class schedule records
        semesters: List of semester records
        count: Number of attendance records to generate (default: automatic based on class schedule)
        
    Returns:
        List of attendance records
    """
    # If count is None, we'll generate an average of 14 meetings per class_schedule (one semester)
    if count is None:
        count = len(class_schedules) * 14
    
    # Make a copy of active semesters for current attendance
    current_date = datetime.now().date()
    active_semesters = [s for s in semesters if datetime.strptime(s["end_date"], '%Y-%m-%d').date() >= current_date]
    if not active_semesters:
        active_semesters = [semesters[-1]]  # Take the most recent semester
    
    # Make list of registered students by course and semester
    eligible_students = {}  # {(course_id, semester_id): [student_ids]}
    for semester in semesters:
        for class_schedule in class_schedules:
            if class_schedule["semester_id"] == semester["id"]:
                # Get students registered for this course in this semester
                course_students = [s["id"] for s in students if random.random() < 0.8]  # Simulate ~80% of students registered
                eligible_students[(class_schedule["course_id"], semester["id"])] = course_students
    
    attendance_records = []
    
    # Generate clean attendance records
    records_count = 0
    
    for i in range(count):
        # Pick a random class schedule
        class_schedule = random.choice(class_schedules)
        course_id = class_schedule["course_id"]
        semester_id = class_schedule["semester_id"]
        
        # Find the semester info
        semester = next((s for s in semesters if s["id"] == semester_id), None)
        if not semester:
            continue
        
        # Calculate a meeting date within the semester
        semester_start = datetime.strptime(semester["start_date"], '%Y-%m-%d').date()
        semester_end = datetime.strptime(semester["end_date"], '%Y-%m-%d').date()
        meeting_date = fake.date_between_dates(semester_start, semester_end)
        
        # Align meeting day with class_schedule day_of_week
        day_mapping = {"Monday": 0, "Tuesday": 1, "Wednesday": 2, "Thursday": 3, "Friday": 4, "Saturday": 5, "Sunday": 6}
        target_day = day_mapping.get(class_schedule["day_of_week"], 0)
        current_day = meeting_date.weekday()
        days_diff = (target_day - current_day) % 7
        meeting_date = meeting_date + timedelta(days=days_diff)
        
        # Get meeting time from class schedule
        meeting_time = str(class_schedule["start_time"])
        
        # Get students for this course and semester
        students_in_course = eligible_students.get((course_id, semester_id), [])
        if not students_in_course:
            # If no specific students, get random ones
            students_in_course = random.sample([s["id"] for s in students], min(30, len(students)))
        
        # Generate attendance records for students
        for student_id in students_in_course:
            # Simulate some absences (20% chance of being absent)
            if random.random() < 0.2:
                continue
                
            # Normal record with slight variation in check-in time
            base_time = datetime.strptime(meeting_time, "%H:%M:%S")
            # Students usually arrive within 10 minutes before to 5 minutes after class start
            time_variation = timedelta(minutes=random.randint(-10, 5))
            check_in_time = (base_time + time_variation).time().strftime("%H:%M:%S")
            
            # Create attendance record
            attendance_record = {
                "student_id": student_id,
                "course_id": course_id,
                "class_schedule_id": class_schedule["id"],
                "meeting_date": meeting_date,
                "check_in_time": check_in_time,
                "status": "present"
            }
            
            attendance_records.append(attendance_record)
            records_count += 1
    
    return attendance_records
