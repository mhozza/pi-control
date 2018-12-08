from django.contrib import admin

from .models import Entry, MeasurementDevice, Room


@admin.register(Entry)
class EntryAdmin(admin.ModelAdmin):
    list_display = ('time', 'device', 'temperature', 'humidity')
    list_filter = ('device',)


@admin.register(MeasurementDevice)
class MeasurementDeviceAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'room', 'active', 'ip_address', 'port')


@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ('name', 'ideal_temperature', 'ideal_humidity')

    def ideal_temperature(self, obj):
        return '{}–{}°C'.format(obj.temperature_low, obj.temperature_high)

    def ideal_humidity(self, obj):
        return '{}–{}%'.format(obj.humidity_low, obj.humidity_high)
