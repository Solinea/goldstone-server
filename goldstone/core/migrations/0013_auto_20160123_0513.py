# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0012_auto_20160122_2206'),
    ]

    operations = [
        migrations.AlterField(
            model_name='emailproducer',
            name='receiver',
            field=models.EmailField(max_length=128),
        ),
    ]
