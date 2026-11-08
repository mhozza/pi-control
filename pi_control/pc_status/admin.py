from django import forms
from django.contrib import admin

from pc_status.models import Pc


class PcAdminForm(forms.ModelForm):
    class Meta:
        model = Pc
        fields = "__all__"
        widgets = {
            "secret": forms.PasswordInput(render_value=True),
        }


@admin.register(Pc)
class PcAdmin(admin.ModelAdmin):
    form = PcAdminForm
    list_display = ("id", "ip_address", "mac_address", "ssh_port", "control_port")
