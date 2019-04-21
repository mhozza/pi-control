import asyncio
from collections import namedtuple

import logging
import re

logger = logging.getLogger(__name__)

# should match lines like this:
# 64 bytes from 192.168.178.45: icmp_seq=2 ttl=64 time=103 ms
single_matcher = re.compile(
    r"(?P<bytes>\d+) bytes from (?P<IP>(\d+.\d+.\d+.\d+)|([a-z0-9.-]+ \(\d+.\d+.\d+.\d+\))): icmp_seq=("
    r"?P<sequence>\d+) ttl=(?P<ttl>\d+) time=(?P<time>\d+(.\d+)?) ms")
# should match lines like this:
# rtt min/avg/max/mdev = 0.234/0.234/0.234/0.000 ms
# alternative matcher for a different ping utility:
end_matcher = re.compile(r"rtt min/avg/max/mdev = (?P<min>\d+.\d+)/(?P<avg>\d+.\d+)/(?P<max>\d+.\d+)/(?P<mdev>\d+.\d+)")

Stats = namedtuple('Stats', ['min', 'avg', 'max', 'mdev'])

HOST = 'google.co.uk'
COUNT = 7
INTERVAL = 2
WARM_UP = 2


async def ping(host, count=4, interval=1.0, debug=False):
    proc = await asyncio.create_subprocess_exec(
        "ping", "-4", "-c", str(count), "-i", str(interval), host,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.STDOUT
    )
    output, _ = await proc.communicate()
    times = []
    stats = None
    for line in output.decode('ascii').split('\n'):
        line = line.strip()
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


async def measure_ping():
    times, stats = await ping(HOST, COUNT, INTERVAL)
    if stats is None or not times:
        logger.info('No network')
        return None
    elif len(times) < WARM_UP:
        logger.warning('Too few ping measurements')
    else:
        # Remove first few (warm-up) and sort.
        times = sorted(times[WARM_UP:])
        # Remove outliers.
        times = times[1:-1]
    return sum(times) / len(times)
