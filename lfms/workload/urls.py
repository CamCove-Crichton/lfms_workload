from django.urls import path
from . import views

urlpatterns = [
    path('', views.workload, name='workload'),
]
