web: gunicorn --timeout 90 lfms.wsgi:application
worker: celery -A lfms worker --loglevel=info