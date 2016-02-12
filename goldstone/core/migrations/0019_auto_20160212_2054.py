# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0018_auto_20160129_1916'),
    ]

    operations = [
        migrations.AlterField(
            model_name='savedsearch',
            name='doc_type',
            field=models.CharField(default=None, max_length=64, null=True, blank=True),
        ),
    ]
