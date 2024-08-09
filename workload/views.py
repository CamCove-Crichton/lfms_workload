from django.contrib.auth.decorators import login_required
from django.shortcuts import render
from django.http import JsonResponse
from .api_calls import get_opportunities
from .utils import weight_calc, date_check


@login_required
def workload(request):
    """
    A view to display the current workload and upcoming
    workload using in the form of a traffic light system
    """
    template = 'workload/workload.html'

    return render(request, template)


def api_workload(request):
    """
    A view to expose the workload data to the frontend
    """
    # Get the opportunities from the API
    provisional_opportunities = get_opportunities(
        page=1, per_page=25, state_eq=2, status_eq=1)
    reserved_opportunities = get_opportunities(
        page=1, per_page=25, state_eq=2, status_eq=5)
    confirmed_opportunities = get_opportunities(
        page=1, per_page=25, state_eq=3, status_eq=0)

    # Create lists to store the opportunities within the next 14 days
    provisional_within_date = []
    reserved_within_date = []
    confirmed_within_date = []

    # Check the dates of the opportunities and append to the lists
    date_check(
        provisional_opportunities, provisional_within_date)
    date_check(reserved_opportunities, reserved_within_date)
    date_check(confirmed_opportunities, confirmed_within_date)

    # Calculate the weight of the opportunities
    provisional_weight = weight_calc(provisional_within_date)
    reserved_weight = weight_calc(reserved_within_date)
    confirmed_weight = weight_calc(confirmed_within_date)

    data = {
        'provisional_weight': provisional_weight,
        'reserved_weight': reserved_weight,
        'confirmed_weight': confirmed_weight,
        'confirmed_opportunities': confirmed_opportunities,
    }

    return JsonResponse(data)
