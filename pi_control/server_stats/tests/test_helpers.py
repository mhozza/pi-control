from collections import namedtuple
from unittest.mock import MagicMock, mock_open, patch

from django.test import SimpleTestCase

from server_stats import helpers

MemInfo = namedtuple("MemInfo", ["percent"])


class ServerStatsHelpersTestCase(SimpleTestCase):
    @patch("time.time", return_value=1500.0)
    @patch("server_stats.helpers.psutil.boot_time", return_value=1000.0)
    def test_get_uptime(self, mock_boot, mock_time):
        uptime = helpers.get_uptime()
        self.assertEqual(uptime, 500.0)

    @patch("server_stats.helpers.psutil.cpu_percent", return_value=24.5)
    def test_get_cpu(self, mock_cpu):
        self.assertEqual(helpers.get_cpu(), 24.5)

    @patch("server_stats.helpers.psutil.virtual_memory", return_value=MemInfo(percent=65.2))
    def test_get_memory(self, mock_mem):
        self.assertEqual(helpers.get_memory(), 65.2)

    @patch("server_stats.helpers.psutil.swap_memory", return_value=MemInfo(percent=12.8))
    def test_get_swap(self, mock_swap):
        self.assertEqual(helpers.get_swap(), 12.8)

    def test_get_last_backup_time_raises_when_no_filename(self):
        with patch("server_stats.helpers.BACKUP_FILENAME", None):
            with self.assertRaises(AssertionError):
                helpers.get_last_backup_time()

    @patch("os.path.getmtime", return_value=1700000000.0)
    def test_get_last_backup_time_success(self, mock_mtime):
        with patch("server_stats.helpers.BACKUP_FILENAME", "/var/backups/backup.tar.gz"):
            self.assertEqual(helpers.get_last_backup_time(), 1700000000.0)
            mock_mtime.assert_called_once_with("/var/backups/backup.tar.gz")

    @patch("subprocess.Popen")
    def test_is_service_active_true(self, mock_popen):
        proc = MagicMock()
        proc.stdout.read.return_value = (
            b"Id=pi-control.service\n"
            b"ActiveState=active\n"
            b"SubState=running\n"
        )
        mock_popen.return_value = proc

        self.assertTrue(helpers.is_service_active("pi-control"))
        mock_popen.assert_called_once_with(
            ["/bin/systemctl", "show", "pi-control.service", "--no-page"],
            stdout=mock_popen.call_args[1]["stdout"],
            stderr=mock_popen.call_args[1]["stderr"],
        )

    @patch("subprocess.Popen")
    def test_is_service_active_false(self, mock_popen):
        proc = MagicMock()
        proc.stdout.read.return_value = (
            b"Id=pi-control.service\n"
            b"ActiveState=inactive\n"
            b"SubState=dead\n"
        )
        mock_popen.return_value = proc

        self.assertFalse(helpers.is_service_active("pi-control"))

    def test_get_cpu_temperature_raises_when_no_filename(self):
        with patch("server_stats.helpers.CPU_TEMPERATURE_FILE", None):
            with self.assertRaises(AssertionError):
                helpers.get_cpu_temperature()

    def test_get_cpu_temperature_success(self):
        m_open = mock_open(read_data="42500\n")
        with patch("server_stats.helpers.CPU_TEMPERATURE_FILE", "/sys/class/thermal/thermal_zone0/temp"):
            with patch("builtins.open", m_open):
                temp = helpers.get_cpu_temperature()
                self.assertEqual(temp, 42.5)
