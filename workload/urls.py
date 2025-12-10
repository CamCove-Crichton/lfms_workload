from django.urls import path
from . import views

urlpatterns = [
    path('', views.workload, name='workload'),
    path('api/workload/', views.api_workload, name='api_workload'),
    
    # Workshop Workload Views
    path('workshop_workload/', views.workshop_workload, name='workshop_workload'),
    path('get_workshop_workload_data/', views.get_workshop_workload_data, name='get_workshop_workload_data'),
    path('opportunities/<int:current_id>/custom_input/', views.custom_input, name="custom_input"),

    # Celery Task Endpoints
    # path('api/start_workshop_workload_task/', views.start_workshop_workload_task, name='start_workload_task'),  # Potentially won't be using this url anymore
    # path('api/check_task_status/<str:task_id>/', views.check_task_status, name='check_task_status'),  # Potentially won't be using this url anymore
]
