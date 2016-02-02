# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models
import django_extensions.db.fields


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0007_auto_20160112_1536'),
    ]

    operations = [
        migrations.CreateModel(
            name='Alert',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('name', models.CharField(default=b'generic-alert', max_length=64)),
                ('description', models.CharField(default=b'Alert object instance', max_length=1024)),
                ('owner', models.CharField(default=b'goldstone', help_text=b'alert assignee, individual entity', max_length=64)),
                ('msg_title', models.CharField(default=b'Alert notification', max_length=64)),
                ('msg_body', models.CharField(default=b'This is an alert notification', max_length=1024)),
                ('created', django_extensions.db.fields.CreationDateTimeField(auto_now_add=True)),
                ('query', models.ForeignKey(to='core.AlertSearch')),
            ],
        ),
        migrations.RemoveField(
            model_name='alertobj',
            name='trigger',
        ),
        migrations.RemoveField(
            model_name='emailproducer',
            name='from_address',
        ),
        migrations.RemoveField(
            model_name='emailproducer',
            name='message',
        ),
        migrations.RemoveField(
            model_name='emailproducer',
            name='subject',
        ),
        migrations.RemoveField(
            model_name='emailproducer',
            name='to_address',
        ),
        migrations.AddField(
            model_name='emailproducer',
            name='query',
            field=models.ForeignKey(default=1, to='core.AlertSearch'),
        ),
        migrations.AddField(
            model_name='emailproducer',
            name='receiver',
            field=models.CharField(default=b'goldstone', help_text=b'single destination or mailer', max_length=64),
        ),
        migrations.AddField(
            model_name='emailproducer',
            name='sender',
            field=models.CharField(default=b'goldstone', max_length=64),
        ),
        migrations.DeleteModel(
            name='AlertObj',
        ),
    ]
