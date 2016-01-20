# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0010_auto_20160119_2258'),
    ]

    operations = [
        migrations.AlterField(
            model_name='emailproducer',
            name='default_sender',
            field=models.CharField(default=b'root@localhost', max_length=64),
        ),
        migrations.AlterField(
            model_name='emailproducer',
            name='receiver',
            field=models.EmailField(max_length=128, null=True),
        ),
        migrations.AlterField(
            model_name='emailproducer',
            name='sender',
            field=models.CharField(default=b'goldstone-bot@solinea.com', max_length=64),
        ),
    ]
