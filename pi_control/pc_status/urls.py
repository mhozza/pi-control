"""pc_status URL Configuration"""
from django.urls import path

from pc_status import views

urlpatterns = [
    path('', views.get_pc_status, name='pc_status'),
    path('wakeup/', views.wake_pc, name='wake_up'),
]
