import logging
from django.conf import settings
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from random import randint
from rest_framework import generics
from rest_framework.decorators import api_view
from rest_framework.response import Response

from temperature.constants import (DEFAULT_DEVICE, DEFAULT_HUMIDITY_HIGH, DEFAULT_HUMIDITY_LOW,
                                   DEFAULT_TEMPERATURE_HIGH, DEFAULT_TEMPERATURE_LOW)
from .measure import measure_temperature_and_humidity
from .models import Entry, MeasurementDevice, Room
from .serializers import EntrySerializer, MeasurementDeviceSerializer, RoomSerializer

logger = logging.getLogger(__name__)


@api_view(['GET'])
def get_temperature_and_humidity(request):
    now = timezone.now()
    device_id = request.GET.get('device', DEFAULT_DEVICE)

    temperature_low = DEFAULT_TEMPERATURE_LOW
    temperature_high = DEFAULT_TEMPERATURE_HIGH
    humidity_low = DEFAULT_HUMIDITY_LOW
    humidity_high = DEFAULT_HUMIDITY_HIGH

    try:
        device = MeasurementDevice.objects.get(pk=device_id)
        if device.room:
            temperature_low = device.room.temperature_low
            temperature_high = device.room.temperature_high
            humidity_low = device.room.humidity_low
            humidity_high = device.room.humidity_high
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
            'high': temperature_high,
            'low': temperature_low,
        },
        'humidity': {
            'value': humidity,
            'high': humidity_high,
            'low': humidity_low,
        },
    })


@api_view(['GET'])
def get_room_temperature_and_humidity(request, room_id):
    room = get_object_or_404(Room, pk=room_id)

    now = timezone.now()
    temperature_low = room.temperature_low
    temperature_high = room.temperature_high
    humidity_low = room.humidity_low
    humidity_high = room.humidity_high

    measurements = []

    for device in room.devices.active():
        try:
            temperature, humidity = measure_temperature_and_humidity(device)
        except Exception as e:
            logger.error('Cannot read from temperature sensor! {}'.format(e))
            if not settings.DEBUG:
                raise e
            temperature, humidity = randint(17, 30), randint(20, 70)
        measurements.append({
            'device': device.id,
            'device_name': device.name,
            'temperature': temperature,
            'humidity': humidity,
        })

    if measurements:
        avg_temperature = sum(map(lambda m: m['temperature'], measurements)) / len(measurements)
        avg_humidity = sum(map(lambda m: m['humidity'], measurements)) / len(measurements)

        return Response({
            'time': now,
            'room': room.id,
            'temperature': {
                'value': avg_temperature,
                'high': temperature_high,
                'low': temperature_low,
            },
            'humidity': {
                'value': avg_humidity,
                'high': humidity_high,
                'low': humidity_low,
            },
            'devices': measurements
        })
    else:
        return Response(status=204)


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
        return Entry.objects.filter(time__range=(time_from, time_to),
                                    device=self.request.GET.get('device', DEFAULT_DEVICE)).order_by('time')


class MeasurementDeviceListView(generics.ListAPIView):
    serializer_class = MeasurementDeviceSerializer
    queryset = MeasurementDevice.objects.active()


class RoomListView(generics.ListAPIView):
    serializer_class = RoomSerializer
    queryset = Room.objects.non_empty()
