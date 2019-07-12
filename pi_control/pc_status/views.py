from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.authentication import SessionAuthentication, TokenAuthentication
from rest_framework.decorators import api_view, authentication_classes
from rest_framework.response import Response

from pc_status.models import Pc
from pi_control.authentication import QueryStringBasedTokenAuthentication
from . import pc_status
from .tasks import wake_pc as wake_pc_task


@api_view(["GET"])
def get_pc_list(request):
    return Response(map(lambda x: x["id"], Pc.objects.values("id")))


@api_view(["GET"])
def get_pc_status(request, name):
    pc_config = get_object_or_404(Pc, id=name)
    now = timezone.now()
    online = pc_status.check_ping(pc_config.ip_address)
    ssh_status = False
    if online:
        ssh_status = pc_status.check_connection(pc_config.ip_address, pc_config.ssh_port)
    return Response({"name": name, "online": online, "ssh": ssh_status, "time": now})


@api_view(["POST"])
@authentication_classes(
    (SessionAuthentication, TokenAuthentication, QueryStringBasedTokenAuthentication)
)
def wakeup(request, name):
    pc_config = get_object_or_404(Pc, id=name)
    wake_pc_task.delay(pc_config.mac_address)
    return Response()


@api_view(["POST"])
@authentication_classes(
    (SessionAuthentication, TokenAuthentication, QueryStringBasedTokenAuthentication)
)
def make_sleep(request, name):
    pc_config = get_object_or_404(Pc, id=name)
    success = pc_status.make_sleep(
        "http://{}:{}".format(pc_config.ip_address, pc_config.control_port), pc_config.secret
    )
    return Response(success)
