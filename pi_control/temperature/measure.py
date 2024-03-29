#!/usr/bin/python
import json
import os
import socket
import time
from fcntl import ioctl
import requests


class AM2320:
    I2C_ADDR = 0x5C
    I2C_SLAVE = 0x0703

    def __init__(self, i2cbus=1):
        self._i2cbus = i2cbus

    @staticmethod
    def _calc_crc16(data):
        crc = 0xFFFF
        for x in data:
            crc = crc ^ x
            for bit in range(0, 8):
                if (crc & 0x0001) == 0x0001:
                    crc >>= 1
                    crc ^= 0xA001
                else:
                    crc >>= 1
        return crc

    @staticmethod
    def _combine_bytes(msb, lsb):
        return msb << 8 | lsb

    def read_sensor(self):
        fd = None
        try:
            fd = os.open("/dev/i2c-%d" % self._i2cbus, os.O_RDWR)

            ioctl(fd, self.I2C_SLAVE, self.I2C_ADDR)

            # Wake AM2320 up, goes to sleep to not warm up and affect
            # the humidity sensor.
            # This write will fail as AM2320 won't ACK this write
            try:
                os.write(fd, b"\0x00")
            except Exception:
                pass
            time.sleep(0.001)  # Wait at least 0.8ms, at most 3ms

            # write at addr 0x03, start reg = 0x00, num regs = 0x04 */
            os.write(fd, b"\x03\x00\x04")
            time.sleep(0.0016)  # Wait at least 1.5ms for result

            # Read out 8 bytes of result data
            # Byte 0: Should be Modbus function code 0x03
            # Byte 1: Should be number of registers to read (0x04)
            # Byte 2: Humidity msb
            # Byte 3: Humidity lsb
            # Byte 4: Temperature msb
            # Byte 5: Temperature lsb
            # Byte 6: CRC lsb byte
            # Byte 7: CRC msb byte
            data = bytearray(os.read(fd, 8))
        finally:
            if fd is not None:
                os.close(fd)

        # Check data[0] and data[1]
        if data[0] != 0x03 or data[1] != 0x04:
            raise Exception("First two read bytes are a mismatch")

        # CRC check
        if self._calc_crc16(data[0:6]) != self._combine_bytes(data[7], data[6]):
            raise Exception("CRC failed")

        # Temperature resolution is 16Bit,
        # temperature highest bit (Bit15) is equal to 1 indicates a
        # negative temperature, the temperature highest bit (Bit15)
        # is equal to 0 indicates a positive temperature;
        # temperature in addition to the most significant bit (Bit14 ~ Bit0)
        # indicates the temperature sensor string value.
        # Temperature sensor value is a string of 10 times the
        # actual temperature value.
        temp = self._combine_bytes(data[4], data[5])
        if temp & 0x8000:
            temp = -(temp & 0x7FFF)
        temp /= 10.0

        humi = self._combine_bytes(data[2], data[3]) / 10.0

        return (temp, humi)


class NetworkTemperatureSensorV0:
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


class NetworkTemperatureSensorV1:
    def __init__(self, ip, port):
        self.url = f"http://{ip}:{port}/temperature"

    def read_sensor(self):
        response = requests.get(self.url)
        data = response.json()
        return data["temperature"], data["humidity"]


am2320 = AM2320(i2cbus=1)


def measure_temperature_and_humidity(device):
    if device:
        if device.ip_address and device.port:
            if device.api == 0:
                device = NetworkTemperatureSensorV0(device.ip_address, device.port)
            elif device.api == 1:
                device = NetworkTemperatureSensorV1(device.ip_address, device.port)
            else:
                raise NotImplementedError(
                    f"Invalid API version for device {device.name} " f"(API v{device.api})."
                )
            return device.read_sensor()
    return am2320.read_sensor()
