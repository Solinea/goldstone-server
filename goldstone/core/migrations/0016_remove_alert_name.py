# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0015_auto_20160123_1537'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='alert',
            name='name',
        ),
    ]
