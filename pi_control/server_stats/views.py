import logging

from django.conf import settings
from django.utils import timezone
from rest_framework.decorators import api_view
from rest_framework.response import Response

from . import helpers

logger = logging.getLogger(__name__)


@api_view(["GET"])
def get_server_stats(request):
    now = timezone.now()
    uptime = str(timezone.timedelta(seconds=helpers.get_uptime()))
    try:
        backup_time = timezone.datetime.fromtimestamp(helpers.get_last_backup_time())
    except (AssertionError, FileNotFoundError) as e:
        logger.error(e)
        backup_time = None
    try:
        cpu_temp = helpers.get_cpu_temperature()
    except AssertionError as e:
        logger.error(e)
        cpu_temp = None

    return Response(
        dict(
            name=settings.SERVER_NAME,
            uptime=uptime,
            backuptime=backup_time,
            time=now,
            cpu=helpers.get_cpu(),
            memory=helpers.get_memory(),
            swap=helpers.get_swap(),
            cpu_temp=cpu_temp,
        )
    )
