from faker import Faker
import random

fake = Faker('id_ID')

# Course name templates and prefixes by faculty at UI

# Course prefix codes by faculty - these come before the numeric code
# For example: CSUI1234 (CSUI = FasIlkom prefix, 1234 = course number)
course_prefix_by_faculty = {
    "FH": "HKUM", 
    "FK": "MEDI",
    "FG": "KGUI",
    "FKM": "KMUI", 
    "FF": "FARM", 
    "FIK": "KPUI",
    "FMIPA": {
        "MA": "MATH",
        "FI": "PHYS", 
        "KM": "CHEM", 
        "BI": "BIOL",
        "GF": "GEOP",
        "ST": "STAT",
        "GG": "GEOG",
    },
    "FT": {
        "SI": "CIVL",
        "EL": "ELEC",
        "ME": "MECH",
        "AR": "ARCH",
        "KI": "CENG",
        "MT": "METL",
        "IN": "INEN",
        "LI": "EVEN",
        "PW": "URPL",
        "KB": "BIOE",
        "PI": "NAVE",
    },
    "FASILKOM": {
        "IL": "CSUI",
        "SI": "ISYS",
        "KJ": "AINE",
        "MT": "INFT",
        "default": "CSGE"
    },
    "FEB": {
        "EK": "ECEU",
        "AK": "ACCT",
        "MN": "MGMT",
        "IB": "IEUI",
        "BS": "DBUS",
    },
    "FIB": "HBUI",
    "FISIP": {
        "HI": "INTS",
        "SO": "SOCI",
        "KP": "POLS",
        "KM": "COMM",
        "AN": "ANTH",
        "KS": "SOCW",
        "KR": "CRIM",
    },
    "FPsi": "PSYC",
    "FIA": "ADMI",
    "FKUI": "VETS",
    "Vokasi": "VOCD",
}

