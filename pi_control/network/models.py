from django.db import models


class Entry(models.Model):
    time = models.DateTimeField(auto_now_add=True, verbose_name='Measurment time.')
    ping = models.FloatField(verbose_name='Ping time (ms).', null=True)

    class Meta:
        verbose_name = 'network status entry'
        verbose_name_plural = 'network status entries'

    def __str__(self):
        return '{}: {}ms'.format(self.time, self.ping)
