# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0019_auto_20160211_0016'),
    ]

    operations = [
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
            name='Subnet',
            fields=[
                ('polyresource_ptr', models.OneToOneField(parent_link=True, auto_created=True, primary_key=True, serialize=False, to='core.PolyResource')),
            ],
            options={
                'abstract': False,
            },
            bases=('core.polyresource',),
        ),
    ]
