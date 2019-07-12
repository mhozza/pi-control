from django.db import models


class Pc(models.Model):
    id = models.CharField(primary_key=True, max_length=100, verbose_name="pc ID")
    ip_address = models.GenericIPAddressField(protocol="IPv4", verbose_name="IP address")
    mac_address = models.CharField(max_length=17, verbose_name="Mac address")
    control_port = models.IntegerField(default=8001, verbose_name="control port")
    ssh_port = models.IntegerField(default=22, verbose_name="ssh port")
    secret = models.CharField(max_length=100, verbose_name="secret control key")
