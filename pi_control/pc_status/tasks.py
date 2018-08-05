from celery import shared_task

from .pc_status import wakeup, make_sleep


@shared_task
def wake_pc(mac):
    return wakeup(mac)


@shared_task
def make_sleep(url, secret):
    return make_sleep(url, secret)
