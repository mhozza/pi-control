from collections import namedtuple

import logging
import re
import subprocess

logger = logging.getLogger(__name__)

# should match lines like this:
# 64 bytes from 192.168.178.45: icmp_seq=2 ttl=64 time=103 ms
single_matcher = re.compile(
    "(?P<bytes>\d+) bytes from (?P<IP>(\d+.\d+.\d+.\d+)|([a-z0-9.-]+ \(\d+.\d+.\d+.\d+\))): icmp_seq=("
    "?P<sequence>\d+) ttl=(?P<ttl>\d+) time=(?P<time>\d+(.\d+)?) ms")
# should match lines like this:
# rtt min/avg/max/mdev = 0.234/0.234/0.234/0.000 ms
# alternative matcher for a different ping utility:
end_matcher = re.compile("rtt min/avg/max/mdev = (?P<min>\d+.\d+)/(?P<avg>\d+.\d+)/(?P<max>\d+.\d+)/(?P<mdev>\d+.\d+)")

Stats = namedtuple('Stats', ['min', 'avg', 'max', 'mdev'])

HOST = 'google.co.uk'
COUNT = 10
INTERVAL = 3


def ping(host=None, count=4, interval=1.0, debug=False):
    ping_command = subprocess.Popen(
        ["ping", "-c", str(count), "-i", str(interval), host],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT
    )

    times = []
    stats = None
    for line in ping_command.stdout:
        line = line.decode('ascii').strip()
        if not line:
            continue
        if debug:
            logger.debug("Analyzing this line: " + line)
        match = single_matcher.match(line)
        if match:
            if debug:
                logger.debug("Matches found: {}".format(match.groups()))
            time = float(match.group('time'))
            times.append(time)
            continue
        match = end_matcher.match(line)
        if match:
            if debug:
                logger.debug("Matches found: {}".format(match.groups()))
            stats = Stats(*match.groups())
            continue
        if debug:
            logger.debug("Didn't understand this line: " + line)
    return times, stats


def measure_ping():
    _, stats = ping(HOST, COUNT, INTERVAL)
    if stats is not None:
        return stats.avg
    else:
        logger.info('No network')
        return None
