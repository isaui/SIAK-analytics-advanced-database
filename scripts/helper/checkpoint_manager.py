"""
Checkpoint management utilities for ETL processes

This module provides functions to manage extraction checkpoints, store metadata about
extractions, and track state between different ETL runs to support incremental updates.
"""

import json
import logging
from io import BytesIO
from datetime import datetime
from typing import Dict, Optional, Any, Union

# Configure logging
logger = logging.getLogger('checkpoint_manager')

def get_latest_cdc_lsn(minio_client) -> Optional[str]:
    """
    Get the latest CDC LSN (Log Sequence Number) from checkpoint
    
    Args:
        minio_client: MinIO client
        
    Returns:
        LSN string or None if not found
    """
    checkpoint = get_latest_extraction_info(minio_client)
    if checkpoint and 'cdc' in checkpoint and checkpoint['cdc'].get('last_lsn'):
        return checkpoint['cdc']['last_lsn']
    return None


def get_latest_extraction_info(minio_client) -> Optional[Dict]:
    """
    Retrieve information about the latest extraction from checkpoint file in MinIO
    
    Args:
        minio_client: MinIO client
        
    Returns:
        Dictionary with extraction info or None if not found
    """
    try:
        # Check if checkpoint exists
        response = minio_client.get_object("checkpoints", "extraction_checkpoint.json")
        checkpoint_data = response.read().decode('utf-8')
        checkpoint = json.loads(checkpoint_data)
        
        # Log CDC info if available
        if 'cdc' in checkpoint and checkpoint['cdc'].get('last_lsn'):
            logger.info(f"Found previous CDC LSN: {checkpoint['cdc']['last_lsn']}")
        
        logger.info(f"Found previous extraction checkpoint from {checkpoint.get('timestamp', 'unknown')}")
        return checkpoint
    except Exception as e:
        logger.info("No previous extraction checkpoint found or error reading it")
        return None


def update_extraction_checkpoint(minio_client, extraction_info: Dict):
    """
    Update the checkpoint file with information about the current extraction
    
    Args:
        minio_client: MinIO client instance
        extraction_info: Dictionary with information about the current extraction
    """
    # Convert to JSON string
    checkpoint_json = json.dumps(extraction_info, indent=2)
    checkpoint_bytes = BytesIO(checkpoint_json.encode('utf-8'))
    
    # Upload to MinIO
    minio_client.put_object(
        bucket_name="checkpoints",
        object_name="extraction_checkpoint.json", 
        data=checkpoint_bytes,
        length=len(checkpoint_json),
        content_type="application/json"
    )
    
    logger.info(f"Updated extraction checkpoint: {extraction_info['timestamp']}")


def create_extraction_info(base_path: str) -> Dict:
    """
    Create a new extraction info dictionary with basic metadata
    
    Args:
        base_path: The base path where the data was extracted to
        
    Returns:
        Dictionary with extraction info metadata
    """
    return {
        "timestamp": datetime.now().isoformat(),
        "base_path": base_path,
        "tables": {},
        "cdc": {
            "last_lsn": None,
            "last_processed": datetime.now().isoformat()
        }
    }
