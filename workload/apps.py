from django.apps import AppConfig
import logging


class WorkloadConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "workload"

    def ready(self):
        from celery.signals import task_success
        from django_celery_results.models import TaskResult

        logger = logging.getLogger(__name__)

        @task_success.connect
        def task_succeeded_handler(sender=None, result=None, **kwargs):
            logger.warning(f"[Celery Signal] Task {sender.request.id} succeeded with result: {result}")
