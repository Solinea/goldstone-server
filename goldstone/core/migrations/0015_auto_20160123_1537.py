# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0014_auto_20160123_1510'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='alertsearch',
            name='my_name',
        ),
        migrations.RemoveField(
            model_name='savedsearch',
            name='test_name',
        ),
    ]
