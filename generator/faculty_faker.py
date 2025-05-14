from faker import Faker
import random

fake = Faker('id_ID')

# Accurate list of UI's faculties (as of 2023)
faculty_options = [
    ("FH", "Fakultas Hukum"),
    ("FK", "Fakultas Kedokteran"),
    ("FG", "Fakultas Kedokteran Gigi"),
    ("FKM", "Fakultas Kesehatan Masyarakat"),
    ("FF", "Fakultas Farmasi"),
    ("FIK", "Fakultas Ilmu Keperawatan"),
    ("FMIPA", "Fakultas Matematika dan Ilmu Pengetahuan Alam"),
    ("FT", "Fakultas Teknik"),
    ("FASILKOM", "Fakultas Ilmu Komputer"),
    ("FEB", "Fakultas Ekonomi dan Bisnis"),
    ("FIB", "Fakultas Ilmu Budaya"),
    ("FISIP", "Fakultas Ilmu Sosial dan Ilmu Politik"),
    ("FPsi", "Fakultas Psikologi"),
    ("FIA", "Fakultas Ilmu Administrasi"),
    ("FKUI", "Fakultas Kedokteran Hewan"),
    ("Vokasi", "Sekolah Vokasi")
]

def generate_faculty(n=1):
    """
    Generate n random faculty entries
    Returns list of dicts with keys: id, faculty_code, faculty_name
    """
    result = []
    
    # Use all predefined faculties first
    used_faculties = []
    for i in range(min(n, len(faculty_options))):
        faculty_code, faculty_name = faculty_options[i]
        used_faculties.append(faculty_code)
        result.append({
            "id": i + 1,
            "faculty_code": faculty_code,
            "faculty_name": faculty_name
        })
    
    # If more faculties needed, generate random ones
    for i in range(len(faculty_options), n):
        while True:
            new_code = fake.random_letter().upper() + fake.random_letter().upper()
            if new_code not in used_faculties:
                used_faculties.append(new_code)
                break
                
        result.append({
            "id": i + 1,
            "faculty_code": new_code,
            "faculty_name": f"Fakultas {fake.word().capitalize()}"
        })
    
    return result
