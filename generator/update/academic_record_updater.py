#!/usr/bin/env python
"""
Academic Record updater for CDC testing

Provides functions to update existing academic record entries in the SIAK database.
"""

import random
import logging
from data_sources.siak_pool import execute_query

# Configure logging
logger = logging.getLogger('update.academic_record')

def update_credits_passed():
    """
    Update a random academic record's credits passed
    
    Args:
        conn: Database connection
    
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        # Get random academic record
        result = execute_query(
            """
            SELECT ar.id, s.npm, sem.semester_code, ar.semester_credits, ar.credits_passed
            FROM academic_records ar
            JOIN students s ON ar.student_id = s.id
            JOIN semesters sem ON ar.semester_id = sem.id
            ORDER BY RANDOM() LIMIT 1
            """
        )
        
        if not result:
            logger.warning("No academic records found to update")
            return False
            
        record_id = result[0]['id']
        npm = result[0]['npm']
        semester = result[0]['semester_code']
        semester_credits = result[0]['semester_credits']
        old_credits_passed = result[0]['credits_passed']
        
        # Simulate a grade change that affects credits passed
        # Can either increase or decrease (if student fails a course they previously passed)
        if random.random() < 0.7:  # More likely to improve
            # Student passed an additional course
            possible_increase = semester_credits - old_credits_passed
            if possible_increase <= 0:
                logger.info(f"Student {npm} already passed all credits for {semester}")
                return False
                
            credit_change = random.randint(2, min(4, possible_increase))
            new_credits_passed = old_credits_passed + credit_change
            change_type = "increase (passed additional course)"
        else:
            # Student failed a previously passed course
            if old_credits_passed <= 0:
                logger.info(f"Student {npm} has no credits to lose for {semester}")
                return False
                
            credit_change = random.randint(2, min(4, old_credits_passed))
            new_credits_passed = old_credits_passed - credit_change
            change_type = "decrease (failed previously passed course)"
        
        # Update record
        execute_query(
            "UPDATE academic_records SET credits_passed = %s WHERE id = %s",
            params=(new_credits_passed, record_id),
            fetch_none=True
        )
        
        logger.info(f"Updated student {npm} credits passed for {semester}: {old_credits_passed} -> {new_credits_passed} ({change_type})")
        return True
        
    except Exception as e:
        logger.error(f"Error updating credits passed: {str(e)}")
        return False

def update_semester_gpa():
    """
    Update a random academic record's semester GPA
    
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        # Get random academic record
        result = execute_query(
            """
            SELECT ar.id, s.npm, ar.semester_gpa, sem.semester_code
            FROM academic_records ar
            JOIN students s ON ar.student_id = s.id
            JOIN semesters sem ON ar.semester_id = sem.id
            ORDER BY RANDOM() LIMIT 1
            """,
        )
        
        if not result:
            logger.warning("No academic records found to update")
            return False
            
        record_id = result[0]['id']
        npm = result[0]['npm']
        old_gpa = float(result[0]['semester_gpa']) if result[0]['semester_gpa'] is not None else 0.0
        semester = result[0]['semester_code']
        
        # Generate a new semester GPA (different from current by at least 0.2)
        new_gpa = old_gpa
        while abs(new_gpa - old_gpa) < 0.2:
            new_gpa = round(random.uniform(1.5, 4.0), 2)
            # Keep within valid range
            new_gpa = max(0.0, min(4.0, new_gpa))
        
        # Update semester GPA which will affect cumulative GPA
        # In a real system, we'd recalculate cumulative GPA based on all semesters,
        # but for simulation we'll just adjust it slightly in the same direction
        execute_query(
            """
            UPDATE academic_records 
            SET semester_gpa = %s, 
                cumulative_gpa = cumulative_gpa + (%s - %s) * (semester_credits / total_credits)
            WHERE id = %s
            """,
            params=(new_gpa, new_gpa, old_gpa, record_id),
            fetch_none=True
        )
        
        # Determine if this is an improvement or decline
        change = "improved" if new_gpa > old_gpa else "decreased"
        logger.info(f"Updated student {npm} semester GPA for {semester}: {old_gpa} -> {new_gpa} ({change})")
        return True
        
    except Exception as e:
        logger.error(f"Error updating semester GPA: {str(e)}")
        return False

def update_semester_credits():
    """
    Update a random academic record's semester credits
    
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        # Get random academic record
        result = execute_query(
            """
            SELECT ar.id, s.npm, ar.semester_credits, sem.semester_code
            FROM academic_records ar
            JOIN students s ON ar.student_id = s.id
            JOIN semesters sem ON ar.semester_id = sem.id
            ORDER BY RANDOM() LIMIT 1
            """,
        )
        
        if not result:
            logger.warning("No academic records found to update")
            return False
            
        record_id = result[0]['id']
        npm = result[0]['npm']
        old_credits = result[0]['semester_credits']
        semester = result[0]['semester_code']
        
        # Generate new semester credit value
        if random.random() < 0.3 and old_credits > 3:  # 30% chance of reducing (course drop)
            # Student dropped a course
            dropped_credits = random.choice([2, 3, 4])
            new_credits = max(old_credits - dropped_credits, 1)
            change_type = "decreased (course withdrawal)"
        else:  # 70% chance of increasing (late registration)
            # Credit adjustment or correction
            credit_change = random.choice([2, 3, 4])
            new_credits = old_credits + credit_change
            change_type = "increased (late registration)"
        
        # Update semester credits and adjust total credits accordingly
        execute_query(
            """
            UPDATE academic_records 
            SET semester_credits = %s, 
                total_credits = total_credits + (%s - %s)
            WHERE id = %s
            """,
            params=(new_credits, new_credits, old_credits, record_id),
            fetch_none=True
        )
        
        logger.info(f"Updated student {npm} semester credits for {semester}: {old_credits} -> {new_credits} ({change_type})")
        return True
        
    except Exception as e:
        logger.error(f"Error updating semester credits: {str(e)}")
        return False

# Dictionary of available updaters with weights
ACADEMIC_RECORD_UPDATERS = {
    update_semester_gpa: 45,
    update_semester_credits: 30,
    update_credits_passed: 25
}

def update_random_academic_record():
    """
    Perform a random update on an academic record
    
    Args:
        conn: Database connection
    
    Returns:
        bool: True if successful, False otherwise
    """
    # Create weighted list of updaters
    weighted_updaters = []
    for updater, weight in ACADEMIC_RECORD_UPDATERS.items():
        weighted_updaters.extend([updater] * weight)
    
    # Pick a random updater and execute it
    selected_updater = random.choice(weighted_updaters)
    return selected_updater()
