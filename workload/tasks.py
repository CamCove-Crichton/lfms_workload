from celery import shared_task
from .utils import fetch_workload_data
import logging

logger = logging.getLogger(__name__)

@shared_task
def fetch_workshop_workload(days):
    """Celery task to fetch workload data asynchronously."""
    logger.info(f"Running Celery Task with days={days}")
    data = fetch_workload_data(days=days)
    
    return data

