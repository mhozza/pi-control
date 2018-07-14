"""server_stats URL Configuration"""
from django.urls import path

from server_stats import views

urlpatterns = [
    path('', views.get_server_stats, name='server_stats'),
]
