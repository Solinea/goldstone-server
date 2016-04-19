# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0003_auto_20160419_1615'),
    ]

    operations = [
        migrations.AlterField(
            model_name='savedsearch',
            name='viewer_enabled',
            field=models.BooleanField(default=True, help_text=b'True if this search should bedisplayed in the client UI'),
        ),
    ]
