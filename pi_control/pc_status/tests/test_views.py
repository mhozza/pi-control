from unittest.mock import patch

from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from pc_status.models import Pc


class PcStatusViewsTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="pcuser",
            email="pcuser@example.com",
            password="testpassword123",
        )
        self.token = Token.objects.create(user=self.user)
        self.pc = Pc.objects.create(
            id="workstation",
            ip_address="192.168.1.50",
            mac_address="00:11:22:33:44:55",
            control_port=8001,
            ssh_port=22,
            secret="pcsecret",
        )

    def test_unauthenticated_requests_rejected(self):
        self.assertIn(self.client.get("/api/pc_status/list").status_code, [401, 403])
        self.assertIn(self.client.get("/api/pc_status/status/workstation").status_code, [401, 403])
        self.assertIn(self.client.post("/api/pc_status/wakeup/workstation").status_code, [401, 403])
        self.assertIn(self.client.post("/api/pc_status/sleep/workstation").status_code, [401, 403])

    def test_get_pc_list(self):
        self.client.force_authenticate(user=self.user)
        Pc.objects.create(
            id="laptop",
            ip_address="192.168.1.51",
            mac_address="00:11:22:33:44:66",
            secret="laptopsecret",
        )
        response = self.client.get("/api/pc_status/list")
        self.assertEqual(response.status_code, 200)
        self.assertCountEqual(response.json(), ["workstation", "laptop"])

    def test_get_pc_status_not_found(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/pc_status/status/nonexistent")
        self.assertEqual(response.status_code, 404)

    @patch("pc_status.views.pc_status.check_connection")
    @patch("pc_status.views.pc_status.check_ping")
    def test_get_pc_status_online_and_ssh_up(self, mock_ping, mock_conn):
        self.client.force_authenticate(user=self.user)
        mock_ping.return_value = True
        mock_conn.return_value = True

        response = self.client.get("/api/pc_status/status/workstation")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["name"], "workstation")
        self.assertTrue(data["online"])
        self.assertTrue(data["ssh"])
        self.assertIn("time", data)
        mock_ping.assert_called_once_with("192.168.1.50")
        mock_conn.assert_called_once_with("192.168.1.50", 22)

    @patch("pc_status.views.pc_status.check_connection")
    @patch("pc_status.views.pc_status.check_ping")
    def test_get_pc_status_offline(self, mock_ping, mock_conn):
        self.client.force_authenticate(user=self.user)
        mock_ping.return_value = False

        response = self.client.get("/api/pc_status/status/workstation")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["name"], "workstation")
        self.assertFalse(data["online"])
        self.assertFalse(data["ssh"])
        mock_ping.assert_called_once_with("192.168.1.50")
        mock_conn.assert_not_called()

    def test_wakeup_not_found(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post("/api/pc_status/wakeup/nonexistent")
        self.assertEqual(response.status_code, 404)

    @patch("pc_status.views.wake_pc_task.delay")
    def test_wakeup_success_with_force_auth(self, mock_delay):
        self.client.force_authenticate(user=self.user)
        response = self.client.post("/api/pc_status/wakeup/workstation")
        self.assertEqual(response.status_code, 200)
        mock_delay.assert_called_once_with(mac="00:11:22:33:44:55", ip="192.168.1.50")

    @patch("pc_status.views.wake_pc_task.delay")
    def test_wakeup_success_with_query_string_token(self, mock_delay):
        # Unauthenticated client using ?token= query parameter
        response = self.client.post(f"/api/pc_status/wakeup/workstation?token={self.token.key}")
        self.assertEqual(response.status_code, 200)
        mock_delay.assert_called_once_with(mac="00:11:22:33:44:55", ip="192.168.1.50")

    def test_make_sleep_not_found(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post("/api/pc_status/sleep/nonexistent")
        self.assertEqual(response.status_code, 404)

    @patch("pc_status.views.pc_status.make_sleep")
    def test_make_sleep_success(self, mock_make_sleep):
        self.client.force_authenticate(user=self.user)
        mock_make_sleep.return_value = True

        response = self.client.post("/api/pc_status/sleep/workstation")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data, True)
        mock_make_sleep.assert_called_once_with("http://192.168.1.50:8001", "pcsecret")

    @patch("pc_status.views.pc_status.make_sleep")
    def test_make_sleep_with_query_string_token(self, mock_make_sleep):
        mock_make_sleep.return_value = True
        response = self.client.post(f"/api/pc_status/sleep/workstation?token={self.token.key}")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data, True)
