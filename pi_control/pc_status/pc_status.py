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


def make_sleep(pc_control_url, pc_control_key, timeout=5):
    sleep_command = "SUSPEND"
    payload = {"key": pc_control_key, "command": sleep_command}
    headers = {"Authorization": f"Bearer {pc_control_key}"}
    try:
        response = requests.post(pc_control_url, json=payload, headers=headers, timeout=timeout)
        if response.status_code in (200, 204):
            return True
        if response.status_code == 405:
            logger.warning("Target %s rejected POST (405 Method Not Allowed); falling back to GET.", pc_control_url)
            response = requests.get(pc_control_url, params=payload, timeout=timeout)
            return response.status_code in (200, 204)
        return False
    except requests.RequestException as e:
        logger.error("Failed to send sleep command to %s: %s", pc_control_url, e)
        return False
