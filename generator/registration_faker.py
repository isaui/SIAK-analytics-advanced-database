from faker import Faker
import random
from datetime import datetime, timedelta

fake = Faker('id_ID')

def generate_registration(students, courses, semesters, n=500):
    """
    Generate n random registration entries
    
    Args:
        students: List of student dicts from student_faker
        courses: List of course dicts from course_faker
        semesters: List of semester dicts from semester_faker
        n: Number of registrations to generate
        
    Returns:
        List of dicts with keys: id, student_id, course_id, semester_id, registration_date
    """
    result = []
    used_registrations = set()  # To avoid duplicate student-course-semester combinations
    
    # Try to create exactly n registrations
    attempt_count = 0
    max_attempts = n * 3  # Allow extra attempts to find valid combinations
    
    while len(result) < n and attempt_count < max_attempts:
        attempt_count += 1
        
        # Select random entities
        student = random.choice(students)
        course = random.choice(courses)
        
        # Students can only register for courses in their program or occasionally from other programs
        if random.random() < 0.8:  # 80% chance to take courses from their own program
            program_courses = [c for c in courses if c["program_id"] == student["program_id"]]
            if program_courses:  # If there are courses in the student's program
                course = random.choice(program_courses)
        
        # Find a valid semester (must be after student enrollment date)
        valid_semesters = []
        for semester in semesters:
            semester_start = datetime.strptime(semester["start_date"], '%Y-%m-%d')
            student_enrollment = datetime.strptime(student["enrollment_date"], '%Y-%m-%d')
            if semester_start >= student_enrollment:
                valid_semesters.append(semester)
        
        if not valid_semesters:
            continue  # Skip if no valid semesters
        
        semester = random.choice(valid_semesters)
        
        # Check for duplicate registration
        reg_key = f"{student['id']}-{course['id']}-{semester['id']}"
        if reg_key in used_registrations:
            continue  # Skip duplicate registrations
        
        used_registrations.add(reg_key)
        
        # Generate registration date (between 1-4 weeks before semester start)
        semester_start = datetime.strptime(semester["start_date"], '%Y-%m-%d')
        days_before = random.randint(7, 28)
        registration_date = semester_start - timedelta(days=days_before)
        
        result.append({
            "id": len(result) + 1,
            "student_id": student["id"],
            "course_id": course["id"],
            "semester_id": semester["id"],
            "registration_date": registration_date.strftime('%Y-%m-%d')
        })
    
    return result

