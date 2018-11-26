import time

import logging
from celery import shared_task
from django.conf import settings
from django.utils import timezone
from random import randint

from .measure import measure_temperature_and_humidity
from .models import Entry, MeasurementDevice

logger = logging.getLogger(__name__)
MIN_MEASUREMENT_TIME_DIFFERENCE_MINUTES = 1
DEVICE_ID = 'raspberry_pi'


@shared_task
def log_temperature():
    def delay_measure(delay, measurement_device):
        time.sleep(delay)
        return measure_temperature_and_humidity(measurement_device)

    for device in MeasurementDevice.objects.all():
        try:
            last_entry_time = Entry.objects.filter(device=device).latest('time').time
            if timezone.now() - last_entry_time < timezone.timedelta(minutes=MIN_MEASUREMENT_TIME_DIFFERENCE_MINUTES):
                logger.warning(
                    'Skipping measurement. Last measurement is too recent. {} is less than {} minutes ago.'.format(
                        last_entry_time, MIN_MEASUREMENT_TIME_DIFFERENCE_MINUTES))
                return
        except Entry.DoesNotExist:
            logger.info('First entry.')

        try:
            temperature_measurements, humidity_measurements = zip(
                *[delay_measure(i > 0, measurement_device=device) for i in range(3)])
            temperature = sorted(temperature_measurements)[1]
            humidity = sorted(humidity_measurements)[1]
        except Exception as e:
            logger.error('Cannot read from temperature sensor! {}'.format(e))
            if not settings.DEBUG:
                raise e
            temperature, humidity = randint(15, 30), randint(20, 70)

        Entry.objects.create(temperature=temperature, humidity=humidity, device=device)
