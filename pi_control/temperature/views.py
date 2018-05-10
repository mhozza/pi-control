from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.conf import settings
from django.utils import timezone


from .measure import measure_temperature_and_humidity


HUMIDITY_HIGH = 50
HUMIDITY_LOW = 30
TEMPERATURE_HIGH = 25
TEMPERATURE_LOW = 22


@api_view(['GET'])
def get_temperature_and_humidity(request):
    now = timezone.now()
    temperature, humidity = measure_temperature_and_humidity(settings.DEBUG)
    return Response({
        'time': now,
        'temperature': {
            'value': temperature,
            'high': TEMPERATURE_HIGH,
            'low': TEMPERATURE_LOW,
        },
        'humidity': {
            'value': humidity,
            'high': HUMIDITY_HIGH,
            'low': HUMIDITY_LOW,
        },
    })
