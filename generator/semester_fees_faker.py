from faker import Faker
import random
from datetime import datetime, timedelta

fake = Faker('id_ID')

def generate_semester_fees(students, semesters):
    """
    Generate semester fees entries for students
    
    Args:
        students: List of student dicts from student_faker
        semesters: List of semester dicts from semester_faker
        
    Returns:
        List of dicts with keys: id, student_id, semester_id, fee_amount, payment_date
    """
    result = []
    counter = 1
    
    # UI uses UKT (Uang Kuliah Tunggal) system with 8 levels based on family income
    # Each program has different UKT ranges
    # The values below approximate the 2023-2024 UKT rates at UI
    program_base_fees = {
        # Health/Medical programs (highest fees)
        "FK": {
            "min": 1000000,     # UKT level 1
            "max": 30000000,    # UKT level 8
            "avg": 15000000,    # Average UKT
            "std_dev": 7000000  # Standard deviation
        },
        "FG": {
            "min": 1000000,
            "max": 28000000,
            "avg": 14000000,
            "std_dev": 6500000
        },
        "FF": {
            "min": 1000000,
            "max": 24000000,
            "avg": 12000000,
            "std_dev": 5500000
        },
        "FKM": {
            "min": 1000000,
            "max": 22000000,
            "avg": 11000000,
            "std_dev": 5000000
        },
        "FKUI": {
            "min": 1000000,
            "max": 22000000,
            "avg": 11000000,
            "std_dev": 5000000
        },
        
        # Technical/Science programs (high-mid range)
        "FT": {
            "min": 1000000,
            "max": 20000000,
            "avg": 10000000,
            "std_dev": 4500000
        },
        "FASILKOM": {
            "min": 1000000,
            "max": 19000000,
            "avg": 9500000,
            "std_dev": 4500000
        },
        "FMIPA": {
            "min": 1000000,
            "max": 17000000,
            "avg": 8500000,
            "std_dev": 4000000
        },
        
        # Business/Economics (mid range)
        "FEB": {
            "min": 1000000,
            "max": 17000000,
            "avg": 8500000,
            "std_dev": 4000000
        },
        
        # Law/Humanities (mid-low range)
        "FH": {
            "min": 1000000,
            "max": 15000000,
            "avg": 7500000,
            "std_dev": 3500000
        },
        "FISIP": {
            "min": 1000000,
            "max": 14000000,
            "avg": 7000000,
            "std_dev": 3500000
        },
        "FIB": {
            "min": 1000000,
            "max": 13000000,
            "avg": 6500000,
            "std_dev": 3000000
        },
        "FPsi": {
            "min": 1000000,
            "max": 15000000,
            "avg": 7500000,
            "std_dev": 3500000
        },
        "FIA": {
            "min": 1000000,
            "max": 14000000,
            "avg": 7000000,
            "std_dev": 3500000
        },
        "FIK": {
            "min": 1000000,
            "max": 17000000,
            "avg": 8500000,
            "std_dev": 4000000
        },
        
        # Vocational programs
        "Vokasi": {
            "min": 1000000,
            "max": 12000000,
            "avg": 6000000,
            "std_dev": 3000000
        },
        
        # Default for other programs
        "DEFAULT": {
            "min": 1000000,
            "max": 16000000,
            "avg": 8000000,
            "std_dev": 4000000
        }
    }
    
    # For each student, generate fees for the semesters they're enrolled in
    for student in students:
        # Get student enrollment date
        enrollment_date = datetime.strptime(student["enrollment_date"], '%Y-%m-%d')
        
        # Find program code for fee calculation
        program_id = student["program_id"]
        program_code = "DEFAULT"  # Default
        
        # Find all semesters where the student is enrolled
        for semester in semesters:
            semester_start = datetime.strptime(semester["start_date"], '%Y-%m-%d')
            
            # Only include semesters after the student's enrollment
            if semester_start >= enrollment_date:
                # Try to determine student's faculty from program ID
                program_id = student["program_id"]
                faculty_code = "DEFAULT"  # Default faculty code
                
                # Find program information for this student
                for p in programs:
                    if p["id"] == program_id:
                        if "program_code" in p and len(p["program_code"]) >= 2:
                            faculty_code = p["program_code"][:2]
                        break
                
                # Get fee structure for this faculty
                fee_structure = program_base_fees.get(faculty_code, program_base_fees["DEFAULT"])
                
                # Assign each student a UKT level (1-8) that will be consistent across semesters
                # Use student ID as seed for consistency
                student_seed = student["id"]
                random.seed(student_seed)
                
                # Different UKT level distribution - most students in mid-range UKT
                ukt_levels = [1, 2, 3, 4, 5, 6, 7, 8]  # 8 UKT levels
                ukt_weights = [5, 10, 15, 20, 25, 15, 7, 3]  # Most students in levels 3-5
                student_ukt_level = random.choices(ukt_levels, weights=ukt_weights)[0]
                
                # Calculate fee based on UKT level
                min_fee = fee_structure["min"]
                max_fee = fee_structure["max"]
                step = (max_fee - min_fee) / 7  # 7 steps for 8 levels
                
                # Set fee according to UKT level
                fee_amount = min_fee + (student_ukt_level - 1) * step
                
                # Add small random variation within each level (±2%)
                fee_amount = fee_amount * random.uniform(0.98, 1.02)
                
                # Reset the random seed to avoid affecting other randomness
                random.seed()
                
                # Round to nearest thousand (common in Indonesian fee structures)
                fee_amount = round(fee_amount / 1000) * 1000
                
                # Determine if payment was made
                payment_made = random.random() < 0.95  # 95% of fees are paid
                
                # If payment made, generate a payment date (usually before semester start)
                payment_date = None
                if payment_made:
                    days_before = random.randint(1, 30)
                    payment_date = (semester_start - timedelta(days=days_before)).strftime('%Y-%m-%d')
                
                result.append({
                    "id": counter,
                    "student_id": student["id"],
                    "semester_id": semester["id"],
                    "fee_amount": fee_amount,
                    "payment_date": payment_date
                })
                counter += 1
    
    return result
