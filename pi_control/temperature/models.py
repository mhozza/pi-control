from django.db import models

class Entry(models.Model):
    time = models.DateTimeField(auto_now_add=True, verbose_name='Measurment time.')
    temperature = models.IntegerField(verbose_name='Temperature in Celsius.')
    humidity = models.IntegerField(verbose_name='Humidity in %.')
