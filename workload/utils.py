from decimal import Decimal
from datetime import (
    timedelta,
    datetime,
    timezone,
    date
)
from dateutil import parser
from .api_calls import (
    get_opportunities,
    get_products,
    get_opportunity_items,)
from .models import Tag
from django.db import models
import math

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


def parse_datetime_safe(date_str):
    """A function to parse datetime strings to a datetime object"""

    try:
        return parser.parse(date_str) if date_str else None
    except Exception:
        return None


def parse_decimal_safe(value):
    """A function to parse a number string to a Decimal"""

    try:
        return Decimal(value)
    except Exception:
        return Decimal("0.0")


def get_previous_updated_at(model_cls, lookup: dict):
    """A helper function to get the previous updated_at value from a model"""
    try:
        return model_cls.objects.get(**lookup).updated_at
    except model_cls.DoesNotExist:
        return None


def assign_tags(model_obj, tag_names):
    """
    Assigns tags to a model instance with a ManyToManyField to Tag.

    Parameters:
        model_obj: The instance (e.g. owner, client, opportunity).
        tag_names: A list of tag name strings.
    """
    if not model_obj:
        return
    try:
        model_obj.tags.clear()
        tags = [Tag.objects.get_or_create(name=name)[0] for name in tag_names]
        model_obj.tags.add(*tags)
    except Exception as e:
        print(f"[ERROR] Failed to assign tags to {model_obj}: {e}")


def calculate_working_days(total_hours, carpenters_input):
    """
    Calcaulates the number of working days required for an opportunity

    Parameters:
        total_hours: The grand total hours of work for the opportunity
        carpenters_input: The number of carpenters assigned to work on the opportunity
    """
    try:
        total_hours = float(total_hours)
    except (TypeError, ValueError):
        print(f"ERROR! Could not convert total_hours: {total_hours}")
        total_hours = 0
    if not isinstance(total_hours, (int, float)):
        print(f"ERROR! Total hours - {total_hours} - is not an integer or float!")
        return 0
    if not isinstance(carpenters_input, (int, float)):
        print(f"ERROR! Carpenters Input - {carpenters_input} - is not an integer or float!")
        return 0
    
    working_half_days = math.ceil((total_hours / 4) / carpenters_input)
    return working_half_days / 2


def set_opp_date_and_time_out(opportunity):
    """
    Extracts a start date and time from an opportunity event.
    Mirrors the logic of the JS function setOpportunityDateAndTime.
    """

    if not isinstance(opportunity, dict):
        raise ValueError("opportunity must be a dictionary")

    try:
        # Choose the first non-null field in order of priority
        datetime_str = (
            opportunity.get("load_starts_at")
            or opportunity.get("deliver_starts_at")
            or opportunity.get("starts_at")
        )

        if not datetime_str:
            raise ValueError("No valid datetime found in opportunity")

        # Parse the datetime string
        load_starts_at = datetime.fromisoformat(datetime_str.replace("Z", "+00:00"))

        date_out = load_starts_at.date()
        time_out = load_starts_at.time().replace(second=0, microsecond=0)

        return date_out, time_out

    except Exception as e:
        print(f"Error in set_opportunity_date_and_time: {e}")
        return None, None
    

def create_start_build_date(working_days, date_out, include_weekends, planned_finish=False):
    """
    Calculates the start build date given working days, a date out, and weekend inclusion.
    Mirrors the JS createStartBuildDate function.
    """

    if not isinstance(date_out, date):
        raise ValueError("date_out must be a datetime.date object")

    if not isinstance(working_days, (int, float)):
        raise ValueError("working_days must be a number")

    # Round up to nearest whole number
    working_days = math.ceil(working_days) - 1 if planned_finish else math.ceil(working_days)
    start_build_date = date_out

    if not include_weekends:
        while working_days > 0:
            start_build_date -= timedelta(days=1)
            # Only count weekdays
            if start_build_date.weekday() < 5:  # 0–4 = Mon–Fri
                working_days -= 1
    else:
        start_build_date -= timedelta(days=working_days)

    return start_build_date


def update_model_with_history(
    model,
    lookup,
    defaults,
    previous_fields,
    updated_at_field="updated_at",
):
    print("\n--- update_model_with_history CALLED ---")
    print("Model:", model.__name__)
    print("Lookup:", lookup)
    print("Defaults BEFORE applying:", defaults)

    # 1 - Load the existing instance properly
    instance = model.objects.filter(**lookup).first()
    created = False

    print("Fetched instance:", instance)

    if not instance:
        # New object: create normally
        print("No instance found — creating new one")

        instance = model.objects.create(**lookup, **defaults)
        created = True

        print("Created new instance:", instance)
        return instance, created

    # 2 - Existing instance — set previous_* BEFORE updating
    print("EXISTING instance detected -- setting previous_ values")

    for field in previous_fields:
        old = getattr(instance, field, None)
        new = defaults.get(field)

        prev_field = f"previous_{field}"

        print(f"[FIELD] {field}: old={old}, new={new}")
        print(f"--> Setting {prev_field} = {old}")

        setattr(instance, prev_field, old)

        # Apply the new value
        setattr(instance, field, new)

    # 3 - Handle previously_updated_at
    if hasattr(instance, "previously_updated_at"):
        old_timestamp = getattr(instance, updated_at_field, None)
        print(f"Saving previously_updated_at = {old_timestamp}")
        instance.previously_updated_at = old_timestamp

    # 4 - Apply any other non-tracked defaults
    for key, value in defaults.items():
        if key not in previous_fields:
            setattr(instance, key, value)

    print("Saving instance with updated values...")
    instance.save()

    print("AFTER SAVE:")
    if hasattr(instance, "previously_updated_at"):
        print(f"previously_updated_at: {instance.previously_updated_at}")
        
    for f in previous_fields:
        print(f"  {f}: {getattr(instance, f)} | previous_{f}: {getattr(instance, 'previous_'+f)}")

    return instance, created
