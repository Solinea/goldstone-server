# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0002_savedsearch_viewer_enabled'),
    ]

    operations = [
        migrations.AlterField(
            model_name='savedsearch',
            name='hidden',
            field=models.BooleanField(default=False, help_text=b'True if this search should not be presented via the view'),
        ),
    ]
