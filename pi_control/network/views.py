from django.utils import timezone
from django.utils.dateparse import parse_datetime
from rest_framework import generics
from rest_framework.exceptions import ValidationError

from .models import Entry
from .serializers import EntrySerializer


def parse_datetime_param(raw_value, default_factory):
    if not raw_value:
        return default_factory()
    try:
        parsed = parse_datetime(raw_value)
        if parsed is None and " " in raw_value:
            parsed = parse_datetime(raw_value.replace(" ", "+"))
    except (ValueError, TypeError):
        raise ValidationError("Invalid datetime format.")
    if parsed is None:
        raise ValidationError("Invalid datetime format.")
    return parsed


class NetworkStatusListView(generics.ListAPIView):
    serializer_class = EntrySerializer

    def get_queryset(self):
        raw_from = self.kwargs.get("from") or self.request.query_params.get("from")
        raw_to = self.kwargs.get("to") or self.request.query_params.get("to")

        time_from = parse_datetime_param(
            raw_from,
            lambda: timezone.now() - timezone.timedelta(days=1),
        )
        time_to = parse_datetime_param(
            raw_to,
            timezone.now,
        )
        return Entry.objects.filter(time__range=(time_from, time_to)).order_by("time")
