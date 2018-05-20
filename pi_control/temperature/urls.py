"""temperature URL Configuration"""
from django.urls import path

from temperature import views

urlpatterns = [
    path('now/', views.get_temperature_and_humidity, name='get_temperature_and_humidity'),
]
