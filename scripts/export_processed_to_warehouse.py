#!/usr/bin/env python
"""
Export data dari MinIO processed ke warehouse PostgreSQL

Script ini membaca data yang sudah ditransformasi dari MinIO processed bucket 
dan mengekspornya ke database warehouse dalam format star schema.
"""

import os
import sys
import logging
import pandas as pd
from datetime import datetime
from typing import Dict, Any, Optional

# Import MinIO client singleton
from data_sources.minio_client import get_minio_client

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# Import helper modules
from scripts.helper.export.export_utils import get_latest_processed_timestamp, create_export_manifest
from scripts.helper.export.dimension_exporters import export_all_dimensions
from scripts.helper.export.fact_exporters import export_all_facts

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('export_to_warehouse')

# Removed redundant get_minio_client as we now use the singleton implementation

def export_processed_to_warehouse(processed_timestamp=None):
    """
    Export data dari MinIO processed ke warehouse PostgreSQL
    
    Args:
        processed_timestamp: Timestamp data processed yang akan diexport.
                            Jika None, akan menggunakan timestamp terbaru.
                            
    Returns:
        True jika berhasil, False jika gagal
    """
    export_start_time = datetime.now()
    export_timestamp = export_start_time.strftime("%Y%m%d_%H%M%S")
    logger.info(f"Starting export process with timestamp: {export_timestamp}")
    
    try:
        # Get MinIO client using the singleton pattern
        minio_client = get_minio_client()
        
        # Get latest timestamp if not provided
        if not processed_timestamp:
            processed_timestamp = get_latest_processed_timestamp(minio_client)
            if not processed_timestamp:
                logger.error("No processed data timestamp found")
                return False
        
        logger.info(f"Exporting processed data with timestamp: {processed_timestamp}")
        
        # Export dimensions first (respecting foreign key dependencies)
        logger.info("Exporting dimension tables...")
        dimension_results = export_all_dimensions(minio_client, processed_timestamp)
        
        # Check if all dimensions exported successfully
        dim_success = all(result.get('success', False) for result in dimension_results.values())
        if not dim_success:
            failed_dims = [dim for dim, result in dimension_results.items() 
                           if not result.get('success', False)]
            logger.warning(f"Some dimension exports failed: {failed_dims}")
        else:
            logger.info("All dimension tables exported successfully")
        
        # Export facts
        logger.info("Exporting fact tables...")
        fact_results = export_all_facts(minio_client, processed_timestamp)
        
        # Check if all facts exported successfully
        fact_success = all(result.get('success', False) for result in fact_results.values())
        if not fact_success:
            failed_facts = [fact for fact, result in fact_results.items() 
                            if not result.get('success', False)]
            logger.warning(f"Some fact exports failed: {failed_facts}")
        else:
            logger.info("All fact tables exported successfully")
        
        # Combine results
        all_results = {**dimension_results, **fact_results}
        
        # Create export manifest
        create_export_manifest(
            minio_client, 
            processed_timestamp, 
            export_timestamp, 
            all_results
        )
        
        # Calculate elapsed time
        elapsed_time = (datetime.now() - export_start_time).total_seconds()
        logger.info(f"Export process completed in {elapsed_time:.2f} seconds")
        
        # Return overall success status
        overall_success = dim_success and fact_success
        return overall_success
        
    except Exception as e:
        logger.error(f"Error during export process: {str(e)}")
        return False

if __name__ == "__main__":
    # Jika dijalankan langsung (bukan diimpor sebagai modul)
    # Sesuai preferensi user, fungsi bisa dipanggil tanpa sys.argv
    # dan tidak perlu menggunakan argparse
    processed_timestamp = None
    
    # Jika ada argumen command line, gunakan sebagai timestamp
    if len(sys.argv) > 1:
        processed_timestamp = sys.argv[1]
    
    # Jalankan export
    export_processed_to_warehouse(processed_timestamp)
