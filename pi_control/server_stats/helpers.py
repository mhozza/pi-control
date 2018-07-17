import time

import os
import psutil

BACKUP_FILENAME = os.environ.get('BACKUP_FILENAME')


def get_uptime():
    return time.time() - psutil.boot_time()


def get_last_backup_time():
    if not BACKUP_FILENAME:
        raise OSError('No filename set')
    return os.path.getmtime(BACKUP_FILENAME)
