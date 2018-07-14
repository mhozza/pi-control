import datetime
import os
import subprocess

BACKUP_FILENAME = os.environ.get('BACKUP_FILENAME')


def get_uptime():
    raw = subprocess.check_output('uptime').decode('utf-8').replace(',', '').strip()
    raw_tokens = raw.split()
    if 'days' in raw:
        days = int(raw_tokens[2])
        offset = 2
    else:
        days = 0
        offset = 0
    if 'min' in raw:
        hours = 0
        minutes = int(raw_tokens[2 + offset])
    else:
        hours, minutes = map(int, raw_tokens[2 + offset].split(':'))
    return datetime.timedelta(days=days, hours=hours, minutes=minutes)


def get_last_backup_time():
    if not BACKUP_FILENAME:
        raise OSError('No filename set')
    return os.path.getmtime(BACKUP_FILENAME)
