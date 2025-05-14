from faker import Faker
import random
from datetime import time

fake = Faker('id_ID')

# UI uses Monday-Friday (Senin-Jumat) with occasional Saturday classes
days_of_week = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"]
day_weights = [20, 20, 20, 20, 15, 5]  # Weights for each day (Saturday least common)

# UI uses specific class session patterns that follow the SKS (credit) system
# Regular UI class schedule follows these blocks:
class_time_slots = [
    # Morning sessions
    (time(7, 0), time(8, 40)),     # Session 1: 07:00 - 08:40 (2 SKS/credits)
    (time(8, 41), time(10, 20)),   # Session 2: 08:41 - 10:20 (2 SKS)
    (time(10, 21), time(12, 0)),   # Session 3: 10:21 - 12:00 (2 SKS)
    
    # Mid-day sessions
    (time(12, 1), time(13, 40)),   # Session 4: 12:01 - 13:40 (2 SKS)
    (time(13, 41), time(15, 20)),  # Session 5: 13:41 - 15:20 (2 SKS)
    
    # Afternoon sessions
    (time(15, 21), time(17, 0)),   # Session 6: 15:21 - 17:00 (2 SKS)
    (time(17, 1), time(18, 40)),   # Session 7: 17:01 - 18:40 (2 SKS)
    
    # Extended sessions for labs or 3-credit courses
    (time(7, 0), time(9, 30)),     # Extended morning: 07:00 - 09:30 (3 SKS)
    (time(10, 0), time(12, 30)),   # Extended mid-morning: 10:00 - 12:30 (3 SKS)
    (time(13, 0), time(15, 30)),   # Extended afternoon: 13:00 - 15:30 (3 SKS)
    (time(16, 0), time(18, 30)),   # Extended late afternoon: 16:00 - 18:30 (3 SKS)
]

def generate_class_schedule(courses, lecturers, rooms, semesters, n=200):
    """
    Generate n random class schedule entries
    
    Args:
        courses: List of course dicts from course_faker
        lecturers: List of lecturer dicts from lecturer_faker
        rooms: List of room dicts from room_faker
        semesters: List of semester dicts from semester_faker
        n: Number of class schedules to generate
        
    Returns:
        List of dicts with keys: id, course_id, lecturer_id, room_id, semester_id, 
                                day_of_week, start_time, end_time
    """
    result = []
    used_slots = set()  # To avoid room and time conflicts
    
    for i in range(1, n+1):
        # Select random entities
        course = random.choice(courses)
        lecturer = random.choice(lecturers)
        room = random.choice(rooms)
        semester = random.choice(semesters)
        
        # Maximum attempts to find a non-conflicting slot
        max_attempts = 50
        attempts = 0
        
        while attempts < max_attempts:
                # Select day with weighted probability (less classes on Friday, minimal on Saturday)
            day = random.choices(days_of_week, weights=day_weights, k=1)[0]
            
            # Select time slot based on course credits if available
            course_credits = 2  # Default to 2 credits if not found
            for c in courses:
                if c["id"] == course["id"] and "credits" in c:
                    course_credits = c["credits"]
                    break
            
            # Choose appropriate time slot based on credits
            if course_credits >= 3:
                # Use extended slots for 3+ credit courses
                slot_options = class_time_slots[7:]  # Extended slots are at indices 7-10
            else:
                # Use regular slots for 1-2 credit courses
                slot_options = class_time_slots[:7]  # Regular slots are at indices 0-6
            
            start_time, end_time = random.choice(slot_options)
            
            # Create a unique key for this time slot and room
            slot_key = f"{semester['id']}-{room['id']}-{day}-{start_time}"
            
            # Check if this slot is already used
            if slot_key not in used_slots:
                used_slots.add(slot_key)
                break
                
            attempts += 1
        
        # If we couldn't find a non-conflicting slot, skip this entry
        if attempts >= max_attempts:
            continue
        
        result.append({
            "id": i,
            "course_id": course["id"],
            "lecturer_id": lecturer["id"],
            "room_id": room["id"],
            "semester_id": semester["id"],
            "day_of_week": day,
            "start_time": start_time.strftime("%H:%M:%S"),
            "end_time": end_time.strftime("%H:%M:%S")
        })
        
        # Stop if we've generated enough schedules
        if len(result) >= n:
            break
    
    return result
