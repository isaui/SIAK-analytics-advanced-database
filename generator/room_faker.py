from faker import Faker
import random

fake = Faker('id_ID')

# Actual building names at UI campus
building_options = [
    # Central buildings
    "Balairung", "Gedung Rektorat", "Perpustakaan Pusat UI", "Pusgiwa", "Makara Art Center", 
    "Gedung Pusat Administrasi UI", "Masjid UI", "Balai Purnomo Prawiro", "Balai Sidang",
    
    # Faculty buildings
    "FASILKOM A", "FASILKOM B", "FEB A", "FEB B", "FEB C", "FT A", "FT B", "FT C", 
    "FH A", "FH B", "FK A", "FK B", "FK C", "FG A", "FISIP A", "FISIP B", "FISIP C", 
    "FIB A", "FIB B", "FIB C", "FMIPA A", "FMIPA B", "FMIPA C", "FPsi A", "FPsi B", 
    "FIA A", "FIA B", "FF A", "FKM A", "FKM B", "FKUI", "FIK A",
    
    # Specific landmark buildings
    "RSUI (Rumah Sakit UI)", "Stadion UI", "Gymnasium UI", "Asrama Mahasiswa", 
    "Balai Kesehatan UI", "Student Center", "Auditorium FMIPA", "Aula FK", "Teater FIB",
    
    # Lecture buildings by code
    "PAU", "PAF", "RTH", "R. Kuliah Bersama I", "R. Kuliah Bersama II", "R. Kuliah Bersama III",
    "Lab Terpadu FMIPA", "Gedung Laboratorium FT", "Pusat Riset UI",
    
    # Vokasi buildings
    "Vokasi A", "Vokasi B", "Vokasi C", "Vokasi D",
]

def generate_room(n=50):
    """
    Generate n random room entries
    
    Returns:
        List of dicts with keys: id, room_number, building, capacity
    """
    result = []
    used_room_building = set()
    
    for i in range(1, n+1):
        # Select a random building
        building = random.choice(building_options)
        
        # Generate room number (common formats in Indonesian universities)
        floor = random.randint(1, 5)
        room_num = random.randint(1, 20)
        
        # Format: [Floor][Room Number] e.g., 301, 405
        room_number = f"{floor}{room_num:02d}"
        
        # Make sure room+building combination is unique
        room_building_key = f"{room_number}-{building}"
        while room_building_key in used_room_building:
            floor = random.randint(1, 5)
            room_num = random.randint(1, 20)
            room_number = f"{floor}{room_num:02d}"
            room_building_key = f"{room_number}-{building}"
        
        used_room_building.add(room_building_key)
        
        # Generate room capacity (common sizes in universities)
        if random.random() < 0.1:  # 10% chance for large lecture halls
            capacity = random.randint(100, 300)
        elif random.random() < 0.3:  # 30% chance for medium rooms
            capacity = random.randint(40, 99)
        else:  # 60% chance for small rooms
            capacity = random.randint(20, 39)
        
        result.append({
            "id": i,
            "room_number": room_number,
            "building": building,
            "capacity": capacity
        })
    
    return result
