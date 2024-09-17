from django.contrib.auth.decorators import login_required
from django.shortcuts import render
from django.views import View
from django.http import JsonResponse, QueryDict
from .api_calls import (
    get_opportunities,
    get_products,)
from .utils import weight_calc, date_check, get_opps_with_items


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

    # Create lists to store the opportunities within the next 14 days
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


def api_workshop_workload(request: QueryDict):
    """
    A view to expose the workload data to the frontend for
    the workload display for the workshop
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

    active_products = get_products(
        page=1, per_page=20, filtermode='active', product_group='Scenic Calcs')

    # Create lists to store the opportunities within the next 14 days
    # provisional_within_date = []
    # reserved_within_date = []
    # confirmed_within_date = []
    opportunities_within_date = []

    # Check the dates of the opportunities and append to the lists
    date_check(
        provisional_opportunities, opportunities_within_date, days)
    date_check(reserved_opportunities, opportunities_within_date, days)
    date_check(confirmed_opportunities, opportunities_within_date, days)

    # Get the opportunity items for each opportunity
    opportunities_with_items = get_opps_with_items(
        opportunities_within_date)

    data = {
        'opportunities_with_items': opportunities_with_items,
        'active_products': active_products
    }

    return JsonResponse(data)
