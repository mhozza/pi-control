from django.contrib import admin
from django.test import TestCase
from django.utils import timezone

from network.admin import EntryAdmin
from network.models import Entry
from network.serializers import EntrySerializer


class NetworkModelsTestCase(TestCase):
    def test_entry_creation_and_str(self):
        entry = Entry.objects.create(ping=12.34)
        self.assertIsNotNone(entry.time)
        self.assertEqual(entry.ping, 12.34)
        self.assertEqual(str(entry), f"{entry.time}: 12.34ms")

    def test_entry_null_ping(self):
        entry = Entry.objects.create(ping=None)
        self.assertIsNone(entry.ping)
        self.assertEqual(str(entry), f"{entry.time}: Nonems")

    def test_entry_serializer(self):
        entry = Entry.objects.create(ping=45.6)
        serializer = EntrySerializer(entry)
        data = serializer.data
        self.assertEqual(data["ping"], 45.6)
        self.assertIn("time", data)

    def test_admin_registered(self):
        self.assertIn(Entry, admin.site._registry)
        self.assertIsInstance(admin.site._registry[Entry], EntryAdmin)
