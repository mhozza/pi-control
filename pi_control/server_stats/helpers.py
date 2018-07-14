import datetime
import subprocess


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
