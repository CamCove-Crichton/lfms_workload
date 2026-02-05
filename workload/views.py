import os
from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.shortcuts import render, get_object_or_404
from django.views import View
from django.http import JsonResponse, QueryDict
from django_celery_results.models import TaskResult
from django.utils import timezone
from django.db.models.functions import Coalesce
from django.db.models import Prefetch

from datetime import timedelta
from decimal import Decimal
import json
import logging
from .tasks import fetch_workshop_workload
from celery.result import AsyncResult
from .api_calls import get_opportunities
from .utils import (
    weight_calc,
    date_check,
    fetch_workload_data,
)
from .models import Opportunity, CustomInput, ScenicCalcItems

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


# def api_workshop_workload(request=None):
#     """
#     A view to expose the workload data to the frontend for
#     the workload display for the workshop
#     """
#     # Check if 'days' is passed in the request (e.g., as a query parameter)
#     days = int(request.GET.get('days', 14))  # Default to 14 if 'days' isn't in the query params

#     # Call the function from utils.py to fetch the data
#     data = fetch_workload_data(days=days)

#     # Return the data as JSON
#     return JsonResponse(data)


def get_workshop_workload_data(request):
    """A view to get the latest workload result from the database in the next 91 days"""

    today = timezone.now().date()
    future_date = today + timedelta(days=91)

    opportunities = (
        Opportunity.objects.annotate(
            effective_start = Coalesce("load_starts_at", "deliver_starts_at", "starts_at")
        ).filter(
            is_active=True,
            effective_start__range=[today, future_date]
        ).prefetch_related(
            Prefetch(
                "scenic_calc_items",
                queryset=ScenicCalcItems.objects.filter(is_active=True)
            ),
            "tags",
            "client",
            "owner",
            "venue",
            "custom_input"
        ).order_by("effective_start")
    )

    data = []
    for opp in opportunities:
        items = []
        tags = [tag.name for tag in opp.tags.all()]

        for sci in opp.scenic_calc_items.all():
            items.append({
                "current_item_id": sci.current_item_id,
                "name": sci.name,
                "item_total": float(sci.item_total or 0),
                "previous_item_total": float(sci.previous_item_total or 0),
                "item_updated_at": sci.updated_at.isoformat() if sci.updated_at else None,
                "item_previously_updated_at": sci.previously_updated_at.isoformat() if sci.previously_updated_at else None,
            })
        scenic_total = getattr(opp, "scenic_calc_total", None)

        data.append({
            "opportunity_id": opp.current_id,
            "name": opp.opportunity_name,
            "previous_name": opp.previous_opportunity_name,
            "client": opp.client.name,
            "owner": opp.owner.name,
            "venue": opp.venue.name if opp.venue else None,
            "order_number": opp.order_number,
            "status": opp.status,
            "status_name": opp.status_name,
            "previous_status_name": opp.previous_status_name,
            "dry_hire": opp.dry_hire,
            "dry_hire_transport": opp.dry_hire_transport,
            "starts_at": opp.starts_at,
            "ends_at": opp.ends_at,
            "load_starts_at": opp.load_starts_at,
            "deliver_starts_at": opp.deliver_starts_at,
            "setup_starts_at": opp.setup_starts_at,
            "show_starts_at": opp.show_starts_at,
            "tags": tags,
            "opp_updated_at": opp.updated_at,
            "items": items,
            "custom_input": {
                "include_weekends": opp.custom_input.include_weekends,
                "previous_include_weekends": opp.custom_input.previous_include_weekends,
                "num_of_carpenters": opp.custom_input.num_of_carpenters,
                "previous_num_of_carpenters": opp.custom_input.previous_num_of_carpenters,
                "planned_finish_date": opp.custom_input.planned_finish_date,
                "previous_planned_finish_date": opp.custom_input.previous_planned_finish_date,
                "built": opp.custom_input.built,
                "updated_at": opp.custom_input.updated_at,
                "previously_updated_at": opp.custom_input.previously_updated_at,
                "working_days": float(opp.custom_input.working_days or 0),
                "previous_working_days": float(opp.custom_input.previous_working_days or 0),
                "date_out": opp.custom_input.date_out,
                "previous_date_out": opp.custom_input.previous_date_out,
                "time_out": opp.custom_input.time_out.strftime("%H:%M") if opp.custom_input.time_out else None,
                "previous_time_out":opp.custom_input.previous_time_out.strftime("%H:%M") if opp.custom_input.previous_time_out else None,
                "start_build_date": opp.custom_input.start_build_date,
            },
            "totals": {
                "grand_total": float(scenic_total.grand_total) if scenic_total else 0,
                "previous_grand_total": float(scenic_total.previous_grand_total) if scenic_total.previous_grand_total else 0,
            },
        })
    
    return JsonResponse({"result": data})