# Extended course name templates with more variety and UI-specific naming
course_name_templates = {
    "FH": [
        "Hukum {}", "Aspek {} Hukum", "Pengantar {}", "Sistem {}", "Praktek {}",
        "Hukum {} Indonesia", "Perbandingan Hukum {}", "Hukum {} Internasional",
        "Etika {} Hukum", "Studi Kasus {}", "Teori {}",
    ],
    "FK": [
        "Anatomi {}", "Fisiologi {}", "{} Klinik", "Patologi {}", "Pengantar {}",
        "Kedokteran {}", "Ilmu Penyakit {}", "Kesehatan {}", "Teknologi {}",
        "Sistem {} Tubuh Manusia", "Praktikum {}", "Metodologi {}",
    ],
    "FG": ["Kedokteran Gigi {}", "Radiologi {}", "Prostodonsia {}", "Ortodonsia {}", "Pedodonsia {}"],
    
    "FKM": ["Epidemiologi {}", "Kesehatan {} Masyarakat", "Biostatistika {}", "Manajemen {}", "{} Kesehatan"],
    
    "FF": ["Farmakologi {}", "Farmasetika {}", "Farmasi {}", "Kimia {}", "Analisis {}", "Bioteknologi {}"],
    
    "FIK": ["Keperawatan {}", "Praktik Klinik {}", "Manajemen {}", "Konsep {}", "Etika {}"],
    
    "FMIPA": {
        "MA": ["Kalkulus {}", "Aljabar {}", "Matematika {}", "Analisis {}", "Teori {}", "Pemodelan {}"],
        "FI": ["Fisika {}", "Mekanika {}", "Termodinamika {}", "Elektromagnetisme {}", "Teknologi {}"],
        "KM": ["Kimia {}", "Biokimia {}", "Kimia {} Analitik", "Kimia {} Organik", "Kimia {} Anorganik"],
        "BI": ["Biologi {}", "Genetika {}", "Ekologi {}", "Fisiologi {}", "Mikrobiologi {}"],
        "GF": ["Geofisika {}", "Eksplorasi {}", "Metode {}", "Seismologi {}"],
        "ST": ["Statistika {}", "Probabilitas {}", "Analisis {}", "Metode {}"],
        "GG": ["Geografi {}", "Kartografi {}", "Sistem Informasi {}", "Geomorfologi {}", "Hidrologi {}"],
    },
    
    "FT": {
        "SI": ["Teknik Sipil {}", "Mekanika {}", "Struktur {}", "Konstruksi {}", "Material {}"],
        "EL": ["Teknik Elektro {}", "Elektronika {}", "Sistem {}", "Rangkaian {}", "Telekomunikasi {}"],
        "ME": ["Teknik Mesin {}", "Dinamika {}", "Termodinamika {}", "Mekanika {}", "Desain {}"],
        "AR": ["Arsitektur {}", "Desain {}", "Perencanaan {}", "Studio {}", "Teknologi {}"],
        "KI": ["Teknik Kimia {}", "Proses {}", "Reaktor {}", "Operasi {}", "Desain {}"],
        "default": ["Teknik {}", "Aplikasi {}", "Sistem {}", "Proyek {}", "Metode {}"],
    },
    
    "FASILKOM": {
        "IL": ["Algoritma dan Struktur Data {}", "Pemrograman {}", "Komputasi {}", "Sistem {}", 
               "Pembelajaran Mesin {}", "Kecerdasan Buatan {}", "Pengantar {}", "Jaringan Komputer {}"],
        "SI": ["Sistem Informasi {}", "Basis Data {}", "Pemrograman {}", "Analisis dan Perancangan {}", 
               "Enterprise {}", "E-bisnis {}", "Manajemen {}", "Sistem Integrasii {}"],
        "default": ["Algoritma {}", "Pemrograman {}", "Basis Data {}", "Jaringan {}", 
                   "Sistem {}", "Desain {}", "Pengembangan {}", "Teknologi {}"],
    },
    
    "FEB": [
        "Ekonomi {}", "Manajemen {}", "{} Keuangan", "Akuntansi {}", "Bisnis {}",
        "Teori {}", "Riset {}", "Studi {}", "Praktikum {}", "Strategi {}",
        "Pemasaran {}", "Perpajakan {}", "Audit {}", "Ekonometrika {}", "Pasar Modal {}",
    ],
    
    "FIB": ["Bahasa {}", "Sastra {}", "Budaya {}", "Sejarah {}", "{} Kontemporer", 
            "Terjemahan {}", "Linguistik {}", "Filologi {}"],
            
    "FISIP": ["Politik {}", "Sosiologi {}", "Kebijakan {}", "Teori {}", "Studi {}",
             "Metodologi {}", "Sistem {}", "Analisis {}", "Diplomasi {}", "Globalisasi {}"],
             
    "FPsi": ["Psikologi {}", "Psikodiagnostika {}", "Perkembangan {}", "Modifikasi {}", 
             "Asesmen {}", "Eksperimen {}", "Kepribadian {}"],
             
    "FIA": ["Administrasi {}", "Manajemen {}", "Kebijakan {}", "Organisasi {}", 
            "Kepemimpinan {}", "Reformasi {}"],
            
    "FKUI": ["Kesehatan Hewan {}", "Anatomi {}", "Fisiologi {}", "Klinik {}",
             "Diagnostik {}", "Patologi {}"],
             
    "Vokasi": ["Praktik {}", "Aplikasi {}", "Keterampilan {}", "Manajemen {}", 
              "Teknik {}", "Bisnis {}", "Laboratorium {}"],
}

course_subjects = [
    "Dasar", "Lanjut", "Terapan", "Modern", "Klasik", "Indonesia", "Global", 
    "Analitik", "Kuantitatif", "Kualitatif", "Strategis", "Etika", "Profesional",
    "Komparasi", "Riset", "Pengembangan", "Pengantar", "Teori", "Sistem"
]

