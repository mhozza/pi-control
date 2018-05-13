from celery import shared_task
from .models import Entry
from .measure import measure_temperature_and_humidity


@shared_task
def log_temperature():
    temperature, humidity = measure_temperature_and_humidity()
    Entry.objects.create(temperature=temperature, humidity=humidity)
