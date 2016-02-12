# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0019_auto_20160212_2054'),
    ]

    operations = [
        migrations.AddField(
            model_name='savedsearch',
            name='hidden',
            field=models.BooleanField(default=False, help_text=b'True if this search should not bepresented via the view'),
        ),
    ]
