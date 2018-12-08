from rest_framework import serializers

from .models import Entry, MeasurementDevice


class EntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = Entry
        fields = ('time', 'temperature', 'humidity', 'device')


class MeasurementDeviceSerializer(serializers.ModelSerializer):
    class Meta:
        model = MeasurementDevice
        fields = ('id', 'name')


class RoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = MeasurementDevice
        fields = ('id', 'name')
