import logging
from django.conf import settings
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from random import randint
from rest_framework import generics
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .measure import measure_temperature_and_humidity
from .models import Entry, MeasurementDevice
from .serializers import EntrySerializer

HUMIDITY_HIGH = 50
HUMIDITY_LOW = 30
TEMPERATURE_HIGH = 25
TEMPERATURE_LOW = 22

logger = logging.getLogger(__name__)


@api_view(['GET'])
def get_temperature_and_humidity(request):
    now = timezone.now()
    device_id = request.GET.get('device')
    try:
        device = MeasurementDevice.objects.get(pk=device_id)
    except MeasurementDevice.DoesNotExist:
        device = None
    try:
        temperature, humidity = measure_temperature_and_humidity(device)
    except Exception as e:
        logger.error('Cannot read from temperature sensor! {}'.format(e))
        if not settings.DEBUG:
            raise e
        temperature, humidity = randint(17, 30), randint(20, 70)

    return Response({
        'time': now,
        'device': device_id,
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


class TemperatureListView(generics.ListAPIView):
    serializer_class = EntrySerializer

    def get_queryset(self):
        try:
            time_from = parse_datetime(self.kwargs['from'])
        except KeyError:
            time_from = timezone.now() - timezone.timedelta(days=1)

        try:
            time_to = parse_datetime(self.kwargs['to'])
        except KeyError:
            time_to = timezone.now()
        queryset = Entry.objects.filter(time__range=(time_from, time_to))
        if 'device' in self.kwargs:
            queryset = queryset.filter(device=self.kwargs['device'])
        return queryset
