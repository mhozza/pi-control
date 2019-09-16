#!/usr/bin/env python
import hashlib
import os
from pathlib import Path

IMAGE_NAME = "mhozza/pi-control:dev-latest"
CODE_PATH = Path(__file__).parent / "pi_control"
COMMAND = "npm run --prefix=/web/home/js build"
OUT_FNAME = Path(__file__).parent / "pi_control/home/static/js/app.js"

assert CODE_PATH.is_dir()


def file_checksum(fname):
    hasher = hashlib.md5()
    with open(fname, "rb") as afile:
        buf = afile.read()
        hasher.update(buf)
        return hasher.digest()


checksum = file_checksum(OUT_FNAME)

os.system(
    f"docker run {IMAGE_NAME} {COMMAND} --volume='{CODE_PATH.resolve()}:/web:rw node_modules:/web/home/js/node_modules:rw'"
)

if checksum != file_checksum(OUT_FNAME):
    exit(1)
