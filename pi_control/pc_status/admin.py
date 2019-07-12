from django.contrib import admin

from pc_status.models import Pc


@admin.register(Pc)
class PcAdmin(admin.ModelAdmin):
    list_display = ("id", "ip_address", "mac_address", "ssh_port", "control_port")
