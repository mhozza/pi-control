from unittest.mock import AsyncMock, patch

from django.test import TestCase
from django.utils import timezone

from network.models import Entry
from network.tasks import MIN_MEASUREMENT_TIME_DIFFERENCE_MINUTES, log_ping


class NetworkTasksTestCase(TestCase):
    @patch("network.tasks.measure_ping", new_callable=AsyncMock)
    def test_log_ping_first_entry(self, mock_measure):
        mock_measure.return_value = 14.5
        self.assertEqual(Entry.objects.count(), 0)

        log_ping()

        self.assertEqual(Entry.objects.count(), 1)
        entry = Entry.objects.first()
        self.assertEqual(entry.ping, 14.5)
        mock_measure.assert_called_once()

    @patch("network.tasks.measure_ping", new_callable=AsyncMock)
    def test_log_ping_too_recent_skips(self, mock_measure):
        # Create an entry timestamped now
        Entry.objects.create(ping=10.0)
        self.assertEqual(Entry.objects.count(), 1)

        log_ping()

        self.assertEqual(Entry.objects.count(), 1)
        mock_measure.assert_not_called()

    @patch("network.tasks.measure_ping", new_callable=AsyncMock)
    def test_log_ping_past_interval_runs(self, mock_measure):
        mock_measure.return_value = 22.1
        # Create an entry 5 minutes in the past
        past_time = timezone.now() - timezone.timedelta(minutes=5)
        entry = Entry.objects.create(ping=10.0)
        Entry.objects.filter(id=entry.id).update(time=past_time)

        log_ping()

        self.assertEqual(Entry.objects.count(), 2)
        latest_entry = Entry.objects.latest("time")
        self.assertEqual(latest_entry.ping, 22.1)
        mock_measure.assert_called_once()
