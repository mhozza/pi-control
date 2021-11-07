from machine import Pin


def add_button_listener(pin, callback, pull_up=False):
    button_state = False
    off_state = int(pull_up)

    callback = callback
    pin = Pin(pin, Pin.IN, Pin.PULL_UP if pull_up else None)

    def handler(p):
        current_state = bool(abs(p.value() - off_state))
        nonlocal button_state
        callback(p)
        button_state = current_state

    pin.irq(trigger=Pin.IRQ_RISING | Pin.IRQ_FALLING, handler=handler)
