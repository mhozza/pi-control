from unittest.mock import patch

from django.contrib.auth.models import User
from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework.test import APIClient

from temperature import constants
from temperature.models import Entry, MeasurementDevice, Room


class TemperatureViewsTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="tempuser",
            email="tempuser@example.com",
            password="testpassword123",
        )
        self.room = Room.objects.create(
            name="Kitchen",
            temperature_low=20.0,
            temperature_high=24.0,
            humidity_low=35.0,
            humidity_high=55.0,
        )
        self.device = MeasurementDevice.objects.create(
            id=constants.DEFAULT_DEVICE,
            name="Default Pi",
            room=self.room,
            active=True,
        )

    def test_unauthenticated_requests_rejected(self):
        endpoints = [
            "/api/temperature/now/",
            f"/api/temperature/room/{self.room.id}/now/",
            "/api/temperature/devices/",
            "/api/temperature/rooms/",
            "/api/temperature/list/",
        ]
        for url in endpoints:
            response = self.client.get(url)
            self.assertIn(response.status_code, [401, 403], f"Expected 401/403 for {url}")

    @patch("temperature.views.measure_temperature_and_humidity", return_value=(22.5, 48.0))
    def test_get_temperature_and_humidity_default_device(self, mock_measure):
        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/temperature/now/")
        self.assertEqual(response.status_code, 200)
        data = response.json()

        self.assertEqual(data["device"], constants.DEFAULT_DEVICE)
        self.assertEqual(data["temperature"]["value"], 22.5)
        self.assertEqual(data["temperature"]["low"], 20.0)
        self.assertEqual(data["temperature"]["high"], 24.0)
        self.assertEqual(data["humidity"]["value"], 48.0)
        self.assertEqual(data["humidity"]["low"], 35.0)
        self.assertEqual(data["humidity"]["high"], 55.0)
        mock_measure.assert_called_once_with(self.device)

    @patch("temperature.views.measure_temperature_and_humidity", return_value=(18.0, 60.0))
    def test_get_temperature_and_humidity_custom_device(self, mock_measure):
        self.client.force_authenticate(user=self.user)
        custom_dev = MeasurementDevice.objects.create(
            id="pi-garage",
            name="Garage Sensor",
            active=True,
        )
        response = self.client.get("/api/temperature/now/?device=pi-garage")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["device"], "pi-garage")
        self.assertEqual(data["temperature"]["value"], 18.0)
        self.assertEqual(data["temperature"]["low"], constants.DEFAULT_TEMPERATURE_LOW)
        mock_measure.assert_called_once_with(custom_dev)

    @override_settings(DEBUG=False)
    @patch("temperature.views.measure_temperature_and_humidity", side_effect=RuntimeError("Sensor error"))
    def test_get_temperature_and_humidity_sensor_error_debug_false(self, mock_measure):
        self.client.force_authenticate(user=self.user)
        with self.assertRaises(RuntimeError):
            self.client.get("/api/temperature/now/")

    @override_settings(DEBUG=True)
    @patch("temperature.views.measure_temperature_and_humidity", side_effect=RuntimeError("Sensor error"))
    def test_get_temperature_and_humidity_sensor_error_debug_true(self, mock_measure):
        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/temperature/now/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(17 <= data["temperature"]["value"] <= 30)
        self.assertTrue(20 <= data["humidity"]["value"] <= 70)

    def test_get_room_temperature_and_humidity_room_not_found(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/temperature/room/99999/now/")
        self.assertEqual(response.status_code, 404)

    def test_get_room_temperature_and_humidity_empty_room_returns_204(self):
        self.client.force_authenticate(user=self.user)
        empty_room = Room.objects.create(name="Attic")
        response = self.client.get(f"/api/temperature/room/{empty_room.id}/now/")
        self.assertEqual(response.status_code, 204)

    @patch(
        "temperature.views.measure_temperature_and_humidity",
        side_effect=[(20.0, 40.0), (24.0, 50.0)],
    )
    def test_get_room_temperature_and_humidity_success(self, mock_measure):
        self.client.force_authenticate(user=self.user)
        # Create second device in the same room
        MeasurementDevice.objects.create(
            id="pi-kitchen-2",
            name="Kitchen Aux",
            room=self.room,
            active=True,
        )

        response = self.client.get(f"/api/temperature/room/{self.room.id}/now/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["room"], self.room.id)
        # Average of 20.0 and 24.0 is 22.0
        self.assertAlmostEqual(data["temperature"]["value"], 22.0)
        # Average of 40.0 and 50.0 is 45.0
        self.assertAlmostEqual(data["humidity"]["value"], 45.0)
        self.assertEqual(len(data["devices"]), 2)

    def test_measurement_device_list_view(self):
        self.client.force_authenticate(user=self.user)
        MeasurementDevice.objects.create(id="dev-inactive", name="Inactive", active=False)
        response = self.client.get("/api/temperature/devices/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        ids = [d["id"] for d in data]
        self.assertIn(self.device.id, ids)
        self.assertNotIn("dev-inactive", ids)

    def test_room_list_view(self):
        self.client.force_authenticate(user=self.user)
        Room.objects.create(name="EmptyRoom")
        response = self.client.get("/api/temperature/rooms/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        names = [r["name"] for r in data]
        self.assertIn("Kitchen", names)
        self.assertNotIn("EmptyRoom", names)

    def test_temperature_list_view_filtering(self):
        self.client.force_authenticate(user=self.user)
        now = timezone.now()

        # Entry for default device within 24h
        e1 = Entry.objects.create(device=self.device, temperature=21.0, humidity=45.0)

        # Entry for default device 3 days ago
        e2 = Entry.objects.create(device=self.device, temperature=19.0, humidity=50.0)
        Entry.objects.filter(id=e2.id).update(time=now - timezone.timedelta(days=3))

        # Entry for another device within 24h
        other_dev = MeasurementDevice.objects.create(id="other-dev", name="Other", active=True)
        Entry.objects.create(device=other_dev, temperature=25.0, humidity=30.0)

        # Default request should only return e1
        response = self.client.get("/api/temperature/list/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]["temperature"], 21.0)

        # Filter by custom device
        response_other = self.client.get("/api/temperature/list/?device=other-dev")
        self.assertEqual(response_other.status_code, 200)
        data_other = response_other.json()
        self.assertEqual(len(data_other), 1)
        self.assertEqual(data_other[0]["temperature"], 25.0)

        # Filter by from and to
        from_str = (now - timezone.timedelta(days=4)).isoformat()
        to_str = (now - timezone.timedelta(days=2)).isoformat()
        response_range = self.client.get(f"/api/temperature/list/{from_str}/{to_str}/")
        self.assertEqual(response_range.status_code, 200)
        data_range = response_range.json()
        self.assertEqual(len(data_range), 1)
        self.assertEqual(data_range[0]["temperature"], 19.0)

    def test_temperature_list_invalid_from_date_kwarg_returns_400(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/temperature/list/invalid-date/")
        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertIn("Invalid datetime format.", str(data))

    def test_temperature_list_out_of_range_calendar_date_kwarg_returns_400(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/temperature/list/2023-02-31T00:00:00/")
        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertIn("Invalid datetime format.", str(data))

    def test_temperature_list_invalid_to_date_kwarg_returns_400(self):
        self.client.force_authenticate(user=self.user)
        from_str = timezone.now().isoformat()
        response = self.client.get(f"/api/temperature/list/{from_str}/invalid-to-date/")
        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertIn("Invalid datetime format.", str(data))

    def test_temperature_list_invalid_from_query_param_returns_400(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/temperature/list/?from=not-a-valid-date")
        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertIn("Invalid datetime format.", str(data))

    def test_temperature_list_out_of_range_calendar_date_query_param_returns_400(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/temperature/list/?to=2023-02-31T00:00:00")
        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertIn("Invalid datetime format.", str(data))

    def test_temperature_list_query_params_valid_and_empty(self):
        self.client.force_authenticate(user=self.user)
        # Empty parameters should fallback gracefully to default 200
        response_empty = self.client.get("/api/temperature/list/?from=&to=")
        self.assertEqual(response_empty.status_code, 200)

        # Valid query parameters
        now = timezone.now()
        from_str = (now - timezone.timedelta(days=1)).isoformat()
        to_str = now.isoformat()
        response_valid = self.client.get(f"/api/temperature/list/?from={from_str}&to={to_str}")
        self.assertEqual(response_valid.status_code, 200)
