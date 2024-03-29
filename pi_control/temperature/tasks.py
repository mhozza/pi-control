import asyncio
import logging
from datetime import datetime, timedelta
from random import randint

from asgiref.sync import async_to_sync, sync_to_async
from channels.db import database_sync_to_async
from celery import shared_task
from django.conf import settings
from django.db.models import Avg, OuterRef, Subquery
from django.utils import timezone

from .measure import measure_temperature_and_humidity
from .models import Entry, MeasurementDevice

logger = logging.getLogger(__name__)
MIN_MEASUREMENT_TIME_DIFFERENCE_MINUTES = 1


async def delay_measure(delay, measurement_device):
    await asyncio.sleep(delay)
    return await sync_to_async(measure_temperature_and_humidity)(measurement_device)


@database_sync_to_async
def get_last_entry_time(device):
    return Entry.objects.filter(device=device).latest("time").time


async def log_temperature_for_device(device):
    try:
        last_entry_time = await get_last_entry_time(device)
        if timezone.now() - last_entry_time < timezone.timedelta(
            minutes=MIN_MEASUREMENT_TIME_DIFFERENCE_MINUTES
        ):
            logger.warning(
                "Skipping measurement. Last measurement is too recent. {} is less than {} minutes ago.".format(
                    last_entry_time, MIN_MEASUREMENT_TIME_DIFFERENCE_MINUTES
                )
            )
            return
    except Entry.DoesNotExist:
        logger.info("First entry.")

    temperature = None
    humidity = None

    try:
        combined_measurements = await asyncio.gather(
            *[delay_measure(i, measurement_device=device) for i in range(3)]
        )
        temperature_measurements, humidity_measurements = zip(*combined_measurements)
        temperature = sorted(temperature_measurements)[1]
        humidity = sorted(humidity_measurements)[1]
    except Exception as e:
        logger.error("Cannot read from temperature sensor! {}".format(e))
        if settings.DEBUG:
            temperature, humidity = randint(15, 30), randint(20, 70)

    if temperature is not None or humidity is not None:
        await database_sync_to_async(Entry.objects.create)(
            temperature=temperature, humidity=humidity, device=device
        )


@database_sync_to_async
def get_devices():
    return list(MeasurementDevice.objects.active())


@async_to_sync
async def log_all_temperatures():
    devices = await get_devices()
    await asyncio.gather(*[log_temperature_for_device(device) for device in devices])


def get_temperature_and_humidity_by_room():
    newest_entries = Entry.objects.filter(
        device=OuterRef("pk"), time__gte=datetime.now() - timedelta(minutes=60)
    ).order_by("-time")
    room_data = (
        MeasurementDevice.objects.filter(active=True)
        .annotate(latest_temperature=Subquery(newest_entries.values("temperature")[:1]))
        .values("room", "room__name", "room__temperature_high", "room__temperature_low")
        .annotate(temperature=Avg("latest_temperature"))
    )
    return room_data


@shared_task
def log_temperature():
    log_all_temperatures()
