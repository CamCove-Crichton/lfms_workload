from django.shortcuts import render
from .api_calls import get_opportunities
from .utils import round_to_decimal, date_check

def workload(request):
    """
    A view to display the current workload and upcoming
    workload using in the form of a traffic light system
    """
    provisional_opportunities = get_opportunities(page=1, per_page=25, state_eq=2, status_eq=1)
    reserved_opportunities = get_opportunities(page=1, per_page=25, state_eq=2, status_eq=5)
    confirmed_opportunities = get_opportunities(page=1, per_page=25, state_eq=3, status_eq=0)

    opportunities_within_date = []

    date_check(provisional_opportunities['opportunities'], opportunities_within_date)

    print(opportunities_within_date)
    # print(reserved_opportunities)

    weights = []

    for opportunity in opportunities_within_date:
        weight_total_str = opportunity['weight_total']
        
        try:
            #Try convert the string to a float
            weight_total = float(weight_total_str)
            weight_total_rounded = round_to_decimal(weight_total, 2)
            weights.append(weight_total_rounded)
        except ValueError:
            #Handle the case where the string is not a float
            print(f'Warning: Could not convert {weight_total_str} to a float')
    
    print(weights)

    total_weight = sum(weights)

    print(f'Total weight: {total_weight}')
    
    

    template = 'workload/workload.html'
    context = {
        'provisional_opportunities': provisional_opportunities,
        'reserved_opportunities': reserved_opportunities,
        'confirmed_opportunities': confirmed_opportunities,
    }

    return render(request, template, context)
