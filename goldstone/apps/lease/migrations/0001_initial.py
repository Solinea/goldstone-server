# -*- coding: utf-8 -*-
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models


class Migration(SchemaMigration):

    def forwards(self, orm):
        db.create_table("lease_lease", (
            ('id', models.AutoField(verbose_name='ID',
                                    primary_key=True,
                                    auto_created=True)),
            ('name', models.CharField(max_length=100)),
            ('owner_id', models.CharField(max_length=100)),
            ('deleted', models.BooleanField()),
            ('scope', models.CharField(max_length=100)),
            ('lease_type', models.CharField(max_length=100)),
            ('resource_id', models.CharField(max_length=100)),
            ('resource_type', models.CharField(max_length=100)),
            ('tenant_id', models.CharField(max_length=100)),
            ('start_time', models.DateTimeField()),
            ('length_in_seconds', models.CharField(max_length=100)),
            ('status', models.CharField(max_length=100)),
        ))
        db.send_create_signal(u'lease', ['Lease'])

    def backwards(self, orm):
        db.delete_table("southtest_spam")

    models = {
        u'lease.Lease': {
            u'id': ('django.db.models.fields.AutoField', [],
                    {'primary_key': 'True'}),
            'Meta': {'object_name': 'Lease'},
            'name': ('django.db.models.CharField', [], {'max_length': '100'}),
            'owner_id': ('django.db.models.CharField', [],
                    {'max_length': '100'}),
            'deleted': ('django.db.models.BooleanField', [], {}),
            'scope': ('django.db.models.CharField', [], {'max_length': '100'}),
            'lease_type': ('django.db.models.CharField', [],
                           {'max_length': '100'}),
            'resource_id': ('django.db.models.CharField', [],
                            {'max_length': '100'}),
            'resource_type': ('django.db.models.CharField', [],
                              {'max_length': '100'}),
            'tenant_id': ('django.db.models.CharField', [],
                          {'max_length': '100'}),
            'start_time': ('django.db.models.fields.DateTimeField', [], {}),
            'length_in_seconds': ('django.db.models.CharField', [],
                                  {'max_length': '100'}),
            'status': ('django.db.models.CharField', [],
                       {'max_length': '100'}),
        }
    }

    complete_apps = ['lease']
