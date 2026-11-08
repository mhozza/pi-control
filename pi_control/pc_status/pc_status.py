import logging
import socket
import subprocess

import requests

logger = logging.getLogger(__name__)


def check_ping(host):
    try:
        response = subprocess.run(
            ["ping", "-c", "1", "-w", "1", str(host)],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            check=False,
        )
        return response.returncode == 0
    except (subprocess.SubprocessError, OSError):
        return False


def check_connection(host, port):
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(2)
    result = sock.connect_ex((host, port))
    if result == 0:
        return True
    return False


def make_sleep(pc_control_url, pc_control_key):
    sleep_command = "SUSPEND"
    payload = {"key": pc_control_key, "command": sleep_command}
    response = requests.get(pc_control_url, params=payload)
    return response.status_code in (200, 204)
