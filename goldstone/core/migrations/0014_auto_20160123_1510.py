# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0013_auto_20160123_0513'),
    ]

    operations = [
        migrations.AddField(
            model_name='alertsearch',
            name='my_name',
            field=models.CharField(default=b'test', max_length=64),
        ),
        migrations.AddField(
            model_name='savedsearch',
            name='test_name',
            field=models.CharField(default=b'test', max_length=64),
        ),
    ]
