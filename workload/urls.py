from django.urls import path
from . import views

urlpatterns = [
    path('', views.workload, name='workload'),
    path('api/workload/', views.api_workload, name='api_workload'),
    
    # Workshop Workload Views
    path('workshop_workload/', views.workshop_workload, name='workshop_workload'),
    path('api/workshop_workload/', views.api_workshop_workload, name='api_workshop_workload'),

    # Celery Task Endpoints
    path('api/start_workshop_workload_task/', views.start_workshop_workload_task, name='start_workload_task'),
    path('api/check_task_status/<str:task_id>/', views.check_task_status, name='check_task_status'),
]
