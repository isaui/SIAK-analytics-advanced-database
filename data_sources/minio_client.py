#!/usr/bin/env python
"""
MinIO Client Wrapper

Provides a Singleton pattern implementation for the MinIO client
to ensure consistent connection and configuration across the application.
"""

import os
import logging
from minio import Minio
from minio.error import S3Error
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger('minio_client')

# Load environment variables
load_dotenv()

# Default connection parameters
DEFAULT_CONFIG = {
    "endpoint": f"{os.getenv('MINIO_HOST', 'localhost')}:{os.getenv('MINIO_PORT', '9000')}",
    "access_key": os.getenv('MINIO_ROOT_USER', 'minioadmin'),
    "secret_key": os.getenv('MINIO_ROOT_PASSWORD', 'minioadmin'),
    "secure": os.getenv('MINIO_SECURE', 'False').lower() == 'true'
}

class MinioClientSingleton:
    """Singleton MinIO client for consistent connection handling"""
    _instance = None
    _client = None
    _config = None
    
    def __new__(cls, config=None):
        if cls._instance is None:
            cls._instance = super(MinioClientSingleton, cls).__new__(cls)
            cls._config = config or DEFAULT_CONFIG
            cls._create_client()
        return cls._instance
    
    @classmethod
    def _create_client(cls):
        """Create MinIO client instance"""
        try:
            cls._client = Minio(
                endpoint=cls._config["endpoint"],
                access_key=cls._config["access_key"],
                secret_key=cls._config["secret_key"],
                secure=cls._config["secure"]
            )
            logger.info(f"MinIO client created with endpoint: {cls._config['endpoint']}")
        except Exception as e:
            logger.error(f"Error creating MinIO client: {str(e)}")
            raise
    
    def get_client(self):
        """Return the MinIO client instance"""
        return self._client
    
    def ensure_bucket_exists(self, bucket_name):
        """Ensure a bucket exists, create if it doesn't"""
        try:
            if not self._client.bucket_exists(bucket_name):
                self._client.make_bucket(bucket_name)
                logger.info(f"Created bucket: {bucket_name}")
                return True
            return True
        except S3Error as e:
            logger.error(f"Error ensuring bucket {bucket_name} exists: {str(e)}")
            return False

# Global function to get a MinIO client
def get_minio_client(config=None):
    """Get a MinIO client instance using the singleton pattern"""
    minio_instance = MinioClientSingleton(config)
    return minio_instance.get_client()

# Function to ensure required buckets exist
def ensure_buckets_exist(bucket_names=None):
    """Ensure specified buckets exist, create if they don't"""
    if bucket_names is None:
        bucket_names = ["raw", "processed"]
    
    minio_instance = MinioClientSingleton()
    
    results = {}
    for bucket in bucket_names:
        results[bucket] = minio_instance.ensure_bucket_exists(bucket)
    
    return results
