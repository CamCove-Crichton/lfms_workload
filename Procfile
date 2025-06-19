web: gunicorn lfms.wsgi:application --timeout 60
worker: celery -A lfms worker --loglevel=info
beat: celery -A lfms beat --loglevel=info