def generate_course(programs, n=100):
    """
    Generate n random course entries using UI's course code format
    
    Args:
        programs: List of program dicts from program_faker
        n: Number of courses to generate
        
    Returns:
        List of dicts with keys: id, course_code, course_name, credits, program_id
    """
    result = []
    used_codes = set()
    
    for i in range(1, n+1):
        # Select a random program
        program = random.choice(programs)
        program_id = program["id"]
        program_code = program["program_code"]
        
        # Extract faculty code and program specific code
        faculty_code = program_code[:2] if len(program_code) >= 2 else "FT" # Default to FT
        program_specific_code = program_code[2:] if len(program_code) > 2 else ""
        
        # Get the course prefix (e.g., CSUI, MATH, etc.)
        prefix = ""
        if faculty_code in course_prefix_by_faculty:
            faculty_prefix = course_prefix_by_faculty[faculty_code]
            
            # Handle nested prefixes (for faculties with program-specific prefixes)
            if isinstance(faculty_prefix, dict) and program_specific_code in faculty_prefix:
                prefix = faculty_prefix[program_specific_code]
            elif isinstance(faculty_prefix, dict) and "default" in faculty_prefix:
                prefix = faculty_prefix["default"]
            else:
                # Use faculty-wide prefix or default to a generated one
                prefix = faculty_prefix if not isinstance(faculty_prefix, dict) else f"{faculty_code}UI"
        else:
            # If faculty not found, create a reasonable default
            prefix = f"{faculty_code}UI"
        
        # Generate course code - UI format: PREFIX + 4-digit number
        # For example: CSUI1231, MECH2201, etc.
        while True:
            # Generate a 4-digit code with certain patterns:
            # First digit: often indicates level (1=intro, 2=intermediate, 3=advanced, 4=final year)
            # Second digit: often indicates area within the program
            # Last two: sequential numbering
            level = random.choices([1, 2, 3, 4], weights=[40, 30, 20, 10])[0]  # Weight toward lower-level courses
            area = random.randint(0, 9)
            sequence = random.randint(1, 99)
            
            course_num = f"{level}{area}{sequence:02d}"
            course_code = f"{prefix}{course_num}"
            
            if course_code not in used_codes:
                used_codes.add(course_code)
                break
        
        # Generate appropriate course name based on faculty/program
        course_name = ""
        templates = None
        
        # Find the right template collection
        if faculty_code in course_name_templates:
            faculty_templates = course_name_templates[faculty_code]
            
            # Handle nested templates
            if isinstance(faculty_templates, dict) and program_specific_code in faculty_templates:
                templates = faculty_templates[program_specific_code]
            elif isinstance(faculty_templates, dict) and "default" in faculty_templates:
                templates = faculty_templates["default"]
            else:
                # Use faculty-wide templates or default
                templates = faculty_templates if not isinstance(faculty_templates, dict) else ["Mata Kuliah {}"]
        else:
            # Default template if faculty not found
            templates = ["Mata Kuliah {}", "Pengantar {}", "Dasar {}", "Aplikasi {}"]
        
        # Choose template and subject
        if isinstance(templates, list):
            template = random.choice(templates)
            subject = random.choice(course_subjects)
            course_name = template.format(subject)
        else:
            # Fallback if something went wrong
            course_name = f"Mata Kuliah {fake.word().capitalize()}"
        
        # Add course level indicator to some courses
        if random.random() < 0.3:  # 30% chance
            if level == 1:
                course_name = f"{course_name} I"
            elif level == 2:
                course_name = f"{course_name} II"
            elif level == 3:
                course_name = f"{course_name} III"
            elif level == 4:
                course_name = f"{course_name} IV"
        
        # Generate credits (UI typically uses 1-6 credits system)
        # SKS (Satuan Kredit Semester) distribution:
        credits_weights = [0, 5, 15, 50, 20, 8, 2]  # 0-6 credits with weights
        credits = random.choices(range(7), weights=credits_weights)[0]
        if credits < 1:  # Ensure at least 1 credit
            credits = 1
        
        result.append({
            "id": i,
            "course_code": course_code,
            "course_name": course_name,
            "credits": credits,
            "program_id": program_id
        })
    
    return result


