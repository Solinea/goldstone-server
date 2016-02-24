# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models
import django_extensions.db.fields


class Migration(migrations.Migration):

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Addon',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('name', models.CharField(unique=True, max_length=60)),
                ('version', models.CharField(help_text=b'Don\'t include a leading "V".', max_length=20)),
                ('manufacturer', models.CharField(max_length=80)),
                ('url_root', models.CharField(help_text=b"The urlconf is rooted here. Don't use leading or trailing slashes.", unique=True, max_length=40)),
                ('notes', models.TextField(help_text=b'Instructions, release notes, etc.', blank=True)),
                ('updated', django_extensions.db.fields.ModificationDateTimeField(auto_now=True, null=True)),
            ],
        ),
    ]
