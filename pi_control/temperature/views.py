from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.conf import settings
from django.utils import timezone


from .measure import measure_temperature_and_humidity


@api_view(['GET'])
def get_temperature_and_humidity(request):
    now = timezone.now()
    temperature, humidity = measure_temperature_and_humidity(settings.DEBUG)
    return Response({
        'time': now,
        'temperature': temperature,
        'humidity': humidity,
    })
