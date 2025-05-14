#!/usr/bin/env python
"""
Lecturer record updater for CDC testing

Provides functions to update existing lecturer records in the SIAK database.
"""

import random
import logging
from faker import Faker
from data_sources.siak_pool import execute_query

# Configure logging
logger = logging.getLogger('update.lecturer')

# Initialize faker
fake = Faker('id_ID')

def update_lecturer_email():
    """
    Update a random lecturer's email
    
    Args:
        conn: Database connection
    
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        # Get random lecturer
        result = execute_query(
            "SELECT id, nip, name FROM lecturers ORDER BY RANDOM() LIMIT 1",
        )
        
        if not result:
            logger.warning("No lecturers found to update")
            return False
            
        lecturer_id = result[0]['id']
        nip = result[0]['nip']
        name = result[0]['name']
        
        # Generate new email with institutional domain
        username = name.lower().replace(' ', '.')
        new_email = f"{username}@university.ac.id"
        
        # Update lecturer
        execute_query(
            "UPDATE lecturers SET email = %s WHERE id = %s",
            params=(new_email, lecturer_id),
            fetch_none=True
        )
        
        logger.info(f"Updated email for lecturer {nip} to {new_email}")
        return True
        
    except Exception as e:
        logger.error(f"Error updating lecturer email: {str(e)}")
        return False

def update_lecturer_faculty():
    """
    Transfer lecturer to a different faculty
    
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        # Get random lecturer
        lecturer = execute_query(
            """
            SELECT l.id, l.nip, l.faculty_id, f.faculty_name
            FROM lecturers l
            JOIN faculties f ON l.faculty_id = f.id
            ORDER BY RANDOM() LIMIT 1
            """,
        )
        
        if not lecturer:
            logger.warning("No lecturers found to update")
            return False
        
        lecturer_id = lecturer[0]['id']
        nip = lecturer[0]['nip']
        old_faculty_id = lecturer[0]['faculty_id']
        old_faculty_name = lecturer[0]['faculty_name']
        
        # Get a different faculty
        new_faculty = execute_query(
            """
            SELECT id, faculty_name 
            FROM faculties 
            WHERE id != %s
            ORDER BY RANDOM() LIMIT 1
            """,
            params=(old_faculty_id,),
        )
        
        if not new_faculty:
            logger.warning("No alternative faculty found")
            return False
            
        new_faculty_id = new_faculty[0]['id']
        new_faculty_name = new_faculty[0]['faculty_name']
        
        # Update lecturer
        execute_query(
            "UPDATE lecturers SET faculty_id = %s WHERE id = %s",
            params=(new_faculty_id, lecturer_id),
            fetch_none=True
        )
        
        logger.info(f"Transferred lecturer {nip} from {old_faculty_name} to {new_faculty_name}")
        return True
        
    except Exception as e:
        logger.error(f"Error updating lecturer faculty: {str(e)}")
        return False

# Dictionary of available updaters with weights
LECTURER_UPDATERS = {
    update_lecturer_email: 70,
    update_lecturer_faculty: 30
}

def update_random_lecturer():
    """
    Perform a random update on a lecturer record
    
    Args:
        conn: Database connection
    
    Returns:
        bool: True if successful, False otherwise
    """
    # Create weighted list of updaters
    weighted_updaters = []
    for updater, weight in LECTURER_UPDATERS.items():
        weighted_updaters.extend([updater] * weight)
    
    # Pick a random updater and execute it
    selected_updater = random.choice(weighted_updaters)
    return selected_updater()
