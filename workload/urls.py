from django.urls import path
from . import views

urlpatterns = [
    path('', views.workload, name='workload'),
    path('api/workload/', views.api_workload, name='api_workload'),
    path(
        'workshop_workload/',
        views.workshop_workload,
        name='workshop_workload'),
    path(
        'api/workshop_workload/',
        views.api_workshop_workload,
        name='api_workshop_workload'),
]
