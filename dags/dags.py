from airflow import DAG
from airflow.providers.postgres.operators.postgres import PostgresOperator
from airflow.providers.minio.transfers.s3_to_local import S3ToLocalOperator
from airflow.providers.minio.transfers.local_to_s3 import LocalToS3Operator
from datetime import datetime

def extract_data():
    # Implementasi ekstraksi data dari MinIO ke sistem lokal
    pass

def transform_data():
    # Implementasi pembersihan dan transformasi data
    pass

def load_data():
    # Implementasi pemuatan data ke PostgreSQL
    pass

with DAG(
    'siak_etl',
    default_args={'owner': 'airflow'},
    description='ETL pipeline for SIAK data',
    schedule_interval='@daily',
    start_date=datetime(2025, 5, 21),
    catchup=False,
) as dag:

    extract = PythonOperator(
        task_id='extract_data',
        python_callable=extract_data,
    )

    transform = PythonOperator(
        task_id='transform_data',
        python_callable=transform_data,
    )

    load = PythonOperator(
        task_id='load_data',
        python_callable=load_data,
    )

    extract >> transform >> load
