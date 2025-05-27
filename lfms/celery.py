from __future__ import absolute_import, unicode_literals
import os
from celery import Celery

print("✅ Celery is loading...")
print(f"🔌 CELERY_BROKER_URL: {os.getenv('REDIS_URL')}")
print(f"🧾 CELERY_RESULT_BACKEND: {os.getenv('CELERY_RESULT_BACKEND')}")

# Set the default Django settings module for the 'celery' program.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'lfms.settings')

app = Celery('lfms')

app.config_from_object('django.conf:settings', namespace='CELERY')

USE_CELERY_SSL = os.getenv('USE_CELERY_SSL', 'False').lower() == 'true'

if USE_CELERY_SSL:
    import ssl
    app.conf.update(
        broker_use_ssl={
            'ssl_cert_reqs': ssl.CERT_REQUIRED  # or ssl.CERT_REQUIRED if you have certs
        },
        redis_backend_use_ssl={
            'ssl_cert_reqs': ssl.CERT_REQUIRED
        },
        broker_connection_retry_on_startup=True,
    )


# Auto-discover tasks in all Django apps
app.autodiscover_tasks()

@app.task(bind=True)
def debug_task(self):
    print('Request: {0!r}'.format(self.request))
