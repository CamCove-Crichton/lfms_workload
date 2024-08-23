from django.conf import settings
import requests


def get_opportunities(
        page=1, per_page=25, state_eq=2, status_eq=1, owner_name_eq=None):
    """
    Get opportunities from the API with pagination
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

    opportunities = []

    while True:
        # API parameters
        params = {
            'page': page,
            'per_page': per_page,
            'q[state_eq]': state_eq,
            'q[status_eq]': status_eq,
            'q[s][]': 'starts_at asc',
        }

        # Add optional parameter if provided
        if owner_name_eq is not None:
            params['q[owner_name_eq]'] = owner_name_eq

        response = requests.request(
            "GET", url, params=params, headers=headers, data=payload)

        if response.status_code == 200:
            data = response.json()
            print(f'Fetched page {page} of \
{data["meta"]["total_row_count"]} opportunities')

            # Add current page data to opportunities list
            opportunities.extend(data["opportunities"])

            # Check if there are more pages to fetch
            if data["meta"]["total_row_count"] > data[
                    "meta"]["per_page"] * data["meta"]["page"]:
                # Increment page number
                page += 1
            else:
                # Break the loop if all data is fetched
                break
        else:
            print(f'Error: {response.status_code}')
            return None

    return opportunities


def get_users(page=1, per_page=100, filtermode='user'):
    """
    Get users from the API
    """
    # API configurations
    url = settings.USERS_API_URL
    subdomain = settings.X_SUBDOMAIN
    auth_token = settings.X_AUTH_TOKEN

    payload = {}

    # API headers
    headers = {
        'X-SUBDOMAIN': subdomain,
        'X-AUTH-TOKEN': auth_token,
    }

    users = []

    while True:
        # API parameters
        params = {
            'page': page,
            'per_page': per_page,
            'filtermode': filtermode,
        }

        response = requests.request(
            "GET", url, params=params, headers=headers, data=payload)

        if response.status_code == 200:
            data = response.json()
            print(f'Fetched page {page} of \
{data["meta"]["total_row_count"]} users')

            # Add current page data to users list
            users.extend(data["members"])

            # Check if there are more pages to fetch
            if data["meta"]["total_row_count"] > data[
                        "meta"]["per_page"] * data["meta"]["page"]:
                # Increment page number
                page += 1
            else:
                # Break the loop if all data is fetched
                break
        else:
            print(f'Error: {response.status_code}')
            return None

    return users
