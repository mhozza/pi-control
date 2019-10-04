from celery import shared_task
from wakeonlan import send_magic_packet

from . import pc_status


@shared_task
def wake_pc(mac, ip):
    return send_magic_packet(mac, ip_address=ip)


@shared_task
def make_sleep(url, secret):
    return pc_status.make_sleep(url, secret)
