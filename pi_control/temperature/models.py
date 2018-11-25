from django.db import models


class MeasurementDevice(models.Model):
    id = models.CharField(primary_key=True, max_length=100, verbose_name='device ID')
    name = models.CharField(max_length=100, verbose_name='device name')


class Entry(models.Model):
    time = models.DateTimeField(auto_now_add=True, verbose_name='measurement time.')
    temperature = models.FloatField(verbose_name='temperature in Celsius.')
    humidity = models.FloatField(verbose_name='humidity in %.')
    device_id = models.ForeignKey(MeasurementDevice, on_delete=models.CASCADE)

    class Meta:
        verbose_name = 'temperature entry'
        verbose_name_plural = 'temperature entries'

    def __str__(self):
        return '{}: {}°C, {}%'.format(self.time, self.temperature, self.humidity)


class Room(models.Model):
    name = models.CharField(max_length=100, verbose_name='room name')
    devices = models.ManyToManyField(MeasurementDevice)
