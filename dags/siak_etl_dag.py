"""
SIAK ETL Pipeline DAG
This DAG will:
1. Simulate changes in PostgreSQL database
2. Simulate changes in attendance CSV
3. Extract data from PostgreSQL and CSV to MinIO
"""

from datetime import datetime, timedelta

from airflow import DAG
from airflow.operators.bash import BashOperator
from airflow.operators.python import PythonOperator
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
    'siak_etl_pipeline',
    default_args=default_args,
    description='ETL pipeline for SIAK data',
    schedule_interval='*/5 * * * *',  # Run every 5 minutes
    start_date=days_ago(1),
    catchup=False,
    tags=['siak', 'etl'],
)

# Task 1: Simulate changes in PostgreSQL
simulate_postgres_changes = BashOperator(
    task_id='simulate_postgres_changes',
    bash_command='python /opt/airflow/scripts/simulates_changes_postgres.py',
    dag=dag,
)

# Task 2: Simulate changes in attendance CSV
simulate_csv_changes = BashOperator(
    task_id='simulate_csv_changes',
    bash_command='python /opt/airflow/scripts/simulates_changes_csv.py',
    dag=dag,
)

# Task 3: Extract data from PostgreSQL and CSV to MinIO
extract_to_minio = BashOperator(
    task_id='extract_to_minio',
    bash_command='python /opt/airflow/scripts/extract_siak_to_minio.py',
    dag=dag,
)

# Set task dependencies - execute in sequence
simulate_postgres_changes >> simulate_csv_changes >> extract_to_minio
