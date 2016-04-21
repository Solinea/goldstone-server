# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models
import django.db.models.deletion
import goldstone.utils
import django.utils.timezone
import django_extensions.db.fields


class Migration(migrations.Migration):

    dependencies = [
        ('contenttypes', '0002_remove_content_type_name'),
    ]

    operations = [
        migrations.CreateModel(
            name='Alert',
            fields=[
                ('uuid', django_extensions.db.fields.UUIDField(serialize=False, editable=False, primary_key=True, blank=True)),
                ('short_message', models.TextField()),
                ('long_message', models.TextField()),
                ('created', django_extensions.db.fields.CreationDateTimeField(auto_now_add=True, null=True)),
                ('created_ts', models.DecimalField(default=goldstone.utils.now_micro_ts, editable=False, max_digits=13, decimal_places=0)),
                ('updated', django_extensions.db.fields.ModificationDateTimeField(auto_now=True, null=True)),
            ],
            options={
                'ordering': ['-created'],
            },
        ),
        migrations.CreateModel(
            name='AlertDefinition',
            fields=[
                ('uuid', django_extensions.db.fields.UUIDField(serialize=False, editable=False, primary_key=True, blank=True)),
                ('name', models.CharField(max_length=64)),
                ('description', models.CharField(max_length=1024, null=True, blank=True)),
                ('short_template', models.TextField(default=b"Alert: '{{_alert_def_name}}' triggered at {{_end_time}}")),
                ('long_template', models.TextField(default=b"There were {{_search_hits}} instances of '{{_alert_def_name}}' from {{_start_time}} to {{_end_time}}.\nAlert Definition: {{_alert_def_id}}")),
                ('enabled', models.BooleanField(default=True)),
                ('created', django_extensions.db.fields.CreationDateTimeField(auto_now_add=True, null=True)),
                ('updated', django_extensions.db.fields.ModificationDateTimeField(auto_now=True, null=True)),
            ],
            options={
                'ordering': ['-created'],
            },
        ),
        migrations.CreateModel(
            name='MonitoredService',
            fields=[
                ('uuid', django_extensions.db.fields.UUIDField(serialize=False, editable=False, primary_key=True, blank=True)),
                ('name', models.CharField(max_length=128, editable=False)),
                ('host', models.CharField(max_length=128, editable=False)),
                ('state', models.CharField(default=b'UNKNOWN', max_length=64, choices=[(b'UP', b'UP'), (b'DOWN', b'DOWN'), (b'UNKNOWN', b'UNKNOWN'), (b'MAINTENANCE', b'MAINTENANCE')])),
                ('created', django_extensions.db.fields.CreationDateTimeField(auto_now_add=True)),
                ('updated', django_extensions.db.fields.ModificationDateTimeField(auto_now=True)),
            ],
            options={
                'ordering': ['-updated'],
            },
        ),
        migrations.CreateModel(
            name='Producer',
            fields=[
                ('uuid', django_extensions.db.fields.UUIDField(serialize=False, editable=False, primary_key=True, blank=True)),
                ('created', django_extensions.db.fields.CreationDateTimeField(auto_now_add=True, null=True)),
                ('updated', django_extensions.db.fields.ModificationDateTimeField(auto_now=True, null=True)),
            ],
            options={
                'ordering': ['-created'],
            },
        ),
        migrations.CreateModel(
            name='SavedSearch',
            fields=[
                ('uuid', django_extensions.db.fields.UUIDField(serialize=False, editable=False, primary_key=True, blank=True)),
                ('name', models.CharField(max_length=64)),
                ('owner', models.CharField(max_length=64)),
                ('description', models.CharField(max_length=1024, null=True, blank=True)),
                ('query', models.TextField(help_text=b'JSON Elasticsearch query body')),
                ('protected', models.BooleanField(default=False, help_text=b'True if this is system-defined')),
                ('hidden', models.BooleanField(default=False, help_text=b'True if this search should not be presented via the view')),
                ('viewer_enabled', models.BooleanField(default=True, help_text=b'True if this search should be displayed in the client UI')),
                ('index_prefix', models.CharField(max_length=64)),
                ('doc_type', models.CharField(default=None, max_length=64, null=True, blank=True)),
                ('timestamp_field', models.CharField(max_length=64, null=True)),
                ('last_start', models.DateTimeField(default=django.utils.timezone.now)),
                ('last_end', models.DateTimeField(default=django.utils.timezone.now)),
                ('target_interval', models.IntegerField(default=0)),
                ('created', django_extensions.db.fields.CreationDateTimeField(auto_now_add=True, null=True)),
                ('updated', django_extensions.db.fields.ModificationDateTimeField(auto_now=True, null=True)),
            ],
            options={
                'verbose_name_plural': 'saved searches',
            },
        ),
        migrations.CreateModel(
            name='EmailProducer',
            fields=[
                ('producer_ptr', models.OneToOneField(parent_link=True, auto_created=True, primary_key=True, serialize=False, to='core.Producer')),
                ('sender', models.EmailField(default=b'root@localhost', max_length=128)),
                ('receiver', models.EmailField(max_length=128)),
            ],
            options={
                'abstract': False,
            },
            bases=('core.producer',),
        ),
        migrations.AlterUniqueTogether(
            name='savedsearch',
            unique_together=set([('name', 'owner')]),
        ),
        migrations.AddField(
            model_name='producer',
            name='alert_def',
            field=models.ForeignKey(to='core.AlertDefinition'),
        ),
        migrations.AddField(
            model_name='producer',
            name='polymorphic_ctype',
            field=models.ForeignKey(related_name='polymorphic_core.producer_set+', editable=False, to='contenttypes.ContentType', null=True),
        ),
        migrations.AddField(
            model_name='alertdefinition',
            name='search',
            field=models.ForeignKey(editable=False, to='core.SavedSearch'),
        ),
        migrations.AddField(
            model_name='alert',
            name='alert_def',
            field=models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, editable=False, to='core.AlertDefinition'),
        ),
    ]
