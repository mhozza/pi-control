import asyncio
from unittest.mock import AsyncMock, patch

from django.test import SimpleTestCase

from network.measure import (
    Stats,
    end_matcher,
    measure_ping,
    ping,
    single_matcher,
)


class NetworkMeasureTestCase(SimpleTestCase):
    def test_single_matcher_ip_format(self):
        line = "64 bytes from 192.168.1.1: icmp_seq=1 ttl=64 time=12.3 ms"
        match = single_matcher.match(line)
        self.assertIsNotNone(match)
        self.assertEqual(match.group("time"), "12.3")
        self.assertEqual(match.group("sequence"), "1")
        self.assertEqual(match.group("ttl"), "64")

    def test_single_matcher_hostname_format(self):
        line = "64 bytes from host.example.com (93.184.216.34): icmp_seq=3 ttl=56 time=25.4 ms"
        match = single_matcher.match(line)
        self.assertIsNotNone(match)
        self.assertEqual(match.group("time"), "25.4")

    def test_single_matcher_non_matching_line(self):
        line = "PING google.co.uk (172.217.16.227) 56(84) bytes of data."
        self.assertIsNone(single_matcher.match(line))

    def test_end_matcher(self):
        line = "rtt min/avg/max/mdev = 10.123/15.456/20.789/2.345 ms"
        match = end_matcher.match(line)
        self.assertIsNotNone(match)
        self.assertEqual(match.group("min"), "10.123")
        self.assertEqual(match.group("avg"), "15.456")
        self.assertEqual(match.group("max"), "20.789")
        self.assertEqual(match.group("mdev"), "2.345")

    def test_ping_execution_parsing(self):
        mock_output = (
            b"PING google.co.uk (172.217.16.227) 56(84) bytes of data.\n"
            b"64 bytes from 172.217.16.227: icmp_seq=1 ttl=118 time=10.0 ms\n"
            b"64 bytes from 172.217.16.227: icmp_seq=2 ttl=118 time=12.0 ms\n"
            b"64 bytes from 172.217.16.227: icmp_seq=3 ttl=118 time=14.0 ms\n"
            b"\n"
            b"--- google.co.uk ping statistics ---\n"
            b"3 packets transmitted, 3 received, 0% packet loss, time 2003ms\n"
            b"rtt min/avg/max/mdev = 10.000/12.000/14.000/1.632 ms\n"
        )
        proc_mock = AsyncMock()
        proc_mock.communicate.return_value = (mock_output, b"")

        with patch("asyncio.create_subprocess_exec", return_value=proc_mock) as mock_exec:
            times, stats = asyncio.run(ping("google.co.uk", count=3, interval=1.0, debug=True))
            self.assertEqual(times, [10.0, 12.0, 14.0])
            self.assertEqual(stats, Stats("10.000", "12.000", "14.000", "1.632"))
            mock_exec.assert_called_once()

    def test_measure_ping_normal_outlier_trimming(self):
        # COUNT is 7, WARM_UP is 2
        # times = [1.0, 2.0, 10.0, 20.0, 15.0, 12.0, 30.0]
        # after warm_up (first 2 removed): [10.0, 20.0, 15.0, 12.0, 30.0]
        # sorted: [10.0, 12.0, 15.0, 20.0, 30.0]
        # trimmed (1st and last removed): [12.0, 15.0, 20.0]
        # avg = (12.0 + 15.0 + 20.0) / 3 = 47.0 / 3 = 15.666666666666666
        canned_times = [1.0, 2.0, 10.0, 20.0, 15.0, 12.0, 30.0]
        canned_stats = Stats("1.0", "15.0", "30.0", "5.0")

        with patch("network.measure.ping", new=AsyncMock(return_value=(canned_times, canned_stats))):
            avg = asyncio.run(measure_ping())
            self.assertAlmostEqual(avg, 47.0 / 3)

    def test_measure_ping_no_network_when_stats_none(self):
        with patch("network.measure.ping", new=AsyncMock(return_value=([], None))):
            result = asyncio.run(measure_ping())
            self.assertIsNone(result)

    def test_measure_ping_no_network_when_times_empty(self):
        canned_stats = Stats("0", "0", "0", "0")
        with patch("network.measure.ping", new=AsyncMock(return_value=([], canned_stats))):
            result = asyncio.run(measure_ping())
            self.assertIsNone(result)
