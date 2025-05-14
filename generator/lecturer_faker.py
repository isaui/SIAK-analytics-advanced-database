from faker import Faker
import random
from datetime import datetime

fake = Faker('id_ID')

def generate_lecturer(faculties, n=30):
    """
    Generate n random lecturer entries
    
    Args:
        faculties: List of faculty dicts from faculty_faker
        n: Number of lecturers to generate
        
    Returns:
        List of dicts with keys: id, nip, name, email, faculty_id
    """
    result = []
    
    for i in range(1, n+1):
        # Select a random faculty
        faculty = random.choice(faculties)
        faculty_id = faculty["id"]
        
        # Generate a realistic Indonesian lecturer name
        gender = random.choice(['male', 'female'])
        name = fake.name_male() if gender == 'male' else fake.name_female()
        
        # Add academic titles (common in Indonesia)
        academic_title = random.choice(['Dr.', 'Prof. Dr.', '', '', ''])
        if academic_title:
            name = f"{academic_title} {name}"
            
        # Maybe add suffix (S.T., M.T., Ph.D., etc.)
        suffix = random.choice(['S.T., M.T.', 'S.E., M.M.', 'S.Kom, M.Kom.', 'S.H., M.H.', 'Ph.D.', '', ''])
        if suffix:
            name = f"{name}, {suffix}"
        
        # Generate NIP (Nomor Induk Pegawai - Indonesian civil servant ID)
        # Format: YYYYMMDD GGXXXX X (year, month, day, gender code+serial, check digit)
        birth_date = fake.date_of_birth(minimum_age=30, maximum_age=65)
        year_str = str(birth_date.year)
        month_str = f"{birth_date.month:02d}"
        day_str = f"{birth_date.day:02d}"
        gender_code = "1" if gender == 'female' else "0"  # 0 for male, 1 for female in 9th digit
        serial = f"{random.randint(1, 9999):04d}"
        check_digit = str(random.randint(0, 9))
        
        nip = f"{year_str}{month_str}{day_str}{gender_code}{serial}{check_digit}"
        
        # Generate UI-specific email (faculty-specific domain or central domain)
        # UI format: firstname.lastname@ui.ac.id or firstname.lastname@[faculty].ui.ac.id
        
        # Get first and last name (before any academic titles or commas)
        clean_name = name.split(',')[0].replace('Dr.', '').replace('Prof.', '').strip()
        name_parts = clean_name.split()
        
        # Get first name and last name, handle Indonesian names properly
        first_name = name_parts[0].lower() if name_parts else 'dosen'
        last_name = name_parts[-1].lower() if len(name_parts) > 1 else 'ui'
        
        # Remove common Indonesian honorifics if present
        for prefix in ['bapak', 'ibu', 'pak', 'bu']:
            if first_name.lower() == prefix and len(name_parts) > 1:
                first_name = name_parts[1].lower()
                if len(name_parts) > 2:
                    last_name = name_parts[-1].lower()
        
        # Format: firstname.lastname@ui.ac.id or firstname.lastname@eng.ui.ac.id
        email_prefix = f"{first_name}.{last_name}"
        
        # 60% chance for central ui.ac.id domain, 40% for faculty-specific
        if random.random() < 0.6:
            email = f"{email_prefix}@ui.ac.id"
        else:
            # Map faculty code to email subdomain
            faculty_email_map = {
                "FH": "law",
                "FK": "med",
                "FG": "dent",
                "FKM": "fph",
                "FF": "farm",
                "FIK": "nursing",
                "FMIPA": "sci",
                "FT": "eng",
                "FASILKOM": "cs",
                "FEB": "fe",
                "FIB": "fib",
                "FISIP": "fisip",
                "FPsi": "psych",
                "FIA": "fia",
                "FKUI": "vet",
                "Vokasi": "vokasi"
            }
            
            faculty_domain = faculty_email_map.get(faculty['faculty_code'], 
                                               faculty['faculty_code'].lower())
            email = f"{email_prefix}@{faculty_domain}.ui.ac.id"
        
        result.append({
            "id": i,
            "nip": nip,
            "name": name,
            "email": email,
            "faculty_id": faculty_id
        })
    
    return result


