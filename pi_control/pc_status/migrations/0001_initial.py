# Generated by Django 2.2.2 on 2019-07-12 13:50

from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="Pc",
            fields=[
                (
                    "id",
                    models.CharField(
                        max_length=100, primary_key=True, serialize=False, verbose_name="pc ID"
                    ),
                ),
                (
                    "ip_address",
                    models.GenericIPAddressField(protocol="IPv4", verbose_name="IP address"),
                ),
                ("mac_address", models.CharField(max_length=17, verbose_name="Mac address")),
                ("control_port", models.IntegerField(default=8001, verbose_name="control port")),
                ("ssh_port", models.IntegerField(default=22, verbose_name="ssh port")),
                ("secret", models.CharField(max_length=100, verbose_name="secret control key")),
            ],
        )
    ]
