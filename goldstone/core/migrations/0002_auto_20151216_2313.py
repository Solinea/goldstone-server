# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models
import django_extensions.db.fields


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='SavedSearch',
            fields=[
                ('uuid', django_extensions.db.fields.UUIDField(primary_key=True, serialize=False, editable=False, version=1, blank=True)),
                ('name', models.CharField(max_length=64)),
                ('owner', models.CharField(max_length=64)),
                ('description', models.CharField(default=b'Defined Search', max_length=1024)),
                ('query', models.TextField(help_text=b'YAML Elasticsearch query body')),
                ('protected', models.BooleanField(default=False, help_text=b'True if this is system-defined')),
                ('created', django_extensions.db.fields.CreationDateTimeField(auto_now_add=True)),
                ('updated', django_extensions.db.fields.ModificationDateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name_plural': 'saved searches',
            },
        ),
        migrations.CreateModel(
            name='AlertQueryDef',
            fields=[
                ('savedsearch_ptr', models.OneToOneField(parent_link=True, auto_created=True, primary_key=True, serialize=False, to='core.SavedSearch')),
            ],
            bases=('core.savedsearch',),
        ),
        migrations.CreateModel(
            name='EventQueryDef',
            fields=[
                ('savedsearch_ptr', models.OneToOneField(parent_link=True, auto_created=True, primary_key=True, serialize=False, to='core.SavedSearch')),
            ],
            bases=('core.savedsearch',),
        ),
        migrations.AlterUniqueTogether(
            name='savedsearch',
            unique_together=set([('name', 'owner')]),
        ),
    ]
