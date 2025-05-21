from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.providers.postgres.operators.postgres import PostgresOperator
from airflow.providers.minio.transfers.s3_to_local import S3ToLocalOperator
from airflow.providers.minio.transfers.local_to_s3 import LocalToS3Operator
from datetime import datetime

def read_data():
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

    read = PythonOperator(
        task_id='read_data',
        python_callable=read_data,
    )

    transform = PythonOperator(
        task_id='transform_data',
        python_callable=transform_data,
    )

    load = PythonOperator(
        task_id='load_data',
        python_callable=load_data,
    )

    read >> transform >> load
