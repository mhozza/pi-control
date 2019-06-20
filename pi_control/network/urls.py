"""temperature URL Configuration"""
from django.urls import path

from . import views

urlpatterns = [
    path("list/", views.NetworkStatusListView.as_view(), name="get_network_status_list"),
    path("list/<str:from>/", views.NetworkStatusListView.as_view(), name="get_network_status_list"),
    path(
        "list/<str:from>/<str:to>/",
        views.NetworkStatusListView.as_view(),
        name="get_network_status_list",
    ),
]
