from django.apps import AppConfig
from django.db.models.signals import post_migrate
import logging
import json


class WorkloadConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "workload"

    def ready(self):
        from celery.signals import task_success
        from django_celery_results.models import TaskResult
        from celery import current_app  # Safe access to Celery app instance
        from django.dispatch import receiver
        from django_celery_beat.models import PeriodicTask, IntervalSchedule

        logger = logging.getLogger(__name__)

        @task_success.connect
        def task_succeeded_handler(sender=None, result=None, **kwargs):
            logger.warning(f"[Celery Signal] Task {sender.request.id} succeeded with result: {result}")
        

        @receiver(post_migrate)
        def create_periodic_task(sender, **kwargs):
            if sender.name != "workload":
                return
            
            schedule, _ = IntervalSchedule.objects.update_or_create(
                every=1,
                period=IntervalSchedule.HOURS,
            )

            task, created = PeriodicTask.objects.update_or_create(
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
