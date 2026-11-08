import json
from unittest.mock import MagicMock, patch

from django.test import SimpleTestCase

from temperature.measure import (
    AM2320,
    NetworkTemperatureSensorV0,
    NetworkTemperatureSensorV1,
    measure_temperature_and_humidity,
)


class DeviceStub:
    def __init__(self, name="stub-device", ip_address=None, port=None, api=0):
        self.name = name
        self.ip_address = ip_address
        self.port = port
        self.api = api


class TemperatureMeasureTestCase(SimpleTestCase):
    def test_am2320_combine_bytes(self):
        self.assertEqual(AM2320._combine_bytes(0x12, 0x34), 0x1234)
        self.assertEqual(AM2320._combine_bytes(0x00, 0x00), 0)

    def test_am2320_calc_crc16(self):
        data = bytes([0x03, 0x04, 0x01, 0xF4, 0x00, 0xFA])
        crc = AM2320._calc_crc16(data)
        self.assertEqual(crc, 0xA531)

    @patch("time.sleep")
    @patch("os.close")
    @patch("os.read")
    @patch("os.write")
    @patch("temperature.measure.ioctl")
    @patch("os.open")
    def test_am2320_read_sensor_positive_temp(
        self, mock_open, mock_ioctl, mock_write, mock_read, mock_close, mock_sleep
    ):
        mock_open.return_value = 42
        # Data: hum=500 (50.0%), temp=250 (25.0°C), crc_lsb=0x31, crc_msb=0xA5
        mock_read.return_value = bytes([0x03, 0x04, 0x01, 0xF4, 0x00, 0xFA, 0x31, 0xA5])

        sensor = AM2320(i2cbus=1)
        temp, humi = sensor.read_sensor()

        self.assertEqual(temp, 25.0)
        self.assertEqual(humi, 50.0)
        mock_open.assert_called_once_with("/dev/i2c-1", 2)  # os.O_RDWR == 2
        mock_close.assert_called_once_with(42)

    @patch("time.sleep")
    @patch("os.close")
    @patch("os.read")
    @patch("os.write")
    @patch("temperature.measure.ioctl")
    @patch("os.open")
    def test_am2320_read_sensor_negative_temp(
        self, mock_open, mock_ioctl, mock_write, mock_read, mock_close, mock_sleep
    ):
        mock_open.return_value = 42
        # Data: hum=450 (45.0%), temp=-50 (-5.0°C), crc_lsb=0xB1, crc_msb=0xFD
        mock_read.return_value = bytes([0x03, 0x04, 0x01, 0xC2, 0x80, 0x32, 0xB1, 0xFD])

        sensor = AM2320(i2cbus=1)
        temp, humi = sensor.read_sensor()

        self.assertEqual(temp, -5.0)
        self.assertEqual(humi, 45.0)

    @patch("time.sleep")
    @patch("os.close")
    @patch("os.read")
    @patch("os.write")
    @patch("temperature.measure.ioctl")
    @patch("os.open")
    def test_am2320_read_sensor_header_mismatch(
        self, mock_open, mock_ioctl, mock_write, mock_read, mock_close, mock_sleep
    ):
        mock_open.return_value = 42
        mock_read.return_value = bytes([0x00, 0x00, 0x01, 0xF4, 0x00, 0xFA, 0x31, 0xA5])

        sensor = AM2320(i2cbus=1)
        with self.assertRaises(Exception) as ctx:
            sensor.read_sensor()
        self.assertIn("mismatch", str(ctx.exception))

    @patch("time.sleep")
    @patch("os.close")
    @patch("os.read")
    @patch("os.write")
    @patch("temperature.measure.ioctl")
    @patch("os.open")
    def test_am2320_read_sensor_crc_failure(
        self, mock_open, mock_ioctl, mock_write, mock_read, mock_close, mock_sleep
    ):
        mock_open.return_value = 42
        mock_read.return_value = bytes([0x03, 0x04, 0x01, 0xF4, 0x00, 0xFA, 0x00, 0x00])

        sensor = AM2320(i2cbus=1)
        with self.assertRaises(Exception) as ctx:
            sensor.read_sensor()
        self.assertIn("CRC failed", str(ctx.exception))

    @patch("socket.socket")
    def test_network_sensor_v0_read_sensor(self, mock_socket_cls):
        mock_sock = MagicMock()
        mock_sock.recv.return_value = json.dumps({"temperature": 215, "humidity": 480}).encode("utf-8")
        mock_socket_cls.return_value.__enter__.return_value = mock_sock

        sensor = NetworkTemperatureSensorV0("192.168.1.150", 8080)
        temp, humi = sensor.read_sensor()

        self.assertEqual(temp, 21.5)
        self.assertEqual(humi, 48.0)
        mock_sock.settimeout.assert_called_once_with(10)
        mock_sock.connect.assert_called_once_with(("192.168.1.150", 8080))
        mock_sock.send.assert_called_once_with(b"{}")
        # Verify settimeout was called before connect
        settimeout_idx = [c[0] for c in mock_sock.method_calls].index("settimeout")
        connect_idx = [c[0] for c in mock_sock.method_calls].index("connect")
        self.assertLess(settimeout_idx, connect_idx)

    @patch("socket.socket")
    def test_network_sensor_v0_custom_timeout(self, mock_socket_cls):
        mock_sock = MagicMock()
        mock_sock.recv.return_value = json.dumps({"temperature": 200, "humidity": 500}).encode("utf-8")
        mock_socket_cls.return_value.__enter__.return_value = mock_sock

        sensor = NetworkTemperatureSensorV0("192.168.1.150", 8080, timeout=15)
        sensor.read_sensor()
        mock_sock.settimeout.assert_called_once_with(15)

    @patch("requests.get")
    def test_network_sensor_v1_read_sensor(self, mock_get):
        mock_resp = MagicMock()
        mock_resp.json.return_value = {"temperature": 23.4, "humidity": 55.6}
        mock_get.return_value = mock_resp

        sensor = NetworkTemperatureSensorV1("192.168.1.160", 8000)
        temp, humi = sensor.read_sensor()

        self.assertEqual(temp, 23.4)
        self.assertEqual(humi, 55.6)
        mock_get.assert_called_once_with("http://192.168.1.160:8000/temperature", timeout=10)

    @patch("requests.get")
    def test_network_sensor_v1_custom_timeout(self, mock_get):
        mock_resp = MagicMock()
        mock_resp.json.return_value = {"temperature": 23.4, "humidity": 55.6}
        mock_get.return_value = mock_resp

        sensor = NetworkTemperatureSensorV1("192.168.1.160", 8000, timeout=25)
        sensor.read_sensor()
        mock_get.assert_called_once_with("http://192.168.1.160:8000/temperature", timeout=25)

    @patch.object(NetworkTemperatureSensorV0, "read_sensor", return_value=(20.0, 40.0))
    def test_measure_dispatcher_api_0(self, mock_read):
        device = DeviceStub(ip_address="192.168.1.200", port=80, api=0)
        result = measure_temperature_and_humidity(device)
        self.assertEqual(result, (20.0, 40.0))
        mock_read.assert_called_once()

    @patch.object(NetworkTemperatureSensorV1, "read_sensor", return_value=(22.0, 45.0))
    def test_measure_dispatcher_api_1(self, mock_read):
        device = DeviceStub(ip_address="192.168.1.200", port=80, api=1)
        result = measure_temperature_and_humidity(device)
        self.assertEqual(result, (22.0, 45.0))
        mock_read.assert_called_once()

    def test_measure_dispatcher_invalid_api_raises(self):
        device = DeviceStub(name="UnknownAPI", ip_address="192.168.1.200", port=80, api=99)
        with self.assertRaises(NotImplementedError):
            measure_temperature_and_humidity(device)

    @patch("temperature.measure.am2320.read_sensor", return_value=(19.0, 50.0))
    def test_measure_dispatcher_local_am2320_fallback(self, mock_read):
        # Device without IP
        device_no_ip = DeviceStub(ip_address=None, port=None)
        result1 = measure_temperature_and_humidity(device_no_ip)
        self.assertEqual(result1, (19.0, 50.0))

        # None device
        result2 = measure_temperature_and_humidity(None)
        self.assertEqual(result2, (19.0, 50.0))
        self.assertEqual(mock_read.call_count, 2)
