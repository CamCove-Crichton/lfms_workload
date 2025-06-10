from django.contrib import admin
from django_celery_results.models import TaskResult

admin.site.register(TaskResult)
