from django.contrib.auth.decorators import login_required
from django.shortcuts import render
from django.views import View
from django.http import JsonResponse, QueryDict
import logging
from .tasks import fetch_workshop_workload
from celery.result import AsyncResult
from .api_calls import get_opportunities
from .utils import (
    weight_calc,
    date_check,
    fetch_workload_data,
)

logger = logging.getLogger(__name__)

@login_required
def workload(request):
    """
    A view to display the current workload and upcoming
    workload using in the form of a traffic light system
    """
    template = 'workload/workload.html'

    return render(request, template)


@login_required
def workshop_workload(request):
    """
    A view to display the current workload for the
    workshop
    """
    template = 'workload/workshop_workload.html'

    return render(request, template)


def api_workload(request: QueryDict):
    """
    A view to expose the workload data to the frontend for
    the workload display for the warehouse
    """

    # Get the 'days' query parameter, otherwise default to 14
    days = int(request.GET.get('days', 14))

    # Get the opportunities from the API
    provisional_opportunities = get_opportunities(
        page=1, per_page=25, state_eq=2, status_eq=1)
    reserved_opportunities = get_opportunities(
        page=1, per_page=25, state_eq=2, status_eq=5)
    confirmed_opportunities = get_opportunities(
        page=1, per_page=25, state_eq=3, status_eq=0)
    active_opportunities = get_opportunities(
        page=1, per_page=25, state_eq=3, status_eq=20)

    # Create lists to store the opportunities within the specified days
    provisional_within_date = []
    reserved_within_date = []
    confirmed_within_date = []

    # Check the dates of the opportunities and append to the lists
    date_check(
        provisional_opportunities, provisional_within_date, days)
    date_check(reserved_opportunities, reserved_within_date, days)
    date_check(confirmed_opportunities, confirmed_within_date, days)

    # Calculate the weight of the opportunities
    provisional_weight = weight_calc(provisional_within_date)
    reserved_weight = weight_calc(reserved_within_date)
    confirmed_weight = weight_calc(confirmed_within_date)

    data = {
        'provisional_weight': provisional_weight,
        'reserved_weight': reserved_weight,
        'confirmed_weight': confirmed_weight,
        'confirmed_opportunities': confirmed_opportunities,
        'active_opportunities': active_opportunities,
    }

    return JsonResponse(data)


def api_workshop_workload(request=None):
    """
    A view to expose the workload data to the frontend for
    the workload display for the workshop
    """
    # Check if 'days' is passed in the request (e.g., as a query parameter)
    days = int(request.GET.get('days', 14))  # Default to 14 if 'days' isn't in the query params

    # Call the function from utils.py to fetch the data
    data = fetch_workload_data(days=days)

    # Return the data as JSON
    return JsonResponse(data)


def start_workshop_workload_task(request):
    """Trigger Celery task and return task ID."""
    try:
        days_param = request.GET.get('days', '14')
        logger.info(f"Received request to start workload task with days={days_param}")
        
        days = int(days_param)
        task = fetch_workshop_workload.delay(days)
        
        logger.info(f"Celery task {task.id} triggered successfully with {days} days")
        return JsonResponse({"task_id": task.id})
    
    except ValueError as ve:
        logger.error(f"Invalid 'days' parameter: {ve}", exc_info=True)
        return JsonResponse({"error": "Invalid 'days' parameter"}, status=400)
    
    except Exception as e:
        logger.error(f"Unexpected error in start_workshop_workload_task: {e}", exc_info=True)
        return JsonResponse({"error": "Internal server error"}, status=500)


def check_task_status(request, task_id):
    """Check if Celery task is complete and return result."""
    result = AsyncResult(task_id)
    if result.ready():
        print(f"Task {task_id} completed with result")
        return JsonResponse({"status": "completed", "result": result.result})
    print(f"Task {task_id} still pending")
    return JsonResponse({"status": "pending"})
