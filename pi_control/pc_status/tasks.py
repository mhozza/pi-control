from celery import shared_task

from .pc_status import wakeup


@shared_task
def wake_pc(mac):
    return wakeup(mac)
