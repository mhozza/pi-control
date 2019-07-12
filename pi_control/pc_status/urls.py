"""pc_status URL Configuration"""
from django.urls import path

from pc_status import views

urlpatterns = [
    path("list", views.get_pc_list, name="pc_list"),
    path("status/<str:name>", views.get_pc_status, name="pc_status"),
    path("wakeup/<str:name>", views.wakeup, name="wake_up"),
    path("sleep/<str:name>", views.make_sleep, name="make_sleep"),
]
