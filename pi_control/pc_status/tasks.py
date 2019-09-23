from celery import shared_task
from wakeonlan import send_magic_packet

from .pc_status import make_sleep


@shared_task
def wake_pc(mac, ip):
    return send_magic_packet(mac, ip=ip)


@shared_task
def make_sleep(url, secret):
    return make_sleep(url, secret)
