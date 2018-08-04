from django.conf import settings
from django.utils import timezone
from rest_framework.authentication import SessionAuthentication, TokenAuthentication
from rest_framework.decorators import api_view, authentication_classes
from rest_framework.response import Response

from pi_control.authentication import QueryStringBasedTokenAuthentication
from . import pc_status
from .tasks import wake_pc as wake_pc_task


@api_view(['GET'])
def get_pc_status(request):
    now = timezone.now()
    online = pc_status.check_ping(settings.PC_IP)
    ssh_status = False
    if online:
        ssh_status = pc_status.check_connection(settings.PC_IP, settings.PC_SSH_PORT)
    return Response({
        'name': settings.PC_NAME,
        'online': online,
        'ssh': ssh_status,
        'time': now,
    })


@api_view(['POST'])
@authentication_classes((SessionAuthentication, TokenAuthentication, QueryStringBasedTokenAuthentication))
def wakeup(request):
    wake_pc_task.delay(settings.PC_MAC)
    return Response()


@api_view(['POST'])
@authentication_classes((SessionAuthentication, TokenAuthentication, QueryStringBasedTokenAuthentication))
def make_sleep(request):
    success = pc_status.make_sleep(settings.PC_CONTROL_URL, settings.PC_CONTROL_SECRET)
    return Response(success)
