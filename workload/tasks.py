from celery import shared_task
from .utils import fetch_workload_data

@shared_task
def fetch_workshop_workload(days):
    """Celery task to fetch workload data asynchronously."""
    data = fetch_workload_data(days=days)
    
    return data

