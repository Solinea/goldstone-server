# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0020_fixedip_floatingip_floatingippool_healthmonitor_lbmember_lbpool_lbvip_meteringlabel_meteringlabelrul'),
    ]

    operations = [
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
            name='NeutronSubnetPool',
            fields=[
                ('polyresource_ptr', models.OneToOneField(parent_link=True, auto_created=True, primary_key=True, serialize=False, to='core.PolyResource')),
            ],
            options={
                'abstract': False,
            },
            bases=('core.polyresource',),
        ),
        migrations.RenameModel(
            old_name='FloatingIP',
            new_name='NeutronFloatingIP',
        ),
        migrations.RenameModel(
            old_name='Network',
            new_name='NeutronNetwork',
        ),
        migrations.RenameModel(
            old_name='Port',
            new_name='NeutronPort',
        ),
        migrations.RenameModel(
            old_name='Router',
            new_name='NeutronRouter',
        ),
        migrations.RenameModel(
            old_name='SecurityGroup',
            new_name='NeutronSecurityGroup',
        ),
        migrations.RenameModel(
            old_name='SecurityRules',
            new_name='NeutronSecurityGroupRule',
        ),
        migrations.RenameModel(
            old_name='Subnet',
            new_name='NeutronSubnet',
        ),
        migrations.RemoveField(
            model_name='fixedip',
            name='polyresource_ptr',
        ),
        migrations.RemoveField(
            model_name='floatingippool',
            name='polyresource_ptr',
        ),
        migrations.RemoveField(
            model_name='healthmonitor',
            name='polyresource_ptr',
        ),
        migrations.RemoveField(
            model_name='lbmember',
            name='polyresource_ptr',
        ),
        migrations.RemoveField(
            model_name='lbpool',
            name='polyresource_ptr',
        ),
        migrations.RemoveField(
            model_name='lbvip',
            name='polyresource_ptr',
        ),
        migrations.RemoveField(
            model_name='meteringlabel',
            name='polyresource_ptr',
        ),
        migrations.RemoveField(
            model_name='meteringlabelrule',
            name='polyresource_ptr',
        ),
        migrations.RemoveField(
            model_name='remotegroup',
            name='polyresource_ptr',
        ),
        migrations.DeleteModel(
            name='FixedIP',
        ),
        migrations.DeleteModel(
            name='FloatingIPPool',
        ),
        migrations.DeleteModel(
            name='HealthMonitor',
        ),
        migrations.DeleteModel(
            name='LBMember',
        ),
        migrations.DeleteModel(
            name='LBPool',
        ),
        migrations.DeleteModel(
            name='LBVIP',
        ),
        migrations.DeleteModel(
            name='MeteringLabel',
        ),
        migrations.DeleteModel(
            name='MeteringLabelRule',
        ),
        migrations.DeleteModel(
            name='RemoteGroup',
        ),
    ]
