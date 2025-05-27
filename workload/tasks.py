from celery import shared_task
from .utils import fetch_workload_data
import logging

logger = logging.getLogger(__name__)

@shared_task
def fetch_workshop_workload(days):
    """Celery task to fetch workload data asynchronously."""
    logger.info(f"Running Celery Task with days={days}")
    print('Inside fetch_workshop_workload function & calling fetch_workload_data function')
    data = fetch_workload_data(days=days)
    
    return data


@shared_task
def test_celery_task():
    logger.info("✅ Celery task ran successfully.")
    print("✅ Celery task ran successfully.")
    return "Task completed"
