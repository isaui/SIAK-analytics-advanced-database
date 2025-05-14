from faker import Faker
import random
from datetime import datetime, timedelta

fake = Faker('id_ID')

def generate_semester(n=18, start_year=2018, end_year=2027):
    """
    Generate n random semester entries based on UI's academic calendar
    
    Args:
        n: Number of semesters to generate
        start_year: Starting academic year
        end_year: Ending academic year
        
    Returns:
        List of dicts with keys: id, semester_code, start_date, end_date
    """
    result = []
    
    # UI uses format: Semester [Ganjil/Genap] YYYY/YYYY
    # or the shorter code: [1/2]/YYYY
    # Example: "Semester Ganjil 2022/2023" or "1/2022" (first semester of 2022/2023)
    
    # UI semester periods (approximate actual schedule):
    # Ganjil/Odd (1): Late August/Early September to mid-December
    # Genap/Even (2): Late January/Early February to mid-May
    # Plus there are shorter semesters (Pendek/Short) between regular ones
    
    semester_types = [
        {"name": "Ganjil", "code": "1", "start_month": 8, "start_day": 22, "end_month": 12, "end_day": 16},
        {"name": "Genap", "code": "2", "start_month": 1, "start_day": 27, "end_month": 5, "end_day": 19},
    ]
    
    current_id = 1
    
    for year in range(start_year, end_year + 1):
        for semester in semester_types:
            # For odd semesters, the academic year starts at the current year
            # For even semesters, the academic year already started in the previous year
            academic_year = f"{year}/{year+1}"
            semester_name = f"Semester {semester['name']} {academic_year}"
            semester_code = f"{semester['code']}/{year}"
            
            # Calculate exact dates based on UI's typical calendar
            # Add small variations (± 5 days) to make it more realistic
            if semester['code'] == "1":
                # Fall semester - starts in current year
                start_variation = random.randint(-5, 5)
                end_variation = random.randint(-5, 5)
                
                start_date = datetime(year, semester['start_month'], semester['start_day']) + timedelta(days=start_variation)
                end_date = datetime(year, semester['end_month'], semester['end_day']) + timedelta(days=end_variation)
            else:
                # Spring semester - starts in next year
                start_variation = random.randint(-5, 5)
                end_variation = random.randint(-5, 5)
                
                start_date = datetime(year+1, semester['start_month'], semester['start_day']) + timedelta(days=start_variation)
                end_date = datetime(year+1, semester['end_month'], semester['end_day']) + timedelta(days=end_variation)
            
            # Ensure dates don't fall on weekends
            while start_date.weekday() >= 5:  # 5 and 6 are Saturday and Sunday
                start_date += timedelta(days=1)
                
            while end_date.weekday() >= 5:
                end_date += timedelta(days=1)
            
            result.append({
                "id": current_id,
                "semester_code": semester_code,
                "semester_name": semester_name,
                "start_date": start_date.strftime("%Y-%m-%d"),
                "end_date": end_date.strftime("%Y-%m-%d")
            })
            
            current_id += 1
            
            # Don't exceed requested number of semesters
            if len(result) >= n:
                break
                
        # Don't exceed requested number of semesters
        if len(result) >= n:
            break
    
    return result
