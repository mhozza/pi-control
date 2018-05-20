from celery import shared_task
from .models import Entry
from .measure import measure_temperature_and_humidity


@shared_task
def log_temperature():
    temperature_measurements, humidity_measurements = zip(*[measure_temperature_and_humidity() for i in range(3)])

    temperature = sorted(temperature_measurements)[1]
    humidity = sorted(humidity_measurements)[1]

    Entry.objects.create(temperature=temperature, humidity=humidity)
