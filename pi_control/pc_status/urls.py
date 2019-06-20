"""pc_status URL Configuration"""
from django.urls import path

from pc_status import views

urlpatterns = [
    path("", views.get_pc_status, name="pc_status"),
    path("wakeup/", views.wakeup, name="wake_up"),
    path("sleep/", views.make_sleep, name="make_sleep"),
]
