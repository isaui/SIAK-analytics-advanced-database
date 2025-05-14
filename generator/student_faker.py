from faker import Faker
import random
from datetime import datetime, timedelta

fake = Faker('id_ID')

def generate_student(programs, n=100, start_year=2018, end_year=2023):
    """
    Generate n random student entries
    
    Args:
        programs: List of program dicts from program_faker
        n: Number of students to generate
        start_year: Earliest enrollment year
        end_year: Latest enrollment year
        
    Returns:
        List of dicts with keys: id, npm, username, name, email, enrollment_date, program_id, is_active
    """
    result = []
    usernames = set()
    
    for i in range(1, n+1):
        # Select a random program
        program = random.choice(programs)
        program_id = program["id"]
        
        # Generate enrollment year and NPM (Nomor Pokok Mahasiswa)
        enrollment_year = random.randint(start_year, end_year)
        year_code = str(enrollment_year)[-2:]  # Last 2 digits of year
        
        # NPM format for UI: [2-digit year][1-digit faculty code][2-digit program code][4-digit serial]
        # Example: 2106501234 (21 = year 2021, 0 = FEB faculty code, 65 = program code, 1234 = serial)
        
        # Map faculty code from program
        faculty_code = program["program_code"][:2]  # First 2 chars of program code is faculty
        
        # Faculty numeric codes in UI (approximate)
        faculty_code_map = {
            "FH": "1",
            "FK": "2",
            "FG": "3",
            "FKM": "4",
            "FF": "5",
            "FIK": "6",
            "FMIPA": "7",
            "FT": "8",
            "FASILKOM": "9",
            "FEB": "0", # Often 0 or 10
            "FIB": "A",
            "FISIP": "B",
            "FPsi": "C",
            "FIA": "D",
            "FKUI": "E",
            "Vokasi": "V",
        }
        
        numeric_faculty_code = faculty_code_map.get(faculty_code, "0")
        if len(numeric_faculty_code) > 1:  # Take only the first digit/letter if more than one
            numeric_faculty_code = numeric_faculty_code[0]
        
        # Program code (typically 2 digits)
        program_digits = program["program_code"][2:4] if len(program["program_code"]) > 2 else "00"
        
        # Generate serial number - ensure uniqueness within each program+year
        serial = f"{(i % 10000):04d}"  # 4-digit serial number
        
        npm = f"{year_code}{numeric_faculty_code}{program_digits}{serial}"
        npm = npm[:10]  # Ensure it's not more than 10 chars
        
        # Generate name and gender
        gender = random.choice(['male', 'female'])
        name = fake.name_male() if gender == 'male' else fake.name_female()
        
        # Generate username (lowercase first letter of first name + lastname)
        name_parts = name.split()
        first_initial = name_parts[0][0].lower()
        last_name = name_parts[-1].lower()
        base_username = f"{first_initial}{last_name}"
        
        # Ensure username is unique
        username = base_username
        counter = 1
        while username in usernames:
            username = f"{base_username}{counter}"
            counter += 1
        usernames.add(username)
        
        # Generate email
        email = f"{username}@mahasiswa.ui.ac.id"
        
        # Generate enrollment date
        enrollment_month = random.choice([8, 9])  # August or September enrollment
        enrollment_day = random.randint(1, 28)
        enrollment_date = datetime(enrollment_year, enrollment_month, enrollment_day).strftime('%Y-%m-%d')
        
        # Determine if student is active (students from earlier years may have graduated)
        years_enrolled = datetime.now().year - enrollment_year
        is_active = True
        if years_enrolled >= 4:  # Standard 4-year program
            is_active = random.random() > 0.8  # 80% chance they've graduated
        
        result.append({
            "id": i,
            "npm": npm,
            "username": username,
            "name": name,
            "email": email,
            "enrollment_date": enrollment_date,
            "program_id": program_id,
            "is_active": is_active
        })
    
    return result
