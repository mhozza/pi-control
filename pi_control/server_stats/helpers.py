import os
import subprocess
import time

import psutil

BACKUP_FILENAME = os.environ.get("BACKUP_FILENAME")
CPU_TEMPERATURE_FILE = os.environ.get("CPU_TEMPERATURE_FILE")


def get_uptime():
    return time.time() - psutil.boot_time()


def get_cpu():
    return psutil.cpu_percent()


def get_memory():
    return psutil.virtual_memory().percent


def get_swap():
    return psutil.swap_memory().percent


def get_last_backup_time():
    if not BACKUP_FILENAME:
        raise AssertionError("No backup filename set.")
    return os.path.getmtime(BACKUP_FILENAME)


def get_update_counts():
    try:
        cmd = subprocess.Popen(
            ["/usr/lib/update-notifier/apt-check"], stdout=subprocess.PIPE, stderr=subprocess.STDOUT
        )
        out = cmd.stdout.read().decode()
    except FileNotFoundError:
        out = "0;0\n"
    total, security = out.strip().split(";")
    return int(total), int(security)


def is_service_active(service):
    """Return True if service is running."""
    cmd = subprocess.Popen(
        ["/bin/systemctl", "show", "%s.service" % service, "--no-page"],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
    )
    stdout = cmd.stdout.read().decode()
    for line in stdout.split("\n"):
        if line == "ActiveState=active":
            return True
    return False


def get_cpu_temperature():
    if not CPU_TEMPERATURE_FILE:
        raise AssertionError("No cpu temperature filename set.")
    with open(CPU_TEMPERATURE_FILE) as f:
        raw_temp = f.readline(100)
        return int(raw_temp) / 1000
