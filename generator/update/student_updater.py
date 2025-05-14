#!/usr/bin/env python
"""
Student record updater for CDC testing

Provides functions to update existing student records in the SIAK database.
"""

import random
import logging
from faker import Faker
from data_sources.siak_pool import execute_query

# Configure logging
logger = logging.getLogger('update.student')

# Initialize faker
fake = Faker('id_ID')

def update_student_email():
    """
    Update a random student's email
    
    Args:
        conn: Database connection
    
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        # Get random student
        result = execute_query(
            "SELECT id, npm, name FROM students ORDER BY RANDOM() LIMIT 1",
            params=None,
        )
        
        if not result:
            logger.warning("No students found to update")
            return False
            
        student_id = result[0]['id']
        npm = result[0]['npm']
        name = result[0]['name']
        
        # Generate new email
        username = name.lower().replace(' ', '.') + str(random.randint(100, 999))
        new_email = f"{username}@example.com"
        
        # Update student
        execute_query(
            "UPDATE students SET email = %s WHERE id = %s",
            params=(new_email, student_id),
            fetch_none=True
        )
        
        logger.info(f"Updated email for student {npm} to {new_email}")
        return True
        
    except Exception as e:
        logger.error(f"Error updating student email: {str(e)}")
        return False

def update_student_status():
    """
    Update a random student's active status
    
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        # Get random student
        result = execute_query(
            "SELECT id, npm, is_active FROM students ORDER BY RANDOM() LIMIT 1",
        )
        
        if not result:
            logger.warning("No students found to update")
            return False
            
        student_id = result[0]['id']
        npm = result[0]['npm']
        current_status = result[0]['is_active']
        
        # Toggle status
        new_status = not current_status
        
        # Update student
        execute_query(
            "UPDATE students SET is_active = %s WHERE id = %s",
            params=(new_status, student_id),
            fetch_none=True
        )
        
        status_text = "active" if new_status else "inactive"
        logger.info(f"Updated student {npm} status to {status_text}")
        return True
        
    except Exception as e:
        logger.error(f"Error updating student status: {str(e)}")
        return False

# Dictionary of available updaters with weights
STUDENT_UPDATERS = {
    update_student_email: 70,
    update_student_status: 30
}

def update_random_student():
    """
    Perform a random update on a student record
    
    Args:
        conn: Database connection
    
    Returns:
        bool: True if successful, False otherwise
    """
    # Create weighted list of updaters
    weighted_updaters = []
    for updater, weight in STUDENT_UPDATERS.items():
        weighted_updaters.extend([updater] * weight)
    
    # Pick a random updater and execute it
    selected_updater = random.choice(weighted_updaters)
    return selected_updater()
