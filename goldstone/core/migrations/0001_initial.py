# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models
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
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('owner', models.CharField(default=b'goldstone', help_text=b'alert assignee, individual entity', max_length=64)),
                ('msg_title', models.CharField(default=b'Alert notification', max_length=256)),
                ('msg_body', models.CharField(default=b'This is an alert notification', max_length=1024)),
                ('created', django_extensions.db.fields.CreationDateTimeField(auto_now_add=True)),
            ],
        ),
        migrations.CreateModel(
            name='EmailProducer',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('sender', models.CharField(default=None, max_length=64)),
                ('receiver', models.EmailField(max_length=128)),
            ],
            options={
                'abstract': False,
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
            name='SavedSearch',
            fields=[
                ('uuid', django_extensions.db.fields.UUIDField(serialize=False, editable=False, primary_key=True, blank=True)),
                ('name', models.CharField(max_length=64)),
                ('owner', models.CharField(max_length=64)),
                ('description', models.CharField(default=b'Defined Search', max_length=1024)),
                ('query', models.TextField(help_text=b'JSON Elasticsearch query body')),
                ('protected', models.BooleanField(default=False, help_text=b'True if this is system-defined')),
                ('index_prefix', models.CharField(max_length=64)),
                ('doc_type', models.CharField(max_length=64)),
                ('timestamp_field', models.CharField(max_length=64, null=True)),
                ('last_start', models.DateTimeField(null=True, blank=True)),
                ('last_end', models.DateTimeField(null=True, blank=True)),
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
            name='FixedIP',
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
            name='FloatingIP',
            fields=[
                ('polyresource_ptr', models.OneToOneField(parent_link=True, auto_created=True, primary_key=True, serialize=False, to='core.PolyResource')),
            ],
            options={
                'abstract': False,
            },
            bases=('core.polyresource',),
        ),
        migrations.CreateModel(
            name='FloatingIPPool',
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
            name='HealthMonitor',
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
            name='LBMember',
            fields=[
                ('polyresource_ptr', models.OneToOneField(parent_link=True, auto_created=True, primary_key=True, serialize=False, to='core.PolyResource')),
            ],
            options={
                'abstract': False,
            },
            bases=('core.polyresource',),
        ),
        migrations.CreateModel(
            name='LBPool',
            fields=[
                ('polyresource_ptr', models.OneToOneField(parent_link=True, auto_created=True, primary_key=True, serialize=False, to='core.PolyResource')),
            ],
            options={
                'abstract': False,
            },
            bases=('core.polyresource',),
        ),
        migrations.CreateModel(
            name='LBVIP',
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
            name='MeteringLabel',
            fields=[
                ('polyresource_ptr', models.OneToOneField(parent_link=True, auto_created=True, primary_key=True, serialize=False, to='core.PolyResource')),
            ],
            options={
                'abstract': False,
            },
            bases=('core.polyresource',),
        ),
        migrations.CreateModel(
            name='MeteringLabelRule',
            fields=[
                ('polyresource_ptr', models.OneToOneField(parent_link=True, auto_created=True, primary_key=True, serialize=False, to='core.PolyResource')),
            ],
            options={
                'abstract': False,
            },
            bases=('core.polyresource',),
        ),
        migrations.CreateModel(
            name='Network',
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
            name='Port',
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
            name='RemoteGroup',
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
            name='Router',
            fields=[
                ('polyresource_ptr', models.OneToOneField(parent_link=True, auto_created=True, primary_key=True, serialize=False, to='core.PolyResource')),
            ],
            options={
                'abstract': False,
            },
            bases=('core.polyresource',),
        ),
        migrations.CreateModel(
            name='SecurityGroup',
            fields=[
                ('polyresource_ptr', models.OneToOneField(parent_link=True, auto_created=True, primary_key=True, serialize=False, to='core.PolyResource')),
            ],
            options={
                'abstract': False,
            },
            bases=('core.polyresource',),
        ),
        migrations.CreateModel(
            name='SecurityRules',
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
            name='Subnet',
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
            model_name='polyresource',
            name='polymorphic_ctype',
            field=models.ForeignKey(related_name='polymorphic_core.polyresource_set+', editable=False, to='contenttypes.ContentType', null=True),
        ),
        migrations.AddField(
            model_name='emailproducer',
            name='query',
            field=models.ForeignKey(to='core.AlertSearch'),
        ),
        migrations.AddField(
            model_name='alert',
            name='query',
            field=models.ForeignKey(to='core.AlertSearch'),
        ),
    ]
