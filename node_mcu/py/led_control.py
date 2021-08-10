from config import CONFIG
from machine import Pin, PWM
from math import ceil
import time

FREQ = 1000
MAX_DUTY = 1023
WHITE_BALANCE = [1, 0.6, 1]


def reset_pins():
    try:
        pins = CONFIG["led_pins"]
        assert len(pins) == 3
        for p in pins:
            pin = Pin(p, Pin.OUT)
            PWM(pin).deinit()
            pin.off()
    except Exception as e:
        print(e)


def set_color(r, g, b):
    pins = CONFIG["led_pins"]
    assert len(pins) == 3
    rgb = [r, g, b]

    for i, c in enumerate(rgb):
        pin = Pin(pins[i])
        if c > 0:
            PWM(pin, freq=FREQ, duty=ceil(c * WHITE_BALANCE[i] * MAX_DUTY))
        else:
            PWM(pin).deinit()
            pin.off()


class Semaphore:
    _state = 0

    def __init__(self, orange_time=0):
        self.orange_time = orange_time
        self.set_red()

    def deinit(self):
        reset_pins()

    def _set_orange(self):
        set_color(1, 0.5, 0)

    def set_green(self):
        ostate = self._state
        self._state = 1
        if self.orange_time and ostate != self._state:
            self._set_orange()
            time.sleep_ms(self.orange_time)
        set_color(0, 1, 0)

    def set_red(self):
        ostate = self._state
        self._state = 0
        if self.orange_time and ostate != self._state:
            self._set_orange()
            time.sleep_ms(self.orange_time)
        set_color(1, 0, 0)

    def toggle(self):
        if self._state:
            self.set_red()
        else:
            self.set_green()
