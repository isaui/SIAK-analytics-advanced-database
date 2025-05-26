"""
SIAK ETL Pipeline DAG
This DAG will:
1. Simulate changes in PostgreSQL database
2. Simulate changes in attendance CSV
3. Extract data from PostgreSQL and CSV to MinIO
"""

from datetime import datetime, timedelta

from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.utils.dates import days_ago
import sys
import os

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
    'siak_etl_pipeline',
    default_args=default_args,
    description='ETL pipeline for SIAK data',
    schedule_interval='*/5 * * * *',  # Run every 5 minutes
    start_date=days_ago(1),
    catchup=False,
    tags=['siak', 'etl'],
)

# Function to run simulate_postgres_changes.py
def run_postgres_changes():
    # Add scripts directory to path
    script_dir = '/opt/airflow'
    sys.path.append(script_dir)
    
    # Import main from the script
    from scripts.simulates_changes_postgres import main as postgres_changes
    
    # Jalankan main function dengan parameter langsung
    postgres_changes(changes=100, commit=True)

# Task 1: Simulate changes in PostgreSQL
simulate_postgres_changes = PythonOperator(
    task_id='simulate_postgres_changes',
    python_callable=run_postgres_changes,
    dag=dag,
)

# Function to run simulates_changes_csv.py
def run_csv_changes():
    # Add scripts directory to path
    script_dir = '/opt/airflow'
    sys.path.append(script_dir)
    
    # Import main from the script
    from scripts.simulates_changes_csv import main as csv_changes    
    # Jalankan fungsi main dengan parameter jumlah perubahan
    num_changes = 100
    changes_made = csv_changes(num_changes)
    
    return changes_made

# Task 2: Simulate changes in attendance CSV
simulate_csv_changes = PythonOperator(
    task_id='simulate_csv_changes',
    python_callable=run_csv_changes,
    dag=dag,
)

# Function to run extract_siak_to_minio.py
def run_extract_to_minio():
    # Add scripts directory to path
    script_dir = '/opt/airflow'
    sys.path.append(script_dir)
    
    # Import main from the script
    from scripts.extract_siak_to_minio import main as extract
    
    # Jalankan fungsi main langsung
    extract()

# Task 3: Extract data from PostgreSQL and CSV to MinIO
extract_to_minio = PythonOperator(
    task_id='extract_to_minio',
    python_callable=run_extract_to_minio,
    dag=dag,
)

# Set task dependencies - execute in sequence
simulate_postgres_changes >> simulate_csv_changes >> extract_to_minio
