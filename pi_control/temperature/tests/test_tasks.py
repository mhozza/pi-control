import asyncio
from datetime import datetime, timedelta
from unittest.mock import AsyncMock, patch

from django.test import TransactionTestCase, override_settings
from django.utils import timezone

from temperature.models import Entry, MeasurementDevice, Room
from temperature.tasks import (
    delay_measure,
    get_devices,
    get_last_entry_time,
    get_temperature_and_humidity_by_room,
    log_all_temperatures,
    log_temperature,
    log_temperature_for_device,
)


class TemperatureTasksTestCase(TransactionTestCase):
    def setUp(self):
        self.room = Room.objects.create(name="Bedroom")
        self.device = MeasurementDevice.objects.create(
            id="pi-bedroom",
            name="Bedroom Device",
            room=self.room,
            active=True,
        )

    @patch("asyncio.sleep", new_callable=AsyncMock)
    @patch("temperature.tasks.measure_temperature_and_humidity", return_value=(21.0, 45.0))
    def test_delay_measure(self, mock_measure, mock_sleep):
        result = asyncio.run(delay_measure(0.5, self.device))
        self.assertEqual(result, (21.0, 45.0))
        mock_sleep.assert_called_once_with(0.5)
        mock_measure.assert_called_once_with(self.device)

    def test_get_last_entry_time(self):
        Entry.objects.create(device=self.device, temperature=20.0, humidity=40.0)
        time_res = asyncio.run(get_last_entry_time(self.device))
        self.assertIsNotNone(time_res)

    @patch("asyncio.sleep", new_callable=AsyncMock)
    @patch(
        "temperature.tasks.measure_temperature_and_humidity",
        side_effect=[(20.0, 40.0), (22.0, 45.0), (21.0, 42.0)],
    )
    def test_log_temperature_for_device_success(self, mock_measure, mock_sleep):
        self.assertEqual(Entry.objects.count(), 0)
        asyncio.run(log_temperature_for_device(self.device))

        self.assertEqual(Entry.objects.count(), 1)
        entry = Entry.objects.first()
        # Median of [20.0, 21.0, 22.0] is 21.0
        # Median of [40.0, 42.0, 45.0] is 42.0
        self.assertEqual(entry.temperature, 21.0)
        self.assertEqual(entry.humidity, 42.0)
        self.assertEqual(entry.device, self.device)

    @patch("asyncio.sleep", new_callable=AsyncMock)
    @patch("temperature.tasks.measure_temperature_and_humidity")
    def test_log_temperature_for_device_too_recent_skips(self, mock_measure, mock_sleep):
        Entry.objects.create(device=self.device, temperature=20.0, humidity=40.0)
        self.assertEqual(Entry.objects.count(), 1)

        asyncio.run(log_temperature_for_device(self.device))

        self.assertEqual(Entry.objects.count(), 1)
        mock_measure.assert_not_called()

    @override_settings(DEBUG=False)
    @patch("asyncio.sleep", new_callable=AsyncMock)
    @patch("temperature.tasks.measure_temperature_and_humidity", side_effect=Exception("Sensor down"))
    def test_log_temperature_for_device_error_debug_false(self, mock_measure, mock_sleep):
        self.assertEqual(Entry.objects.count(), 0)
        asyncio.run(log_temperature_for_device(self.device))
        self.assertEqual(Entry.objects.count(), 0)

    @override_settings(DEBUG=True)
    @patch("asyncio.sleep", new_callable=AsyncMock)
    @patch("temperature.tasks.measure_temperature_and_humidity", side_effect=Exception("Sensor down"))
    def test_log_temperature_for_device_error_debug_true(self, mock_measure, mock_sleep):
        self.assertEqual(Entry.objects.count(), 0)
        asyncio.run(log_temperature_for_device(self.device))
        self.assertEqual(Entry.objects.count(), 1)
        entry = Entry.objects.first()
        self.assertTrue(15 <= entry.temperature <= 30)
        self.assertTrue(20 <= entry.humidity <= 70)

    def test_get_devices(self):
        inactive_device = MeasurementDevice.objects.create(
            id="pi-inactive",
            name="Inactive",
            room=self.room,
            active=False,
        )
        devices = asyncio.run(get_devices())
        device_ids = [d.id for d in devices]
        self.assertIn("pi-bedroom", device_ids)
        self.assertNotIn("pi-inactive", device_ids)

    @patch("asyncio.sleep", new_callable=AsyncMock)
    @patch("temperature.tasks.measure_temperature_and_humidity", return_value=(23.0, 50.0))
    def test_log_all_temperatures(self, mock_measure, mock_sleep):
        self.assertEqual(Entry.objects.count(), 0)
        log_all_temperatures()
        self.assertEqual(Entry.objects.count(), 1)

    @patch("temperature.tasks.log_all_temperatures")
    def test_log_temperature_celery_task(self, mock_log_all):
        log_temperature()
        mock_log_all.assert_called_once()

    def test_get_temperature_and_humidity_by_room(self):
        # Create an entry within 60 minutes
        Entry.objects.create(device=self.device, temperature=24.0, humidity=50.0)

        # Create another room with 2 devices
        other_room = Room.objects.create(name="Office")
        d1 = MeasurementDevice.objects.create(id="d1", name="Dev 1", room=other_room, active=True)
        d2 = MeasurementDevice.objects.create(id="d2", name="Dev 2", room=other_room, active=True)
        Entry.objects.create(device=d1, temperature=20.0, humidity=40.0)
        Entry.objects.create(device=d2, temperature=22.0, humidity=44.0)

        data = list(get_temperature_and_humidity_by_room())
        self.assertEqual(len(data), 2)
        room_map = {item["room__name"]: item["temperature"] for item in data}
        self.assertAlmostEqual(room_map["Bedroom"], 24.0)
        # Office average of 20.0 and 22.0 is 21.0
        self.assertAlmostEqual(room_map["Office"], 21.0)
