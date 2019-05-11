import asyncio
import logging
from random import randint

from asgiref.sync import async_to_sync, sync_to_async
from celery import shared_task
from django.conf import settings
from django.utils import timezone

from .measure import measure_temperature_and_humidity
from .models import Entry, MeasurementDevice

logger = logging.getLogger(__name__)
MIN_MEASUREMENT_TIME_DIFFERENCE_MINUTES = 1


async def delay_measure(delay, measurement_device):
    await asyncio.sleep(delay)
    return await sync_to_async(measure_temperature_and_humidity)(measurement_device)


async def log_temperature_for_device(device):
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
        combined_measurements = await asyncio.gather(
            *[delay_measure(i, measurement_device=device) for i in range(3)])
        temperature_measurements, humidity_measurements = zip(*combined_measurements)
        temperature = sorted(temperature_measurements)[1]
        humidity = sorted(humidity_measurements)[1]
    except Exception as e:
        logger.error('Cannot read from temperature sensor! {}'.format(e))
        if not settings.DEBUG:
            raise e
        temperature, humidity = randint(15, 30), randint(20, 70)

    Entry.objects.create(temperature=temperature, humidity=humidity, device=device)


@async_to_sync
async def log_all_temperatures():
    devices = MeasurementDevice.objects.active()
    await asyncio.gather(
        *[log_temperature_for_device(device) for device in devices])


@shared_task
def log_temperature():
    log_all_temperatures()
