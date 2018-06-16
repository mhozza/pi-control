import os

import socket


def check_ping(host):
    response = os.system("ping -c 1 -w 1 {} > /dev/null".format(host))
    if response == 0:
        return True
    return False


def check_connection(host, port):
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(2) 
    result = sock.connect_ex((host, port))
    if result == 0:
        return True
    return False
