# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models
import django_extensions.db.fields


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0004_auto_20151217_1844'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='alertquerydef',
            name='savedsearch_ptr',
        ),
        migrations.RemoveField(
            model_name='eventquerydef',
            name='savedsearch_ptr',
        ),
        migrations.AddField(
            model_name='savedsearch',
            name='doc_type',
            field=models.CharField(default='syslog', max_length=64),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='savedsearch',
            name='index_prefix',
            field=models.CharField(default='logstash-*', max_length=64),
            preserve_default=False,
        ),
        migrations.AlterField(
            model_name='savedsearch',
            name='query',
            field=models.TextField(help_text=b'JSON Elasticsearch query body'),
        ),
        migrations.AlterField(
            model_name='savedsearch',
            name='uuid',
            field=django_extensions.db.fields.UUIDField(serialize=False, editable=False, primary_key=True, blank=True),
        ),
        migrations.DeleteModel(
            name='AlertQueryDef',
        ),
        migrations.DeleteModel(
            name='EventQueryDef',
        ),
    ]
