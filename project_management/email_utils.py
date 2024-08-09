from django.core.mail import send_mail, EmailMessage
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings
from workload.api_calls import get_opportunities
# from django.utils import timezone
# from django.core.management.base import BaseCommand


def send_weekly_email(recipient_email, subject, body, context):
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

    context = {
        'names': owners_set,
    }

    # Rend email subject
    subject = render_to_string(subject, context).strip()

    # Render email body
    body = render_to_string(body, context)

    # Strip HTML tags
    plain_text_body = strip_tags(body)

    # Send email
    send_mail(
        subject,
        plain_text_body,
        settings.EMAIL_HOST_USER,
        [recipient_email],
        html_message=body
    )
