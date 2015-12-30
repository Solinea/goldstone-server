# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0005_auto_20151227_2046'),
    ]

    operations = [
        migrations.AddField(
            model_name='savedsearch',
            name='last_end',
            field=models.DateTimeField(null=True, blank=True),
        ),
        migrations.AddField(
            model_name='savedsearch',
            name='last_start',
            field=models.DateTimeField(null=True, blank=True),
        ),
        migrations.AddField(
            model_name='savedsearch',
            name='target_interval',
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name='savedsearch',
            name='timestamp_field',
            field=models.CharField(max_length=64, null=True),
        ),
    ]
