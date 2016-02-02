# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0016_remove_alert_name'),
    ]

    operations = [
        migrations.AlterField(
            model_name='savedsearch',
            name='description',
            field=models.CharField(default=b'', max_length=1024, blank=True),
        ),
    ]
