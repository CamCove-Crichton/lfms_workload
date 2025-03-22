from __future__ import absolute_import, unicode_literals
import os
from celery import Celery

# Set the default Django settings module for the 'celery' program.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'lfms.settings')

app = Celery('lfms')

app.config_from_object('django.conf:settings', namespace='CELERY')

# Add SSL configuration for Redis broker
app.conf.update(
    broker_use_ssl={
        'ssl_cert_reqs': 'CERT_REQUIRED',  # Make the SSL connection secure
    },
    broker_connection_retry_on_startup=True,  # Ensure retries on startup
)

# Auto-discover tasks in all Django apps
app.autodiscover_tasks()

@app.task(bind=True)
def debug_task(self):
    print('Request: {0!r}'.format(self.request))
