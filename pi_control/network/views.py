from django.utils import timezone
from django.utils.dateparse import parse_datetime
from rest_framework import generics

from .models import Entry
from .serializers import EntrySerializer


class NetworkStatusListView(generics.ListAPIView):
    serializer_class = EntrySerializer

    def get_queryset(self):
        try:
            time_from = parse_datetime(self.kwargs["from"])
        except:
            time_from = timezone.now() - timezone.timedelta(days=1)

        try:
            time_to = parse_datetime(self.kwargs["to"])
        except:
            time_to = timezone.now()
        return Entry.objects.filter(time__range=(time_from, time_to))
