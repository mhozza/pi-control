from django.utils import timezone
from rest_framework.decorators import api_view
from rest_framework.response import Response

from . import helpers

with open('/etc/hostname') as f:
    SERVER_NAME = f.read().strip()


@api_view(['GET'])
def get_server_stats(request):
    now = timezone.now()
    uptime = str(helpers.get_uptime())
    try:
        backuptime = timezone.datetime.fromtimestamp(helpers.get_last_backup_time())
    except OSError:
        backuptime = None

    return Response(dict(
        name=SERVER_NAME,
        uptime=uptime,
        backuptime=backuptime,
        time=now,
    ))
