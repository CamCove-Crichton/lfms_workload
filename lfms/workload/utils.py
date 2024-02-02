from decimal import Decimal
from datetime import timedelta, datetime, timezone

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


def date_check(opportunities, within_date):
    """
    Check if the opportunities are within the given date range.

    Parameters:
    - opportunities: The opportunities to check
    - within_date: list to append the opportunities that are within the date range
    """
    today = datetime.now(timezone.utc)
    print(today)
    two_weeks_later = today + timedelta(days=14)

    for opportunity in opportunities:
        try:
            job_date_str = opportunity['starts_at']

            # Check if the job_date_str is not None
            if job_date_str:
                # Convert the string to a datetime object
                job_date = datetime.strptime(job_date_str, '%Y-%m-%dT%H:%M:%S.%fZ').replace(tzinfo=timezone.utc)

                # Check if the job_date is within the date range
                if today <= job_date <= two_weeks_later:
                    within_date.append(opportunity)
        except KeyError as e:
            # Handle KeyError if 'starts_at' is not in the opportunity
            print(f"KeyError: {e} - 'starts_at' not found in the opportunity {opportunity.get('number', 'unknown')}")
        except TypeError as e:
            # Handle TypeError if job_date is None
            print(f"TypeError: {e} - 'starts_at' is None in the opportunity {opportunity.get('number', 'unknown')}")
    
    return within_date
