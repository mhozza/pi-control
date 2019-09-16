#!/usr/bin/env python
import os
from pathlib import Path

IMAGE_NAME = "mhozza/pi-control:dev-latest"
CODE_PATH = Path(__file__).parent / "pi_control"
COMMAND = "npm run --prefix=/web/home/js build"

assert CODE_PATH.is_dir()

os.system(
    f"docker run {IMAGE_NAME} {COMMAND} --volume='{CODE_PATH.resolve()}:/web:rw node_modules:/web/home/js/node_modules:rw'"
)
