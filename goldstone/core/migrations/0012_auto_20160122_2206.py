# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0011_auto_20160120_1900'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='emailproducer',
            name='default_sender',
        ),
        migrations.AlterField(
            model_name='emailproducer',
            name='query',
            field=models.ForeignKey(to='core.AlertSearch'),
        ),
        migrations.AlterField(
            model_name='emailproducer',
            name='sender',
            field=models.CharField(default=None, max_length=64),
        ),
    ]
