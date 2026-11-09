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


def check_connection(host, port, timeout=2):
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        sock.settimeout(timeout)
        result = sock.connect_ex((host, port))
        return result == 0
    finally:
        sock.close()


def make_sleep(pc_control_url, pc_control_key, timeout=5):
    sleep_command = "SUSPEND"
    payload = {"key": pc_control_key, "command": sleep_command}
    try:
        response = requests.get(pc_control_url, params=payload, timeout=timeout)
        return response.status_code in (200, 204)
    except requests.RequestException as e:
        logger.error("Failed to send sleep command to %s: %s", pc_control_url, e)
        return False
