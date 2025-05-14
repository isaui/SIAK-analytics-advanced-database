from faker import Faker
import random

fake = Faker('id_ID')

def calculate_gpa(grades, courses, registrations=None):
    """Helper function to calculate GPA based on grades and courses"""
    if not grades:
        return 0.0, 0
    
    total_points = 0
    total_credits = 0
    
    for grade in grades:
        # Get the course for this grade
        course_id = None
        if registrations:  # Check if registrations is provided
            for registration in registrations:
                if registration["id"] == grade["registration_id"]:
                    course_id = registration["course_id"]
                    break
        
        if course_id is None:
            continue
            
        # Find the course credits
        course_credits = 0
        for course in courses:
            if course["id"] == course_id:
                course_credits = course["credits"]
                break
        
        # Calculate grade points
        letter_grade = grade["letter_grade"]
        grade_point = 0.0
        
        if letter_grade == "A":
            grade_point = 4.0
        elif letter_grade == "A-":
            grade_point = 3.7
        elif letter_grade == "B+":
            grade_point = 3.3
        elif letter_grade == "B":
            grade_point = 3.0
        elif letter_grade == "B-":
            grade_point = 2.7
        elif letter_grade == "C+":
            grade_point = 2.3
        elif letter_grade == "C":
            grade_point = 2.0
        elif letter_grade == "D":
            grade_point = 1.0
        # E = 0.0
        
        # Add to totals
        total_points += grade_point * course_credits
        total_credits += course_credits
    
    if total_credits == 0:
        return 0.0, 0
        
    gpa = total_points / total_credits
    return gpa, total_credits

def generate_academic_record(students, semesters, registrations, grades, courses):
    """
    Generate academic record entries for students
    
    Args:
        students: List of student dicts from student_faker
        semesters: List of semester dicts from semester_faker
        registrations: List of registration dicts from registration_faker
        grades: List of grade dicts from grade_faker
        courses: List of course dicts from course_faker
        
    Returns:
        List of dicts with keys: id, student_id, semester_id, semester_gpa,
                                cumulative_gpa, semester_credits, credits_passed,
                                total_credits, created_at
    """
    result = []
    counter = 1
    
    # Track student's cumulative data
    student_data = {}
    
    # Group registrations by student and semester
    student_semester_registrations = {}
    for reg in registrations:
        student_id = reg["student_id"]
        semester_id = reg["semester_id"]
        
        if student_id not in student_semester_registrations:
            student_semester_registrations[student_id] = {}
            
        if semester_id not in student_semester_registrations[student_id]:
            student_semester_registrations[student_id][semester_id] = []
            
        student_semester_registrations[student_id][semester_id].append(reg["id"])
    
    # Process each student
    for student in students:
        student_id = student["id"]
        student_data[student_id] = {
            "cumulative_gpa": 0.0,
            "total_credits": 0
        }
        
        # Sort semesters chronologically
        sorted_semesters = sorted(semesters, key=lambda x: x["start_date"])
        
        # Process each semester
        for semester in sorted_semesters:
            semester_id = semester["id"]
            
            # Skip if student has no registrations in this semester
            if (student_id not in student_semester_registrations or 
                semester_id not in student_semester_registrations[student_id]):
                continue
                
            # Get student's registrations for this semester
            semester_reg_ids = student_semester_registrations[student_id][semester_id]
            
            # Get grades for these registrations
            semester_grades = [g for g in grades if g["registration_id"] in semester_reg_ids]
            
            # Calculate semester GPA
            semester_gpa, semester_credits = calculate_gpa(semester_grades, courses, registrations)
            
            # Calculate credits passed (only count grades better than F/E)
            credits_passed = 0
            for grade in semester_grades:
                if grade["letter_grade"] != "E":
                    # Find the course credits
                    reg_id = grade["registration_id"]
                    course_id = None
                    for reg in registrations:
                        if reg["id"] == reg_id:
                            course_id = reg["course_id"]
                            break
                            
                    if course_id:
                        for course in courses:
                            if course["id"] == course_id:
                                credits_passed += course["credits"]
                                break
            
            # Update student's cumulative data
            prev_total = student_data[student_id]["total_credits"]
            new_total = prev_total + semester_credits
            
            if new_total > 0:
                # Weighted average for cumulative GPA
                prev_gpa = student_data[student_id]["cumulative_gpa"]
                new_gpa = ((prev_gpa * prev_total) + (semester_gpa * semester_credits)) / new_total
            else:
                new_gpa = 0.0
                
            student_data[student_id]["cumulative_gpa"] = new_gpa
            student_data[student_id]["total_credits"] = new_total
            
            # Create academic record
            created_at = semester["end_date"]  # Records created at end of semester
            
            result.append({
                "id": counter,
                "student_id": student_id,
                "semester_id": semester_id,
                "semester_gpa": round(semester_gpa, 2),
                "cumulative_gpa": round(new_gpa, 2),
                "semester_credits": semester_credits,
                "credits_passed": credits_passed,
                "total_credits": new_total,
                "created_at": created_at
            })
            counter += 1
    
    return result

