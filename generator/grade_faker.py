from faker import Faker
import random

fake = Faker('id_ID')

# Indonesian university grading scale
grade_ranges = [
    (85, 100, "A", 4.0),   # A range
    (80, 84.99, "A-", 3.7),  # A- range
    (75, 79.99, "B+", 3.3),  # B+ range
    (70, 74.99, "B", 3.0),   # B range
    (65, 69.99, "B-", 2.7),  # B- range
    (60, 64.99, "C+", 2.3),  # C+ range
    (55, 59.99, "C", 2.0),   # C range
    (45, 54.99, "D", 1.0),   # D range
    (0, 44.99, "E", 0.0),    # E range (fail)
]

def generate_grade(registrations):
    """
    Generate grade entries for registrations
    
    Args:
        registrations: List of registration dicts from registration_faker
        
    Returns:
        List of dicts with keys: id, registration_id, final_grade, letter_grade
    """
    result = []
    
    # Grade distribution weights - shape resembles a normal distribution
    # Most students get Bs, fewer get As and Cs, very few get Ds or Es
    grade_weights = {
        "A": 10,
        "A-": 15,
        "B+": 20,
        "B": 25,
        "B-": 15, 
        "C+": 7,
        "C": 5,
        "D": 2,
        "E": 1
    }
    
    letter_options = list(grade_weights.keys())
    weights = list(grade_weights.values())
    
    for i, registration in enumerate(registrations):
        # For some registrations, leave the grade unset (courses in progress)
        if random.random() < 0.1:  # 10% chance for grade to be NULL
            continue
            
        # Select a letter grade based on our distribution
        letter_grade = random.choices(letter_options, weights=weights)[0]
        
        # Find the corresponding grade range
        min_grade, max_grade = 0, 0
        for g_min, g_max, g_letter, _ in grade_ranges:
            if g_letter == letter_grade:
                min_grade, max_grade = g_min, g_max
                break
                
        # Generate a random numerical grade within the range
        final_grade = round(random.uniform(min_grade, max_grade), 2)
        
        result.append({
            "id": i + 1,
            "registration_id": registration["id"],
            "final_grade": final_grade,
            "letter_grade": letter_grade
        })
    
    return result


