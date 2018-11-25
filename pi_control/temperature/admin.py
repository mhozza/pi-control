from django.contrib import admin

from .models import Entry, MeasurementDevice, Room


@admin.register(Entry)
class EntryAdmin(admin.ModelAdmin):
    pass


@admin.register(MeasurementDevice)
class MeasurementDeviceAdmin(admin.ModelAdmin):
    pass


@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    pass
