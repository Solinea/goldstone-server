# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
import django.utils.timezone
import django_extensions.db.fields
import picklefield.fields


class Migration(migrations.Migration):

    dependencies = [
        ('contenttypes', '0002_remove_content_type_name'),
    ]

    operations = [
        migrations.CreateModel(
            name='PolyResource',
            fields=[
                ('uuid', django_extensions.db.fields.UUIDField(primary_key=True, serialize=False, editable=False, version=1, blank=True)),
                ('native_id', models.CharField(max_length=128)),
                ('native_name', models.CharField(max_length=64)),
                ('edges', picklefield.fields.PickledObjectField(default=[], editable=False)),
                ('cloud_attributes', picklefield.fields.PickledObjectField(default={}, editable=False)),
                ('created', django_extensions.db.fields.CreationDateTimeField(default=django.utils.timezone.now, editable=False, blank=True)),
                ('updated', django_extensions.db.fields.ModificationDateTimeField(default=django.utils.timezone.now, editable=True, blank=True)),
            ],
            options={
                'verbose_name': 'polyresource',
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
        migrations.AddField(
            model_name='polyresource',
            name='polymorphic_ctype',
            field=models.ForeignKey(related_name='polymorphic_core.polyresource_set+', editable=False, to='contenttypes.ContentType', null=True),
        ),
    ]
