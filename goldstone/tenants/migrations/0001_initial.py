# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models
import django_extensions.db.fields


class Migration(migrations.Migration):

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Cloud',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('tenant_name', models.CharField(max_length=60)),
                ('username', models.CharField(max_length=60)),
                ('password', models.CharField(max_length=60)),
                ('auth_url', models.CharField(max_length=80)),
                ('uuid', django_extensions.db.fields.UUIDField(editable=False, blank=True)),
            ],
        ),
        migrations.CreateModel(
            name='Tenant',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('name', models.CharField(unique=True, max_length=80)),
                ('owner', models.CharField(help_text=b"The name of the tenant's owner", max_length=80)),
                ('owner_contact', models.TextField(help_text=b"The owner's contact information", blank=True)),
                ('uuid', django_extensions.db.fields.UUIDField(editable=False, blank=True)),
            ],
        ),
        migrations.AddField(
            model_name='cloud',
            name='tenant',
            field=models.ForeignKey(to='tenants.Tenant'),
        ),
        migrations.AlterUniqueTogether(
            name='cloud',
            unique_together=set([('tenant_name', 'username', 'tenant')]),
        ),
    ]
