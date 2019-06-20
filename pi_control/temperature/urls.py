"""temperature URL Configuration"""
from django.urls import path

from temperature import views

urlpatterns = [
    path("now/", views.get_temperature_and_humidity, name="get_temperature_and_humidity"),
    path(
        "room/<int:room_id>/now/",
        views.get_room_temperature_and_humidity,
        name="get_room_temperature_and_humidity",
    ),
    path("devices/", views.MeasurementDeviceListView.as_view(), name="get_devices"),
    path("rooms/", views.RoomListView.as_view(), name="get_rooms"),
    path("list/", views.TemperatureListView.as_view(), name="get_temperature_and_humidity_list"),
    path(
        "list/<str:from>/",
        views.TemperatureListView.as_view(),
        name="get_temperature_and_humidity_list",
    ),
    path(
        "list/<str:from>/<str:to>/",
        views.TemperatureListView.as_view(),
        name="get_temperature_and_humidity_list",
    ),
]
