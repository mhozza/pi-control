import time

from celery import shared_task

from .measure import measure_temperature_and_humidity
from .models import Entry


@shared_task
def log_temperature():
    def delay_measure(delay):
        time.sleep(delay)
        return measure_temperature_and_humidity()

    temperature_measurements, humidity_measurements = zip(*[delay_measure(i > 0) for i in range(3)])

    temperature = sorted(temperature_measurements)[1]
    humidity = sorted(humidity_measurements)[1]

    Entry.objects.create(temperature=temperature, humidity=humidity)
