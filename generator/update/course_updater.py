#!/usr/bin/env python
"""
Course record updater for CDC testing

Provides functions to update existing course records in the SIAK database.
"""

import random
import logging
from faker import Faker
from data_sources.siak_pool import execute_query

# Configure logging
logger = logging.getLogger('update.course')

# Initialize faker
fake = Faker('id_ID')

def update_course_name():
    """
    Update a random course's name
    
    Args:
        conn: Database connection
    
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        # Get random course
        result = execute_query(
            "SELECT id, course_code, course_name FROM courses ORDER BY RANDOM() LIMIT 1",
        )
        
        if not result:
            logger.warning("No courses found to update")
            return False
            
        course_id = result[0]['id']
        course_code = result[0]['course_code']
        old_name = result[0]['course_name']
        
        # Generate new name
        new_name = fake.catch_phrase()
        
        # Update course
        execute_query(
            "UPDATE courses SET course_name = %s WHERE id = %s",
            params=(new_name, course_id),
            fetch_none=True
        )
        
        logger.info(f"Updated course {course_code} name: '{old_name}' -> '{new_name}'")
        return True
        
    except Exception as e:
        logger.error(f"Error updating course name: {str(e)}")
        return False

def update_course_credits():
    """
    Update a random course's credits value
    
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        # Get random course
        result = execute_query(
            "SELECT id, course_code, credits FROM courses ORDER BY RANDOM() LIMIT 1",
        )
        
        if not result:
            logger.warning("No courses found to update")
            return False
            
        course_id = result[0]['id']
        course_code = result[0]['course_code']
        old_credits = result[0]['credits']
        
        # Generate new credits (different from current)
        credits_options = [2, 3, 4]
        if old_credits in credits_options:
            credits_options.remove(old_credits)
            
        new_credits = random.choice(credits_options)
        
        # Update course
        execute_query(
            "UPDATE courses SET credits = %s WHERE id = %s",
            params=(new_credits, course_id),
            fetch_none=True
        )
        
        logger.info(f"Updated course {course_code} credits: {old_credits} -> {new_credits}")
        return True
        
    except Exception as e:
        logger.error(f"Error updating course credit: {str(e)}")
        return False

def update_course_program():
    """
    Update a random course's program assignment
    
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        # Get random course
        result = execute_query(
            """
            SELECT c.id, c.course_code, c.program_id, p.program_name 
            FROM courses c
            JOIN programs p ON c.program_id = p.id
            ORDER BY RANDOM() LIMIT 1
            """,
        )
        
        if not result:
            logger.warning("No courses found to update")
            return False
            
        course_id = result[0]['id']
        course_code = result[0]['course_code']
        old_program_id = result[0]['program_id']
        old_program_name = result[0]['program_name']
        
        # Find a different program in the same faculty
        result = execute_query(
            """
            SELECT p.id, p.program_name 
            FROM programs p
            JOIN programs old ON p.faculty_id = old.faculty_id
            WHERE old.id = %s AND p.id != %s
            ORDER BY RANDOM() LIMIT 1
            """,
            params=(old_program_id, old_program_id),
        )
        
        if not result:
            logger.warning(f"No alternative programs found for course {course_code}")
            return False
            
        new_program_id = result[0]['id']
        new_program_name = result[0]['program_name']
        
        # Update course
        execute_query(
            "UPDATE courses SET program_id = %s WHERE id = %s",
            params=(new_program_id, course_id),
            fetch_none=True
        )
        
        logger.info(f"Updated course {course_code} program: '{old_program_name}' -> '{new_program_name}'")
        return True
        
    except Exception as e:
        logger.error(f"Error updating course description: {str(e)}")
        return False

# Dictionary of available updaters with weights
COURSE_UPDATERS = {
    update_course_name: 50,
    update_course_credits: 30,
    update_course_program: 20
}

def update_random_course():
    """
    Perform a random update on a course record
    
    Args:
        conn: Database connection
    
    Returns:
        bool: True if successful, False otherwise
    """
    # Create weighted list of updaters
    weighted_updaters = []
    for updater, weight in COURSE_UPDATERS.items():
        weighted_updaters.extend([updater] * weight)
    
    # Pick a random updater and execute it
    selected_updater = random.choice(weighted_updaters)
    return selected_updater()
