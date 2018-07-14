from django.utils import timezone
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .helpers import get_uptime

SERVER_NAME = 'malina'


@api_view(['GET'])
def get_server_stats(request):
    now = timezone.now()
    uptime = str(get_uptime())

    return Response(dict(
        name=SERVER_NAME,
        uptime=uptime,
        time=now,
    ))
