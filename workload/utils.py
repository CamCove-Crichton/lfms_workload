from decimal import Decimal
from datetime import timedelta, datetime, timezone
from .api_calls import (
    get_opportunities,
    get_products,
    get_opportunity_items,)


def round_to_decimal(value, decimal_places=2):
    """
    Round a value to a given number of decimal places.

    Parameters:
    - value: The value to round
    - decimal_places: The number of decimal places to round to

    Returns:
    - The rounded value
    """
    return round(Decimal(str(value)), decimal_places)


def date_check(opportunities, within_date, days):
    """
    Check if the opportunities are within the given date range.

    Parameters:
    - opportunities: The opportunities to check
    - within_date: list to append the opportunities that are
    within the date range
    """
    today = datetime.now(timezone.utc)
    two_weeks_later = today + timedelta(days=days)

    for opportunity in opportunities:
        try:
            job_date_str = opportunity['starts_at']

            # Check if the job_date_str is not None
            if job_date_str:
                # Convert the string to a datetime object
                job_date = datetime.strptime(
                    job_date_str, '%Y-%m-%dT%H:%M:%S.%fZ').replace(
                        tzinfo=timezone.utc)

                # Check if the job_date is within the date range
                if today <= job_date <= two_weeks_later:
                    within_date.append(opportunity)
        except KeyError as e:
            # Handle KeyError if 'starts_at' is not in the opportunity
            print(f"KeyError: {e} - 'starts_at' not found in the opportunity \
                  {opportunity.get('number', 'unknown')}")
        except TypeError as e:
            # Handle TypeError if job_date is None
            print(f"TypeError: {e} - 'starts_at' is None in the opportunity \
                  {opportunity.get('number', 'unknown')}")

    return within_date


def weight_calc(opportunities_within_date):
    """
    Calculate the total weight of the opportunities within the date range.

    Parameters:
    - opportunities_within_date: The opportunities within the date range

    Returns:
    - The total weight of the opportunities within the date range
    """
    weights = []

    for opportunity in opportunities_within_date:
        weight_total_str = opportunity['weight_total']

        try:
            # Try convert the string to a float
            weight_total = float(weight_total_str)
            weight_total_rounded = round_to_decimal(weight_total, 2)
            weights.append(weight_total_rounded)
        except ValueError:
            # Handle the case where the string is not a float
            print(f'Warning: Could not convert {weight_total_str} to a float')

    total_weight = sum(weights)

    return total_weight


def get_opps_with_items(opportunities):
    """
    Get opportunity items for each opportunity in the list."""
    opps_with_items = []
    for opportunity in opportunities:
        id = opportunity['id']
        items = []
        opportunity_items = get_opportunity_items(id)
        items.extend(opportunity_items)
        opps_with_items.append({
            'opportunity': opportunity,
            'items': items
        })
    return opps_with_items


def remove_product(active_products, num):
    """
    Remove a specific product from the list of active products.

    Parameters:
    - active_products: The list of active products

    Returns:
    - The list of active products with the specified product removed
    """
    active_products = [
        product for product in active_products if product['id'] != num]
    return active_products


def fetch_workload_data(days=14):
    """
    Fetch and process the workshop workload data.
    This logic is used by both the view and the Celery task.
    """
    # Get the opportunities from the API
    provisional_opportunities = get_opportunities(
        page=1, per_page=25, state_eq=2, status_eq=1)
    reserved_opportunities = get_opportunities(
        page=1, per_page=25, state_eq=2, status_eq=5)
    confirmed_opportunities = get_opportunities(
        page=1, per_page=25, state_eq=3, status_eq=0)

    all_active_products = get_products(
        page=1, per_page=20, filtermode='active', product_group='Scenic Calcs')

    active_products = remove_product(all_active_products, 4597)

    # Create lists to store the opportunities within the specified days
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

    return data
