#!/usr/bin/env python
"""
Grade record updater for CDC testing

Provides functions to update existing grade records in the SIAK database.
"""

import random
import logging
from data_sources.siak_pool import execute_query

# Configure logging
logger = logging.getLogger('update.grade')

# Grade mapping (letter grade to numeric equivalent)
GRADE_VALUES = {
    'A': 4.0, 'A-': 3.7, 'B+': 3.3, 'B': 3.0, 'B-': 2.7,
    'C+': 2.3, 'C': 2.0, 'D': 1.0, 'E': 0.0
}

def update_grade_value():
    """
    Update a random grade's value
    
    Args:
        conn: Database connection
    
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        # Get a random grade with course and student info
        result = execute_query(
            """
            SELECT g.id, g.letter_grade, g.final_grade, s.npm, c.course_code
            FROM grades g
            JOIN registrations r ON g.registration_id = r.id
            JOIN students s ON r.student_id = s.id
            JOIN courses c ON r.course_id = c.id
            ORDER BY RANDOM() LIMIT 1
            """,
        )
        
        if not result:
            logger.warning("No grades found to update")
            return False
            
        grade_id = result[0]['id']
        current_letter = result[0]['letter_grade']
        npm = result[0]['npm']
        course_code = result[0]['course_code']
        
        # Choose a new letter grade different from current
        available_grades = ['A', 'B', 'C', 'D', 'E']
        if current_letter in available_grades:
            available_grades.remove(current_letter)
        
        new_letter = random.choice(available_grades)
        
        # Calculate equivalent numeric grade
        if new_letter == 'A':
            new_final = 4.0
        elif new_letter == 'B':
            new_final = 3.0
        elif new_letter == 'C':
            new_final = 2.0
        elif new_letter == 'D':
            new_final = 1.0
        else:  # 'E'
            new_final = 0.0
        
        # Update the grade
        execute_query(
            """
            UPDATE grades 
            SET letter_grade = %s, final_grade = %s
            WHERE id = %s
            """,
            params=(new_letter, new_final, grade_id),
            fetch_none=True
        )
        
        logger.info(f"Updated grade for student {npm}, course {course_code}: {current_letter} -> {new_letter}")
        return True
        
    except Exception as e:
        logger.error(f"Error updating grade: {str(e)}")
        return False

# Only one update function for now, but can be expanded later
GRADE_UPDATERS = {
    update_grade_value: 100
}

def update_random_grade():
    """
    Perform a random update on a grade record
    
    Args:
        conn: Database connection
    
    Returns:
        bool: True if successful, False otherwise
    """
    # With only one updater for now, we call it directly
    # This structure allows easy expansion later
    return update_grade_value()
