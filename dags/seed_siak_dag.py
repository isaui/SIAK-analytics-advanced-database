"""
SIAK Database Initialization DAG
This DAG will run seed_to_siak.py to initialize the SIAK database with seed data.
"""

from datetime import timedelta

from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.utils.dates import days_ago
import sys, os
from pathlib import Path

# Default arguments for DAG
default_args = {
    'owner': 'airflow',
    'depends_on_past': False,
    'email_on_failure': False,
    'email_on_retry': False,
    'retries': 1,
    'retry_delay': timedelta(minutes=5),
}

# Define the DAG
dag = DAG(
    'seed_siak_database',
    default_args=default_args,
    description='Initialize SIAK database with seed data',
    schedule_interval=None,  # Manual trigger only
    start_date=days_ago(1),
    catchup=False,
    tags=['siak', 'initialization'],
)

# Function to run seed_to_siak.py directly
def run_seed_script():
    # Add script directory to Python path
    script_dir = '/opt/airflow'
    sys.path.append(script_dir)
    
    # Import the main function from the script
    from scripts.seed_to_siak import main as seeding
    # Run the main function
    seeding()

# Task: Seed SIAK database
seed_siak_database = PythonOperator(
    task_id='seed_siak_database',
    python_callable=run_seed_script,
    dag=dag,
)

# Set task dependencies (single task)
seed_siak_database
