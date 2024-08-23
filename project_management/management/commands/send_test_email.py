from django.core.management.base import BaseCommand
from project_management.email_utils import send_weekly_email


class Command(BaseCommand):

    help = 'Send a test email'

    def handle(self, *args, **kwargs):
        """A command to send a test email"""
        send_weekly_email({})
