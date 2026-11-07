from django.contrib import admin
from django.test import TestCase

from temperature import constants
from temperature.admin import EntryAdmin, MeasurementDeviceAdmin, RoomAdmin
from temperature.models import Entry, MeasurementDevice, Room
from temperature.serializers import (
    EntrySerializer,
    MeasurementDeviceSerializer,
    RoomSerializer,
)


class TemperatureModelsTestCase(TestCase):
    def setUp(self):
        self.room = Room.objects.create(name="Living Room")
        self.device = MeasurementDevice.objects.create(
            id="pi-living-room",
            name="Living Room Sensor",
            ip_address="192.168.1.101",
            port=80,
            room=self.room,
            active=True,
            api=1,
        )

    def test_room_defaults_and_str(self):
        self.assertEqual(self.room.name, "Living Room")
        self.assertEqual(self.room.temperature_low, constants.DEFAULT_TEMPERATURE_LOW)
        self.assertEqual(self.room.temperature_high, constants.DEFAULT_TEMPERATURE_HIGH)
        self.assertEqual(self.room.humidity_low, constants.DEFAULT_HUMIDITY_LOW)
        self.assertEqual(self.room.humidity_high, constants.DEFAULT_HUMIDITY_HIGH)
        self.assertEqual(str(self.room), "Living Room")

    def test_room_manager_non_empty(self):
        # self.room has an active device, so it must be included
        empty_room = Room.objects.create(name="Empty Room")
        inactive_room = Room.objects.create(name="Inactive Room")
        MeasurementDevice.objects.create(
            id="pi-inactive",
            name="Inactive Sensor",
            room=inactive_room,
            active=False,
        )

        non_empty_rooms = Room.objects.non_empty()
        self.assertIn(self.room, non_empty_rooms)
        self.assertNotIn(empty_room, non_empty_rooms)
        self.assertNotIn(inactive_room, non_empty_rooms)

    def test_device_manager_active(self):
        inactive_device = MeasurementDevice.objects.create(
            id="pi-disabled",
            name="Disabled Sensor",
            room=self.room,
            active=False,
        )
        active_devices = MeasurementDevice.objects.active()
        self.assertIn(self.device, active_devices)
        self.assertNotIn(inactive_device, active_devices)
        self.assertEqual(str(self.device), "Living Room Sensor")

    def test_entry_creation_and_str(self):
        entry = Entry.objects.create(
            device=self.device,
            temperature=21.5,
            humidity=45.2,
        )
        self.assertEqual(entry.device, self.device)
        self.assertEqual(entry.temperature, 21.5)
        self.assertEqual(entry.humidity, 45.2)
        self.assertIsNotNone(entry.time)
        self.assertEqual(str(entry), f"{entry.time}: 21.5°C, 45.2%")

    def test_serializers(self):
        entry = Entry.objects.create(device=self.device, temperature=22.0, humidity=40.0)
        e_ser = EntrySerializer(entry).data
        self.assertEqual(e_ser["temperature"], 22.0)
        self.assertEqual(e_ser["humidity"], 40.0)
        self.assertEqual(e_ser["device"], self.device.id)

        d_ser = MeasurementDeviceSerializer(self.device).data
        self.assertEqual(d_ser["id"], "pi-living-room")
        self.assertEqual(d_ser["name"], "Living Room Sensor")

        r_ser = RoomSerializer(self.device).data
        self.assertEqual(r_ser["id"], "pi-living-room")
        self.assertEqual(r_ser["name"], "Living Room Sensor")

    def test_admin_registration_and_helpers(self):
        self.assertIn(Entry, admin.site._registry)
        self.assertIsInstance(admin.site._registry[Entry], EntryAdmin)

        self.assertIn(MeasurementDevice, admin.site._registry)
        self.assertIsInstance(admin.site._registry[MeasurementDevice], MeasurementDeviceAdmin)

        self.assertIn(Room, admin.site._registry)
        room_admin = admin.site._registry[Room]
        self.assertIsInstance(room_admin, RoomAdmin)

        ideal_temp = room_admin.ideal_temperature(self.room)
        self.assertEqual(ideal_temp, f"{self.room.temperature_low}–{self.room.temperature_high}°C")

        ideal_humi = room_admin.ideal_humidity(self.room)
        self.assertEqual(ideal_humi, f"{self.room.humidity_low}–{self.room.humidity_high}%")
