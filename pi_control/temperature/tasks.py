import logging
import time

from celery import shared_task
from django.utils import timezone

from .measure import measure_temperature_and_humidity
from .models import Entry

logger = logging.getLogger(__name__)
MIN_MEASUREMENT_TIME_DIFFERENCE_MINUTES = 5


@shared_task
def log_temperature():
    def delay_measure(delay):
        time.sleep(delay)
        return measure_temperature_and_humidity()

    last_entry_time = Entry.objects.latest('time').time
    if timezone.now() - last_entry_time  < timezone.timedelta(minutes=MIN_MEASUREMENT_TIME_DIFFERENCE_MINUTES):
        logger.warning('Skipping measurement. Last measurement is too recent. {} is less than {} minutes ago.'.format(
            last_entry_time, MIN_MEASUREMENT_TIME_DIFFERENCE_MINUTES))
        return

    temperature_measurements, humidity_measurements = zip(*[delay_measure(i > 0) for i in range(3)])

    temperature = sorted(temperature_measurements)[1]
    humidity = sorted(humidity_measurements)[1]

    Entry.objects.create(temperature=temperature, humidity=humidity)
