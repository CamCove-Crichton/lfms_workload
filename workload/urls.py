from django.urls import path
from . import views

urlpatterns = [
    path('', views.workload, name='workload'),
    path('api/workload/', views.api_workload, name='api_workload'),
    path(
        'workshop_workload/',
        views.workshop_workload,
        name='workshop_workload'),
]
