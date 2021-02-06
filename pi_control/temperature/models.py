from django.db import models
from django.db.models import Count, Q

from temperature import constants


class RoomManager(models.Manager):
    def non_empty(self):
        return (
            self.get_queryset()
            .annotate(device_count=Count("devices", filter=Q(devices__active=True)))
            .filter(device_count__gt=0)
        )


class Room(models.Model):
    name = models.CharField(max_length=100, verbose_name="room name")
    temperature_low = models.FloatField(
        verbose_name="lowest comfortable temperature", default=constants.DEFAULT_TEMPERATURE_LOW
    )
    temperature_high = models.FloatField(
        verbose_name="highest comfortable temperature", default=constants.DEFAULT_TEMPERATURE_HIGH
    )
    humidity_low = models.FloatField(
        verbose_name="lowest comfortable humidity", default=constants.DEFAULT_HUMIDITY_LOW
    )
    humidity_high = models.FloatField(
        verbose_name="highest comfortable humidity", default=constants.DEFAULT_HUMIDITY_HIGH
    )

    objects = RoomManager()

    def __str__(self):
        return self.name


class DeviceManager(models.Manager):
    def active(self):
        return self.get_queryset().filter(active=True)


class MeasurementDevice(models.Model):
    id = models.CharField(primary_key=True, max_length=100, verbose_name="device ID")
    name = models.CharField(max_length=100, verbose_name="device name")
    ip_address = models.GenericIPAddressField(
        protocol="IPv4", blank=True, null=True, verbose_name="device IP address"
    )
    port = models.IntegerField(default=80, blank=True, null=True, verbose_name="device port")
    room = models.ForeignKey(Room, on_delete=models.CASCADE, null=True, related_name="devices")
    active = models.BooleanField(default=True)
    api = models.IntegerField(default=0, verbose_name="Device API version.")

    objects = DeviceManager()

    def __str__(self):
        return self.name


class Entry(models.Model):
    time = models.DateTimeField(auto_now_add=True, verbose_name="measurement time", db_index=True)
    temperature = models.FloatField(verbose_name="temperature in °C")
    humidity = models.FloatField(verbose_name="humidity in %")
    device = models.ForeignKey(MeasurementDevice, on_delete=models.CASCADE, db_index=True)

    class Meta:
        verbose_name = "temperature entry"
        verbose_name_plural = "temperature entries"

    def __str__(self):
        return "{}: {}°C, {}%".format(self.time, self.temperature, self.humidity)
