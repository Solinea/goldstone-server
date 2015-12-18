# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models
import django_extensions.db.fields


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0003_load_intial_data'),
    ]

    operations = [
        migrations.AlterField(
            model_name='savedsearch',
            name='created',
            field=django_extensions.db.fields.CreationDateTimeField(auto_now_add=True, null=True),
        ),
        migrations.AlterField(
            model_name='savedsearch',
            name='updated',
            field=django_extensions.db.fields.ModificationDateTimeField(auto_now=True, null=True),
        ),
    ]
