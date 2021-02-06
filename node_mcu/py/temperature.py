import am2320
from machine import Pin, I2C
from requests import JsonResponse, HTMLErrorResponse

SLOW = 100000


def setupSensor(scl=5, sda=4, freq=SLOW):
    def pin(n):
        return Pin(n, Pin.IN, Pin.PULL_UP)

    i2c = I2C(sda=pin(sda), scl=pin(scl), freq=freq)
    return am2320.AM2320(i2c)


sensor = setupSensor()


def get_temperature(request):
    try:
        sensor.measure()
        return JsonResponse(
            {
                "temperature": sensor.temperature(),
                "humidity": sensor.humidity(),
            }
        )
    except Exception as e:
        return HTMLErrorResponse(message=str(type(e)), description=e)
