# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models
import django_extensions.db.fields


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0006_auto_20151227_2226'),
    ]

    operations = [
        migrations.CreateModel(
            name='AlertObj',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('owner', models.CharField(default=b'goldstone', max_length=64)),
                ('description', models.CharField(default=b'Alert object instance', max_length=1024)),
                ('sender', models.CharField(default=b'goldstone', max_length=64)),
                ('receiver', models.CharField(default=b'goldstone', max_length=64)),
                ('subject', models.CharField(default=b'Alert notification', max_length=64)),
                ('message', models.CharField(default=b'This is an alert notification', max_length=1024)),
                ('created', django_extensions.db.fields.CreationDateTimeField(auto_now_add=True)),
                ('protected', models.BooleanField(default=False, help_text=b'True if this is system-defined')),
                ('ack_needed', models.BooleanField(default=False, help_text=b'True if alert needs ack')),
            ],
        ),
        migrations.CreateModel(
            name='AlertSearch',
            fields=[
                ('savedsearch_ptr', models.OneToOneField(parent_link=True, auto_created=True, primary_key=True, serialize=False, to='core.SavedSearch')),
            ],
            options={
                'verbose_name_plural': 'saved searches with alerts',
            },
            bases=('core.savedsearch',),
        ),
        migrations.CreateModel(
            name='EmailProducer',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('subject', models.CharField(default=b'Alert notification', max_length=64)),
                ('message', models.CharField(default=b'This is an alert notification', max_length=1024)),
                ('to_address', models.EmailField(max_length=70)),
                ('from_address', models.EmailField(max_length=70, blank=True)),
            ],
        ),
        migrations.AddField(
            model_name='alertobj',
            name='trigger',
            field=models.ForeignKey(to='core.AlertSearch'),
        ),
    ]
