from django.contrib.auth.models import User
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from network.models import Entry


class NetworkViewsTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="netuser",
            email="netuser@example.com",
            password="testpassword123",
        )
        self.now = timezone.now()

    def test_unauthenticated_request_rejected(self):
        response = self.client.get("/api/network/list/")
        self.assertIn(response.status_code, [401, 403])

    def test_authenticated_list_default_range(self):
        self.client.force_authenticate(user=self.user)
        # Create an entry within 24 hours
        entry1 = Entry.objects.create(ping=15.2)

        # Create an entry 2 days ago
        entry2 = Entry.objects.create(ping=99.9)
        Entry.objects.filter(id=entry2.id).update(
            time=self.now - timezone.timedelta(days=2)
        )

        response = self.client.get("/api/network/list/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]["ping"], 15.2)

    def test_list_custom_from_and_to_range(self):
        self.client.force_authenticate(user=self.user)
        t1 = self.now - timezone.timedelta(hours=5)
        t2 = self.now - timezone.timedelta(hours=2)

        e1 = Entry.objects.create(ping=11.1)
        Entry.objects.filter(id=e1.id).update(time=t1)

        e2 = Entry.objects.create(ping=22.2)
        Entry.objects.filter(id=e2.id).update(time=t2)

        # Request range that only includes e1: from 6 hours ago to 4 hours ago
        from_str = (self.now - timezone.timedelta(hours=6)).isoformat()
        to_str = (self.now - timezone.timedelta(hours=4)).isoformat()

        response = self.client.get(f"/api/network/list/{from_str}/{to_str}/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]["ping"], 11.1)
