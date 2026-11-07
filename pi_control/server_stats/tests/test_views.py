from unittest.mock import patch

from django.apps import apps
from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework.test import APIClient

from server_stats.apps import ServerStatsConfig


class ServerStatsViewsTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="statsuser",
            email="statsuser@example.com",
            password="testpassword123",
        )

    def test_unauthenticated_request_rejected(self):
        response = self.client.get("/api/server_stats/")
        self.assertIn(response.status_code, [401, 403])

    @patch("server_stats.views.helpers.get_cpu_temperature", return_value=48.2)
    @patch("server_stats.views.helpers.get_last_backup_time", return_value=1600000000.0)
    @patch("server_stats.views.helpers.get_swap", return_value=10.5)
    @patch("server_stats.views.helpers.get_memory", return_value=55.0)
    @patch("server_stats.views.helpers.get_cpu", return_value=12.0)
    @patch("server_stats.views.helpers.get_uptime", return_value=3600.0)
    def test_get_server_stats_success(
        self, mock_uptime, mock_cpu, mock_mem, mock_swap, mock_backup, mock_temp
    ):
        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/server_stats/")
        self.assertEqual(response.status_code, 200)
        data = response.json()

        self.assertEqual(data["cpu"], 12.0)
        self.assertEqual(data["memory"], 55.0)
        self.assertEqual(data["swap"], 10.5)
        self.assertEqual(data["cpu_temp"], 48.2)
        self.assertEqual(data["uptime"], "1:00:00")
        self.assertIsNotNone(data["backuptime"])
        self.assertIn("name", data)
        self.assertIn("time", data)

    @patch("server_stats.views.helpers.get_cpu_temperature", side_effect=AssertionError("No temp file"))
    @patch("server_stats.views.helpers.get_last_backup_time", side_effect=FileNotFoundError("No backup file"))
    @patch("server_stats.views.helpers.get_swap", return_value=5.0)
    @patch("server_stats.views.helpers.get_memory", return_value=40.0)
    @patch("server_stats.views.helpers.get_cpu", return_value=8.0)
    @patch("server_stats.views.helpers.get_uptime", return_value=7200.0)
    def test_get_server_stats_resilience_to_missing_files(
        self, mock_uptime, mock_cpu, mock_mem, mock_swap, mock_backup, mock_temp
    ):
        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/server_stats/")
        self.assertEqual(response.status_code, 200)
        data = response.json()

        self.assertIsNone(data["backuptime"])
        self.assertIsNone(data["cpu_temp"])
        self.assertEqual(data["cpu"], 8.0)
        self.assertEqual(data["uptime"], "2:00:00")

    def test_app_config(self):
        self.assertEqual(ServerStatsConfig.name, "server_stats")
        app_config = apps.get_app_config("server_stats")
        self.assertIsInstance(app_config, ServerStatsConfig)
