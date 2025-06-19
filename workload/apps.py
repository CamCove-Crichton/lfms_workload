from django.apps import AppConfig
import logging
import json


class WorkloadConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "workload"

    def ready(self):
        from celery.signals import task_success
        from django_celery_results.models import TaskResult
        from django_celery_beat.models import PeriodicTask, IntervalSchedule
        from celery import current_app  # Safe access to Celery app instance

        logger = logging.getLogger(__name__)

        @task_success.connect
        def task_succeeded_handler(sender=None, result=None, **kwargs):
            logger.warning(f"[Celery Signal] Task {sender.request.id} succeeded with result: {result}")
        

        schedule, _ = IntervalSchedule.objects.get_or_create(
            every=1,
            period=IntervalSchedule.HOURS,
        )

        task, created = PeriodicTask.objects.get_or_create(
            name='Fetch workshop workload hourly',
            defaults={
                'interval': schedule,
                'task': 'fetch_workshop_workload_task',
                'args': json.dumps([91]),
            }
        )

        if not created:
            task.interval = schedule
            task.args = json.dumps([91])
            task.save()
