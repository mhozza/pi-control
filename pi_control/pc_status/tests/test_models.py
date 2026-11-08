from django import forms
from django.contrib import admin
from django.test import TestCase

from pc_status.admin import PcAdmin, PcAdminForm
from pc_status.models import Pc


class PcModelsTestCase(TestCase):
    def test_pc_creation_and_defaults(self):
        pc = Pc.objects.create(
            id="desktop-1",
            ip_address="192.168.1.100",
            mac_address="AA:BB:CC:DD:EE:FF",
            secret="mysecretkey",
        )
        self.assertEqual(pc.id, "desktop-1")
        self.assertEqual(pc.ip_address, "192.168.1.100")
        self.assertEqual(pc.mac_address, "AA:BB:CC:DD:EE:FF")
        self.assertEqual(pc.control_port, 8001)
        self.assertEqual(pc.ssh_port, 22)
        self.assertEqual(pc.secret, "mysecretkey")

    def test_admin_registered(self):
        self.assertIn(Pc, admin.site._registry)
        self.assertIsInstance(admin.site._registry[Pc], PcAdmin)
        self.assertEqual(
            admin.site._registry[Pc].list_display,
            ("id", "ip_address", "mac_address", "ssh_port", "control_port"),
        )

    def test_admin_secret_field_uses_password_input(self):
        pc_admin = admin.site._registry[Pc]
        self.assertIs(pc_admin.form, PcAdminForm)
        form_class = pc_admin.get_form(None)
        form = form_class()
        widget = form.fields["secret"].widget
        self.assertIsInstance(widget, forms.PasswordInput)
        self.assertTrue(widget.render_value)

