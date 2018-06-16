from django.utils import timezone
from rest_framework.authentication import SessionAuthentication, TokenAuthentication
from rest_framework.decorators import api_view, authentication_classes
from rest_framework.response import Response

from .pc_status import check_connection, check_ping
from .tasks import wake_pc as wake_pc_task

PC_IP = '192.168.0.47'
PC_NAME = 'mamut'
PC_MAC = '10:7B:44:15:E4:DA'


@api_view(['GET'])
def get_pc_status(request):
    now = timezone.now()
    online = check_ping(PC_IP)
    ssh_status = False
    if online:
        ssh_status = check_connection(PC_IP, 22)
    return Response({
        'name': PC_NAME,
        'online': online,
        'ssh': ssh_status,
        'time': now,
    })


@api_view(['POST'])
@authentication_classes((SessionAuthentication, TokenAuthentication))
def wake_pc(request):
    wake_pc_task.delay(PC_MAC)
    return Response()
