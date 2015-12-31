# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models
import django_extensions.db.fields


class Migration(migrations.Migration):

    dependencies = [
        ('addons', '0001_initial'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='addon',
            name='installed_date',
        ),
        migrations.RemoveField(
            model_name='addon',
            name='updated_date',
        ),
        migrations.AddField(
            model_name='addon',
            name='updated',
            field=django_extensions.db.fields.ModificationDateTimeField(auto_now=True, null=True),
        ),
    ]
