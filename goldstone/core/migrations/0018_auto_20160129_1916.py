# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models
import django_extensions.db.fields


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0017_auto_20160129_1900'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='alert',
            name='id',
        ),
        migrations.AddField(
            model_name='alert',
            name='uuid',
            field=django_extensions.db.fields.UUIDField(primary_key=True, default='95df1cff-9b1a-4e6f-8ad4-9fc9dec08489', serialize=False, editable=False, blank=True),
            preserve_default=False,
        ),
    ]
