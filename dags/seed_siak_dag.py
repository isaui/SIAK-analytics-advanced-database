"""
SIAK Database Initialization DAG
This DAG will run seed_to_siak.py to initialize the SIAK database with seed data.
"""

from datetime import datetime, timedelta

from airflow import DAG
from airflow.operators.bash import BashOperator
from airflow.utils.dates import days_ago

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

# Task: Seed SIAK database
seed_siak_database = BashOperator(
    task_id='seed_siak_database',
    bash_command='python /opt/airflow/scripts/seed_to_siak.py',
    dag=dag,
)

# Set task dependencies (single task)
seed_siak_database
