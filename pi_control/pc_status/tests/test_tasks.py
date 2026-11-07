from unittest.mock import patch

from django.test import SimpleTestCase

from pc_status.tasks import make_sleep, wake_pc


class PcStatusTasksTestCase(SimpleTestCase):
    @patch("pc_status.tasks.send_magic_packet")
    def test_wake_pc_task(self, mock_send_packet):
        mock_send_packet.return_value = None
        wake_pc("AA:BB:CC:DD:EE:FF", "192.168.1.100")
        mock_send_packet.assert_called_once_with("AA:BB:CC:DD:EE:FF", ip_address="192.168.1.100")

    @patch("pc_status.pc_status.make_sleep")
    def test_make_sleep_task(self, mock_make_sleep):
        mock_make_sleep.return_value = True
        result = make_sleep("http://192.168.1.100:8001", "mysecret")
        self.assertTrue(result)
        mock_make_sleep.assert_called_once_with("http://192.168.1.100:8001", "mysecret")
