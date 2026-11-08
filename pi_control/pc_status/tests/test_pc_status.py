import subprocess
from unittest.mock import MagicMock, patch

from django.test import SimpleTestCase

from pc_status.pc_status import check_connection, check_ping, make_sleep


class PcStatusHelpersTestCase(SimpleTestCase):
    @patch("pc_status.pc_status.subprocess.run")
    def test_check_ping_success(self, mock_run):
        mock_run.return_value = MagicMock(returncode=0)
        self.assertTrue(check_ping("192.168.1.10"))
        mock_run.assert_called_once_with(
            ["ping", "-c", "1", "-w", "1", "192.168.1.10"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            check=False,
        )

    @patch("pc_status.pc_status.subprocess.run")
    def test_check_ping_failure(self, mock_run):
        mock_run.return_value = MagicMock(returncode=1)
        self.assertFalse(check_ping("192.168.1.10"))

    @patch("pc_status.pc_status.subprocess.run")
    def test_check_ping_command_injection_safely_handled(self, mock_run):
        mock_run.return_value = MagicMock(returncode=1)
        injection_host = "127.0.0.1; rm -rf /"
        self.assertFalse(check_ping(injection_host))
        mock_run.assert_called_once_with(
            ["ping", "-c", "1", "-w", "1", "127.0.0.1; rm -rf /"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            check=False,
        )

    @patch("socket.socket")
    def test_check_connection_success(self, mock_socket_cls):
        mock_sock = MagicMock()
        mock_sock.connect_ex.return_value = 0
        mock_socket_cls.return_value = mock_sock

        self.assertTrue(check_connection("192.168.1.10", 22))
        mock_sock.settimeout.assert_called_once_with(2)
        mock_sock.connect_ex.assert_called_once_with(("192.168.1.10", 22))

    @patch("socket.socket")
    def test_check_connection_failure(self, mock_socket_cls):
        mock_sock = MagicMock()
        mock_sock.connect_ex.return_value = 111  # Connection refused
        mock_socket_cls.return_value = mock_sock

        self.assertFalse(check_connection("192.168.1.10", 22))

    @patch("requests.get")
    def test_make_sleep_success_200(self, mock_get):
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_get.return_value = mock_resp

        result = make_sleep("http://192.168.1.10:8001", "mysecret")
        self.assertTrue(result)
        mock_get.assert_called_once_with(
            "http://192.168.1.10:8001",
            params={"key": "mysecret", "command": "SUSPEND"},
        )

    @patch("requests.get")
    def test_make_sleep_success_204(self, mock_get):
        mock_resp = MagicMock()
        mock_resp.status_code = 204
        mock_get.return_value = mock_resp

        self.assertTrue(make_sleep("http://192.168.1.10:8001", "mysecret"))

    @patch("requests.get")
    def test_make_sleep_failure(self, mock_get):
        mock_resp = MagicMock()
        mock_resp.status_code = 500
        mock_get.return_value = mock_resp

        self.assertFalse(make_sleep("http://192.168.1.10:8001", "mysecret"))
