from datetime import timedelta, datetime, timezone


def date_deadline(opportunities, within_date):
    """
    Check if the opportunities are within the given date range.

    Parameters:
    - opportunities: The opportunities to check
    - within_date: list to append the opportunities that are
    within the date range
    """
    today = datetime.now(timezone.utc)
    ten_days_later = today + timedelta(days=10)

    for opportunity in opportunities:
        try:
            client_deadline_str = opportunity[
                'custom_fields']['client_confirmation_deadline']

            # Check if the client_deadline_str is not None
            if client_deadline_str:
                # Convert the string to a datetime object
                client_deadline = datetime.strptime(
                    opportunity['custom_fields'][
                        'client_confirmation_deadline'], '%Y-%m-%d').replace(
                            tzinfo=timezone.utc)

                # Check if the client_deadline is within the date range
                if today <= client_deadline <= ten_days_later:
                    within_date.append(opportunity)
        except KeyError as e:
            # Handle KeyError if 'client_confirmation_deadline'
            # is not in the opportunity
            print(f"KeyError: {e} - 'client_confirmation_deadline' not \
                  found in the opportunity \
                  {opportunity.get('number', 'unknown')}")
        except TypeError as e:
            # Handle TypeError if client_deadline is None
            print(f"TypeError: {e} - 'client_confirmation_deadline' is \
                  None in the opportunity \
                  {opportunity.get('number', 'unknown')}")

    return within_date
