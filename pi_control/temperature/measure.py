#!/usr/bin/python
import json
import socket

import board
import busio
from adafruit_am2320 import AM2320


class NetworkTemperatureSensor:
    BUFFER_SIZE = 256

    def __init__(self, ip, port):
        self.ip = ip
        self.port = port

    def read_sensor(self):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sck:
            sck.connect((self.ip, self.port))
            sck.settimeout(10)
            sck.send(b"{}")  # TODO: Define protocol.
            payload = sck.recv(self.BUFFER_SIZE)

        data = json.loads(payload.decode(encoding="utf-8"))
        return data["temperature"] / 10.0, data["humidity"] / 10.0


i2c = busio.I2C(board.SCL, board.SDA)
am2320 = AM2320(i2c)


def measure_temperature_and_humidity(device):
    if device:
        if device.ip_address and device.port:
            device = NetworkTemperatureSensor(device.ip_address, device.port)
            return device.read_sensor()
    return am2320.temperature(), am2320.relative_humidity()
