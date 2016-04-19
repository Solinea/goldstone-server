# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='savedsearch',
            name='viewer_enabled',
            field=models.BooleanField(default=True, help_text=b'True if this search should be presented via the view'),
        ),
    ]
