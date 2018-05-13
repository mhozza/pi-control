from django.db import models


class Entry(models.Model):
    time = models.DateTimeField(auto_now_add=True, verbose_name='Measurment time.')
    temperature = models.FloatField(verbose_name='Temperature in Celsius.')
    humidity = models.FloatField(verbose_name='Humidity in %.')

    class Meta:
        verbose_name = 'temperature entry'
        verbose_name_plural = 'temperature entries'

    def __str__(self):
        return '{}: {}°C, {}%'.format(self.time, self.temperature, self.humidity)
