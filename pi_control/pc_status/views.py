from django.utils import timezone
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .pc_status import check_connection, check_ping

PC_IP = '192.168.0.47'
PC_NAME = 'mamut'


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
