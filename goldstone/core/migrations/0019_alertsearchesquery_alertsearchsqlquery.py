# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0018_auto_20160129_1916'),
    ]

    operations = [
        migrations.CreateModel(
            name='AlertSearchESQuery',
            fields=[
                ('alertsearch_ptr', models.OneToOneField(parent_link=True, auto_created=True, primary_key=True, serialize=False, to='core.AlertSearch')),
            ],
            options={
                'verbose_name_plural': 'saved searches on ES-index with alerts',
            },
            bases=('core.alertsearch',),
        ),
        migrations.CreateModel(
            name='AlertSearchSQLQuery',
            fields=[
                ('alertsearch_ptr', models.OneToOneField(parent_link=True, auto_created=True, primary_key=True, serialize=False, to='core.AlertSearch')),
                ('db_table', models.CharField(default=b'compliance_vulnerability', help_text=b'database to be searched', max_length=64)),
                ('db_col_filter', models.CharField(default=b'created', help_text=b'db column filter', max_length=64)),
            ],
            options={
                'verbose_name_plural': 'saved searches on DB data with alerts',
            },
            bases=('core.alertsearch',),
        ),
    ]
