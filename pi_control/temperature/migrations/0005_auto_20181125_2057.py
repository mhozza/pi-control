# Generated by Django 2.1.2 on 2018-11-25 20:57

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('temperature', '0004_measurementdevice_room'),
    ]

    operations = [
        migrations.AlterField(
            model_name='entry',
            name='device_id',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='temperature.MeasurementDevice'),
        ),
    ]