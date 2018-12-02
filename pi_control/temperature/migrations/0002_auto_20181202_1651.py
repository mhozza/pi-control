# Generated by Django 2.1.2 on 2018-12-02 16:51

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('temperature', '0001_squashed_0007_auto_20181125_2259'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='room',
            name='devices',
        ),
        migrations.AddField(
            model_name='measurementdevice',
            name='room',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, to='temperature.Room'),
        ),
        migrations.AddField(
            model_name='room',
            name='humidity_high',
            field=models.FloatField(default=50, verbose_name='highest comfortable humidity'),
        ),
        migrations.AddField(
            model_name='room',
            name='humidity_low',
            field=models.FloatField(default=30, verbose_name='lowest comfortable humidity'),
        ),
        migrations.AddField(
            model_name='room',
            name='temperature_high',
            field=models.FloatField(default=25, verbose_name='highest comfortable temperature'),
        ),
        migrations.AddField(
            model_name='room',
            name='temperature_low',
            field=models.FloatField(default=21, verbose_name='lowest comfortable temperature'),
        ),
    ]
