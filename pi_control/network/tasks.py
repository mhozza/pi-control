import logging

from asgiref.sync import async_to_sync
from celery import shared_task
from django.utils import timezone

from .measure import measure_ping
from .models import Entry

logger = logging.getLogger(__name__)
MIN_MEASUREMENT_TIME_DIFFERENCE_MINUTES = 1


@shared_task
def log_ping():
    try:
        last_entry_time = Entry.objects.latest("time").time
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

    ping_time = async_to_sync(measure_ping)()
    Entry.objects.create(ping=ping_time)
