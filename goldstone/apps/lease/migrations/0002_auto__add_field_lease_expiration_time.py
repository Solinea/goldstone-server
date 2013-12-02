# -*- coding: utf-8 -*-
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models
from django.utils import timezone


class Migration(SchemaMigration):

    def forwards(self, orm):
        # Adding field 'Lease.expiration_time'
        db.add_column(u'lease_lease', 'expiration_time',
                      self.gf('django.db.models.fields.DateTimeField')(default=timezone.now),
                      keep_default=False)


    def backwards(self, orm):
        # Deleting field 'Lease.expiration_time'
        db.delete_column(u'lease_lease', 'expiration_time')


    models = {
        u'lease.action': {
            'Meta': {'object_name': 'Action'},
            'driver': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'lease': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['lease.Lease']"}),
            'metadata': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'result': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'time': ('django.db.models.fields.DateTimeField', [], {})
        },
        u'lease.lease': {
            'Meta': {'object_name': 'Lease'},
            'deleted': ('django.db.models.fields.BooleanField', [], {}),
            'expiration_time': ('django.db.models.fields.DateTimeField', [], {}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'lease_type': ('django.db.models.fields.CharField', [], {'default': "'INSTANCE'", 'max_length': '100'}),
            'length_in_seconds': ('django.db.models.fields.CharField', [], {'max_length': '100', 'blank': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'owner_id': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'reason': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'resource_id': ('django.db.models.fields.CharField', [], {'max_length': '100', 'blank': 'True'}),
            'resource_type': ('django.db.models.fields.CharField', [], {'default': "'COMPUTE'", 'max_length': '100'}),
            'scope': ('django.db.models.fields.CharField', [], {'default': "'TENANT'", 'max_length': '100'}),
            'start_time': ('django.db.models.fields.DateTimeField', [], {}),
            'status': ('django.db.models.fields.CharField', [], {'max_length': '100', 'blank': 'True'}),
            'tenant_id': ('django.db.models.fields.CharField', [], {'max_length': '100', 'blank': 'True'})
        },
        u'lease.notification': {
            'Meta': {'object_name': 'Notification'},
            'driver': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'lease': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['lease.Lease']"}),
            'metadata': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'result': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'time': ('django.db.models.fields.DateTimeField', [], {})
        }
    }

    complete_apps = ['lease']