def custom_input(request, current_id):
    """A view to handle retrieving or saving data for the opportunity custom inputs"""
    opportunity = get_object_or_404(Opportunity, current_id=current_id)

    if request.method == "POST":
        data = json.loads(request.body.decode("utf-8"))
        input_obj, _ = CustomInput.objects.get_or_create(
            opportunity=opportunity,
            defaults={
                "num_of_carpenters": 1,
                "include_weekends": False,
                "planned_finish_date": None,
                "built": False,
            }
        )

        updated_fields = {}

        if "num_of_carpenters" in data:
            input_obj.num_of_carpenters = data["num_of_carpenters"]
            updated_fields["num_of_carpenters"] = data["num_of_carpenters"]
        if "include_weekends" in data:
            input_obj.include_weekends = data["include_weekends"]
            updated_fields["include_weekends"] = data["include_weekends"]
        if "planned_finish_date" in data:
            input_obj.planned_finish_date = data["planned_finish_date"]
            updated_fields["planned_finish_date"] = data["planned_finish_date"]
        if "built" in data:
            input_obj.built = data["built"]
            updated_fields["built"] = data["built"]
        if "working_days" in data:
            input_obj.working_days = data["working_days"]
            updated_fields["working_days"] = data["working_days"]
        if "start_build_date" in data:
            input_obj.start_build_date = data["start_build_date"]
            updated_fields["start_build_date"] = data["start_build_date"]
        
        input_obj.save()

        return JsonResponse({
            "status": "ok",
            "updated_data": updated_fields,
        })
    
    elif request.method == "GET":
        input_obj = getattr(opportunity, "custom_input", None)

        if not input_obj:
            return JsonResponse({
                "opportunity_id": current_id,
                "num_of_carpenters": 1,
                "include_weekends": False,
                "planned_finish_date": None,
                "built": False,
                "updated_at": None,
                "previously_updated_at": None,
            })
        
        data = {
            "opportunity_id": current_id,
            "num_of_carpenters": input_obj.num_of_carpenters,
            "include_weekends": input_obj.include_weekends,
            "working_days": input_obj.working_days,
            "start_build_date": (
                input_obj.start_build_date.isoformat()
                if input_obj.start_build_date else None
            ),
            "planned_finish_date": (
                input_obj.planned_finish_date.isoformat()
                if input_obj.planned_finish_date else None
            ),
            "built": input_obj.built,
            "updated_at": input_obj.updated_at.isoformat(),
            "previously_updated_at": (
                input_obj.previously_updated_at.isoformat()
                if input_obj.previously_updated_at else None
            ),
        }
        return JsonResponse(data)
    else:
        return JsonResponse({"error": "Unsupported method"}, status=405)


# def start_workshop_workload_task(request):
#     """Trigger Celery task and return task ID."""
#     try:
#         days_param = request.GET.get('days', '14')
#         logger.info(f"📩 Received request to start Celery task with days={days_param}")
        
#         days = int(days_param)

#         task = fetch_workshop_workload.delay(days)
        
#         logger.info(f"Celery task {task.id} triggered successfully with {days} days")
#         return JsonResponse({"task_id": task.id})
    
#     except ValueError as ve:
#         logger.error(f"❌ Invalid 'days' parameter: {ve}", exc_info=True)
#         return JsonResponse({"error": "Invalid 'days' parameter"}, status=400)
    
#     except Exception as e:
#         logger.error(f"🔥 Unexpected error: {e}", exc_info=True)
#         return JsonResponse({"error": "Internal server error"}, status=500)


# def check_task_status(request, task_id):
#     """Check if Celery task is complete and return result."""
#     result = AsyncResult(task_id)
#     if result.ready():
#         print(f"Task {task_id} completed with result")
#         return JsonResponse({"status": "completed", "result": result.result})
#     print(f"Task {task_id} still pending")
#     return JsonResponse({"status": "pending"})
