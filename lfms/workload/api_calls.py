from django.conf import settings
import requests


def get_opportunities(page=1, per_page=25, state_eq=2, status_eq=1):
    """
    Get opportunities from the API
    """
    # API configurations
    url = settings.API_URL
    subdomain = settings.X_SUBDOMAIN
    auth_token = settings.X_AUTH_TOKEN

    payload = {}

    # API headers
    headers = {
        'X-SUBDOMAIN': subdomain,
        'X-AUTH-TOKEN': auth_token,
    }

    # API parameters
    params = {
        'page': page,
        'per_page': per_page,
        'q[state_eq]': state_eq,
        'q[status_eq]': status_eq,
        'q[s][]': 'starts_at asc',
    }

    response = requests.request(
        "GET", url, params=params, headers=headers, data=payload)

    if response.status_code == 200:
        data = response.json()

        return data
    else:
        print(f'Error: {response.status_code}')
        return None
