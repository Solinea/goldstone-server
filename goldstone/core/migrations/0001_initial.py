# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models
import django.db.models.deletion
import goldstone.utils
import django.utils.timezone
import django_extensions.db.fields
import picklefield.fields


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
            name='PolyResource',
            fields=[
                ('uuid', django_extensions.db.fields.UUIDField(primary_key=True, serialize=False, editable=False, version=1, blank=True)),
                ('native_id', models.CharField(max_length=128)),
                ('native_name', models.CharField(max_length=64)),
                ('edges', picklefield.fields.PickledObjectField(default=[], editable=False)),
                ('cloud_attributes', picklefield.fields.PickledObjectField(default={}, editable=False)),
                ('created', django_extensions.db.fields.CreationDateTimeField(auto_now_add=True)),
                ('updated', django_extensions.db.fields.ModificationDateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': 'polyresource',
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
                ('hidden', models.BooleanField(default=False, help_text=b'True if this search should not bepresented via the view')),
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
            name='Addon',
            fields=[
                ('polyresource_ptr', models.OneToOneField(parent_link=True, auto_created=True, primary_key=True, serialize=False, to='core.PolyResource')),
            ],
            options={
                'abstract': False,
            },
            bases=('core.polyresource',),
        ),
        migrations.CreateModel(
            name='Aggregate',
            fields=[
                ('polyresource_ptr', models.OneToOneField(parent_link=True, auto_created=True, primary_key=True, serialize=False, to='core.PolyResource')),
            ],
            options={
                'abstract': False,
            },
            bases=('core.polyresource',),
        ),
        migrations.CreateModel(
            name='AvailabilityZone',
            fields=[
                ('polyresource_ptr', models.OneToOneField(parent_link=True, auto_created=True, primary_key=True, serialize=False, to='core.PolyResource')),
            ],
            options={
                'abstract': False,
            },
            bases=('core.polyresource',),
        ),
        migrations.CreateModel(
            name='Cinder',
            fields=[
                ('polyresource_ptr', models.OneToOneField(parent_link=True, auto_created=True, primary_key=True, serialize=False, to='core.PolyResource')),
            ],
            options={
                'abstract': False,
            },
            bases=('core.polyresource',),
        ),
        migrations.CreateModel(
            name='Cloudpipe',
            fields=[
                ('polyresource_ptr', models.OneToOneField(parent_link=True, auto_created=True, primary_key=True, serialize=False, to='core.PolyResource')),
            ],
            options={
                'abstract': False,
            },
            bases=('core.polyresource',),
        ),
        migrations.CreateModel(
            name='Credential',
            fields=[
                ('polyresource_ptr', models.OneToOneField(parent_link=True, auto_created=True, primary_key=True, serialize=False, to='core.PolyResource')),
            ],
            options={
                'abstract': False,
            },
            bases=('core.polyresource',),
        ),
        migrations.CreateModel(
            name='Domain',
            fields=[
                ('polyresource_ptr', models.OneToOneField(parent_link=True, auto_created=True, primary_key=True, serialize=False, to='core.PolyResource')),
            ],
            options={
                'abstract': False,
            },
            bases=('core.polyresource',),
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
        migrations.CreateModel(
            name='Endpoint',
            fields=[
                ('polyresource_ptr', models.OneToOneField(parent_link=True, auto_created=True, primary_key=True, serialize=False, to='core.PolyResource')),
            ],
            options={
                'abstract': False,
            },
            bases=('core.polyresource',),
        ),
        migrations.CreateModel(
            name='Flavor',
            fields=[
                ('polyresource_ptr', models.OneToOneField(parent_link=True, auto_created=True, primary_key=True, serialize=False, to='core.PolyResource')),
            ],
            options={
                'abstract': False,
            },
            bases=('core.polyresource',),
        ),
        migrations.CreateModel(
            name='Glance',
            fields=[
                ('polyresource_ptr', models.OneToOneField(parent_link=True, auto_created=True, primary_key=True, serialize=False, to='core.PolyResource')),
            ],
            options={
                'abstract': False,
            },
            bases=('core.polyresource',),
        ),
        migrations.CreateModel(
            name='Group',
            fields=[
                ('polyresource_ptr', models.OneToOneField(parent_link=True, auto_created=True, primary_key=True, serialize=False, to='core.PolyResource')),
            ],
            options={
                'abstract': False,
            },
            bases=('core.polyresource',),
        ),
        migrations.CreateModel(
            name='Host',
            fields=[
                ('polyresource_ptr', models.OneToOneField(parent_link=True, auto_created=True, primary_key=True, serialize=False, to='core.PolyResource')),
                ('fqdn', models.CharField(help_text=b'A fully-qualified domain name', unique=True, max_length=255)),
            ],
            options={
                'abstract': False,
            },
            bases=('core.polyresource',),
        ),
        migrations.CreateModel(
            name='Hypervisor',
            fields=[
                ('polyresource_ptr', models.OneToOneField(parent_link=True, auto_created=True, primary_key=True, serialize=False, to='core.PolyResource')),
                ('virt_cpus', models.IntegerField(default=8, blank=True)),
                ('memory', models.IntegerField(default=8192, blank=True)),
            ],
            options={
                'abstract': False,
            },
            bases=('core.polyresource',),
        ),
        migrations.CreateModel(
            name='Image',
            fields=[
                ('polyresource_ptr', models.OneToOneField(parent_link=True, auto_created=True, primary_key=True, serialize=False, to='core.PolyResource')),
            ],
            options={
                'abstract': False,
            },
            bases=('core.polyresource',),
        ),
        migrations.CreateModel(
            name='Interface',
            fields=[
                ('polyresource_ptr', models.OneToOneField(parent_link=True, auto_created=True, primary_key=True, serialize=False, to='core.PolyResource')),
            ],
            options={
                'abstract': False,
            },
            bases=('core.polyresource',),
        ),
        migrations.CreateModel(
            name='Keypair',
            fields=[
                ('polyresource_ptr', models.OneToOneField(parent_link=True, auto_created=True, primary_key=True, serialize=False, to='core.PolyResource')),
            ],
            options={
                'abstract': False,
            },
            bases=('core.polyresource',),
        ),
        migrations.CreateModel(
            name='Keystone',
            fields=[
                ('polyresource_ptr', models.OneToOneField(parent_link=True, auto_created=True, primary_key=True, serialize=False, to='core.PolyResource')),
            ],
            options={
                'abstract': False,
            },
            bases=('core.polyresource',),
        ),
        migrations.CreateModel(
            name='Limits',
            fields=[
                ('polyresource_ptr', models.OneToOneField(parent_link=True, auto_created=True, primary_key=True, serialize=False, to='core.PolyResource')),
            ],
            options={
                'abstract': False,
            },
            bases=('core.polyresource',),
        ),
        migrations.CreateModel(
            name='Neutron',
            fields=[
                ('polyresource_ptr', models.OneToOneField(parent_link=True, auto_created=True, primary_key=True, serialize=False, to='core.PolyResource')),
            ],
            options={
                'abstract': False,
            },
            bases=('core.polyresource',),
        ),
        migrations.CreateModel(
            name='NeutronAgent',
            fields=[
                ('polyresource_ptr', models.OneToOneField(parent_link=True, auto_created=True, primary_key=True, serialize=False, to='core.PolyResource')),
            ],
            options={
                'abstract': False,
            },
            bases=('core.polyresource',),
        ),
        migrations.CreateModel(
            name='NeutronExtension',
            fields=[
                ('polyresource_ptr', models.OneToOneField(parent_link=True, auto_created=True, primary_key=True, serialize=False, to='core.PolyResource')),
            ],
            options={
                'abstract': False,
            },
            bases=('core.polyresource',),
        ),
        migrations.CreateModel(
            name='NeutronFloatingIP',
            fields=[
                ('polyresource_ptr', models.OneToOneField(parent_link=True, auto_created=True, primary_key=True, serialize=False, to='core.PolyResource')),
            ],
            options={
                'abstract': False,
            },
            bases=('core.polyresource',),
        ),
        migrations.CreateModel(
            name='NeutronNetwork',
            fields=[
                ('polyresource_ptr', models.OneToOneField(parent_link=True, auto_created=True, primary_key=True, serialize=False, to='core.PolyResource')),
            ],
            options={
                'abstract': False,
            },
            bases=('core.polyresource',),
        ),
        migrations.CreateModel(
            name='NeutronPort',
            fields=[
                ('polyresource_ptr', models.OneToOneField(parent_link=True, auto_created=True, primary_key=True, serialize=False, to='core.PolyResource')),
            ],
            options={
                'abstract': False,
            },
            bases=('core.polyresource',),
        ),
        migrations.CreateModel(
            name='NeutronQuota',
            fields=[
                ('polyresource_ptr', models.OneToOneField(parent_link=True, auto_created=True, primary_key=True, serialize=False, to='core.PolyResource')),
            ],
            options={
                'abstract': False,
            },
            bases=('core.polyresource',),
        ),
        migrations.CreateModel(
            name='NeutronRouter',
            fields=[
                ('polyresource_ptr', models.OneToOneField(parent_link=True, auto_created=True, primary_key=True, serialize=False, to='core.PolyResource')),
            ],
            options={
                'abstract': False,
            },
            bases=('core.polyresource',),
        ),
        migrations.CreateModel(
            name='NeutronSecurityGroup',
            fields=[
                ('polyresource_ptr', models.OneToOneField(parent_link=True, auto_created=True, primary_key=True, serialize=False, to='core.PolyResource')),
            ],
            options={
                'abstract': False,
            },
            bases=('core.polyresource',),
        ),
        migrations.CreateModel(
            name='NeutronSecurityGroupRule',
            fields=[
                ('polyresource_ptr', models.OneToOneField(parent_link=True, auto_created=True, primary_key=True, serialize=False, to='core.PolyResource')),
            ],
            options={
                'abstract': False,
            },
            bases=('core.polyresource',),
        ),
        migrations.CreateModel(
            name='NeutronSubnet',
            fields=[
                ('polyresource_ptr', models.OneToOneField(parent_link=True, auto_created=True, primary_key=True, serialize=False, to='core.PolyResource')),
            ],
            options={
                'abstract': False,
            },
            bases=('core.polyresource',),
        ),
        migrations.CreateModel(
            name='NeutronSubnetPool',
            fields=[
                ('polyresource_ptr', models.OneToOneField(parent_link=True, auto_created=True, primary_key=True, serialize=False, to='core.PolyResource')),
            ],
            options={
                'abstract': False,
            },
            bases=('core.polyresource',),
        ),
        migrations.CreateModel(
            name='Nova',
            fields=[
                ('polyresource_ptr', models.OneToOneField(parent_link=True, auto_created=True, primary_key=True, serialize=False, to='core.PolyResource')),
            ],
            options={
                'abstract': False,
            },
            bases=('core.polyresource',),
        ),
        migrations.CreateModel(
            name='NovaLimits',
            fields=[
                ('polyresource_ptr', models.OneToOneField(parent_link=True, auto_created=True, primary_key=True, serialize=False, to='core.PolyResource')),
            ],
            options={
                'abstract': False,
            },
            bases=('core.polyresource',),
        ),
        migrations.CreateModel(
            name='Project',
            fields=[
                ('polyresource_ptr', models.OneToOneField(parent_link=True, auto_created=True, primary_key=True, serialize=False, to='core.PolyResource')),
            ],
            options={
                'abstract': False,
            },
            bases=('core.polyresource',),
        ),
        migrations.CreateModel(
            name='QOSSpec',
            fields=[
                ('polyresource_ptr', models.OneToOneField(parent_link=True, auto_created=True, primary_key=True, serialize=False, to='core.PolyResource')),
            ],
            options={
                'abstract': False,
            },
            bases=('core.polyresource',),
        ),
        migrations.CreateModel(
            name='QuotaSet',
            fields=[
                ('polyresource_ptr', models.OneToOneField(parent_link=True, auto_created=True, primary_key=True, serialize=False, to='core.PolyResource')),
            ],
            options={
                'abstract': False,
            },
            bases=('core.polyresource',),
        ),
        migrations.CreateModel(
            name='Region',
            fields=[
                ('polyresource_ptr', models.OneToOneField(parent_link=True, auto_created=True, primary_key=True, serialize=False, to='core.PolyResource')),
            ],
            options={
                'abstract': False,
            },
            bases=('core.polyresource',),
        ),
        migrations.CreateModel(
            name='Role',
            fields=[
                ('polyresource_ptr', models.OneToOneField(parent_link=True, auto_created=True, primary_key=True, serialize=False, to='core.PolyResource')),
            ],
            options={
                'abstract': False,
            },
            bases=('core.polyresource',),
        ),
        migrations.CreateModel(
            name='Server',
            fields=[
                ('polyresource_ptr', models.OneToOneField(parent_link=True, auto_created=True, primary_key=True, serialize=False, to='core.PolyResource')),
            ],
            options={
                'abstract': False,
            },
            bases=('core.polyresource',),
        ),
        migrations.CreateModel(
            name='ServerGroup',
            fields=[
                ('polyresource_ptr', models.OneToOneField(parent_link=True, auto_created=True, primary_key=True, serialize=False, to='core.PolyResource')),
            ],
            options={
                'abstract': False,
            },
            bases=('core.polyresource',),
        ),
        migrations.CreateModel(
            name='Service',
            fields=[
                ('polyresource_ptr', models.OneToOneField(parent_link=True, auto_created=True, primary_key=True, serialize=False, to='core.PolyResource')),
            ],
            options={
                'abstract': False,
            },
            bases=('core.polyresource',),
        ),
        migrations.CreateModel(
            name='Snapshot',
            fields=[
                ('polyresource_ptr', models.OneToOneField(parent_link=True, auto_created=True, primary_key=True, serialize=False, to='core.PolyResource')),
            ],
            options={
                'abstract': False,
            },
            bases=('core.polyresource',),
        ),
        migrations.CreateModel(
            name='Token',
            fields=[
                ('polyresource_ptr', models.OneToOneField(parent_link=True, auto_created=True, primary_key=True, serialize=False, to='core.PolyResource')),
            ],
            options={
                'abstract': False,
            },
            bases=('core.polyresource',),
        ),
        migrations.CreateModel(
            name='Transfer',
            fields=[
                ('polyresource_ptr', models.OneToOneField(parent_link=True, auto_created=True, primary_key=True, serialize=False, to='core.PolyResource')),
            ],
            options={
                'abstract': False,
            },
            bases=('core.polyresource',),
        ),
        migrations.CreateModel(
            name='User',
            fields=[
                ('polyresource_ptr', models.OneToOneField(parent_link=True, auto_created=True, primary_key=True, serialize=False, to='core.PolyResource')),
            ],
            options={
                'abstract': False,
            },
            bases=('core.polyresource',),
        ),
        migrations.CreateModel(
            name='Volume',
            fields=[
                ('polyresource_ptr', models.OneToOneField(parent_link=True, auto_created=True, primary_key=True, serialize=False, to='core.PolyResource')),
            ],
            options={
                'abstract': False,
            },
            bases=('core.polyresource',),
        ),
        migrations.CreateModel(
            name='VolumeType',
            fields=[
                ('polyresource_ptr', models.OneToOneField(parent_link=True, auto_created=True, primary_key=True, serialize=False, to='core.PolyResource')),
            ],
            options={
                'abstract': False,
            },
            bases=('core.polyresource',),
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
            model_name='polyresource',
            name='polymorphic_ctype',
            field=models.ForeignKey(related_name='polymorphic_core.polyresource_set+', editable=False, to='contenttypes.ContentType', null=True),
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
