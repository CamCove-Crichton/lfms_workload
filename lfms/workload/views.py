from django.shortcuts import render
from django.conf import settings
import requests

def workload(request):
    """
    A view to display the current workload and upcoming
    workload using in the form of a traffic light system
    """
    # API configurations
    url = settings.API_URL
    subdomain = settings.X_SUBDOMAIN
    auth_token = settings.X_AUTH_TOKEN

    payload = {}

    headers = {
        'X-SUBDOMAIN': subdomain,
        'X-AUTH-TOKEN': auth_token,
    }

    response = requests.request("GET", url, headers=headers, data=payload)

    print(response.text)

    if response.status_code == 200:
        data = response.json()

        order_opportunities = {}

        for opportunity in data['opportunities']:
            if opportunity.get('state_name') == 'Order':
                order_opportunities[opportunity['id']] = opportunity
            
        # print(order_opportunities)
    else:
        print(f'Error: {response.status_code}')

    
    template = 'workload/workload.html'
    # context = {}

    return render(request, template)
