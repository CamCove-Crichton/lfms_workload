from django.core.mail import send_mail, EmailMessage
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings
from workload.api_calls import get_opportunities, get_users
# from django.utils import timezone
# from django.core.management.base import BaseCommand


def send_weekly_email(context):
    """
    Send an email to the recipient_email with the subject and body provided.
    """
    # Use the api_calls to get the opportunities
    # Open quote opportunities
    open_quote_opportunities = get_opportunities(
        page=1, per_page=25, state_eq=2, status_eq=0)
    # Provisional opportunities
    provisional_opportunities = get_opportunities(
        page=1, per_page=25, state_eq=2, status_eq=1)
    # Get users from Current RMS
    users = get_users(page=1, per_page=100, filtermode='user')

    # Get a unique list of names of the owners of the open quote opportunities
    owners_set = set()
    # Iterate through the open quote and provisional opportunities
    for open_quote_opportunity, provisional_opportunity in zip(
            open_quote_opportunities, provisional_opportunities):
        # Extract the owner name
        owner_open_quote = open_quote_opportunity['owner']['name']
        owner_provisional = provisional_opportunity['owner']['name']
        # Add the owner names to the set
        owners_set.add(owner_open_quote)
        owners_set.add(owner_provisional)

    print(owners_set)

    # Create a dictionary to store the jobs for each owner
    jobs = {}

    # Iterate through names arrange opportunities by owner
    for name in owners_set:
        print(name)
        # Get the email address of the owner
        for user in users:
            if user['name'] == name:
                email = user['identity']['email']

        # Create a dictionary for the owner
        jobs[name] = {
            "owner": name,
            "email": email,
            "open_quotes": [],
            "provisional": [],
        }
        # Append the opportunities to the correct owner
        for opportunity in open_quote_opportunities:
            if opportunity['owner']['name'] == name:
                order = {
                    'order_number': opportunity['number'],
                    'subject': opportunity['subject'],
                    'deadline': opportunity[
                        'custom_fields']['client_confirmation_deadline'],
                }
                jobs[name]['open_quotes'].append(order)

        for opportunity in provisional_opportunities:
            if opportunity['owner']['name'] == name:
                order = {
                    'order_number': opportunity['number'],
                    'subject': opportunity['subject'],
                    'deadline': opportunity[
                        'custom_fields']['client_confirmation_deadline'],
                }
                jobs[name]['provisional'].append(order)

        print(jobs[name])
        print()
        print()

    # iterate through the owners and send an email to each owner
    for name in owners_set:
        context = {
            'name': name,
            'open_quotes': jobs[name]['open_quotes'],
            'provisional': jobs[name]['provisional'],
        }

        # Rend email subject
        subject = render_to_string(
            'project_management/emails/weekly_report_subject.txt',
            context).strip()

        # Render email body
        body = render_to_string(
            'project_management/emails/weekly_report_body.txt', context)

        # Strip HTML tags
        plain_text_body = strip_tags(body)

        # Send email
        send_mail(
            subject,
            plain_text_body,
            settings.EMAIL_HOST_USER,
            [jobs[name]['email']],
            html_message=body
        )
