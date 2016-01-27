# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0008_auto_20160115_2046'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='alert',
            name='description',
        ),
        migrations.AddField(
            model_name='emailproducer',
            name='default_sender',
            field=models.CharField(default=b'root@localhost', max_length=64),
        ),
        migrations.AlterField(
            model_name='alert',
            name='msg_title',
            field=models.CharField(default=b'Alert notification', max_length=256),
        ),
        migrations.AlterField(
            model_name='emailproducer',
            name='receiver',
            field=models.EmailField(max_length=128, null=True),
        ),
    ]
