# -*- coding: utf-8 -*-
from south.db import db
from south.v2 import SchemaMigration


class Migration(SchemaMigration):

    def forwards(self, orm):
        # Adding model 'Lease'
        db.create_table(u'lease_lease', (
            (u'id', self.gf('django.db.models.fields.AutoField')
                (primary_key=True)),
            ('name', self.gf('django.db.models.fields.CharField')
                (max_length=100)),
            ('owner_id', self.gf('django.db.models.fields.CharField')
                (max_length=100)),
            ('deleted', self.gf('django.db.models.fields.BooleanField')
                (default=False)),
            ('scope', self.gf('django.db.models.fields.CharField')
                (max_length=100)),
            ('lease_type', self.gf('django.db.models.fields.CharField')
                (max_length=100)),
            ('resource_id', self.gf('django.db.models.fields.CharField')
                (max_length=100)),
            ('resource_type', self.gf('django.db.models.fields.CharField')
                (max_length=100)),
            ('tenant_id', self.gf('django.db.models.fields.CharField')
                (max_length=100)),
            ('start_time', self.gf('django.db.models.fields.DateTimeField')()),
            ('length_in_seconds', self.gf('django.db.models.fields.CharField')
                (max_length=100)),
            ('status', self.gf('django.db.models.fields.CharField')
                (max_length=100)),
            ('reason', self.gf('django.db.models.fields.TextField')
                (blank=True)),
        ))
        db.send_create_signal(u'lease', ['Lease'])

        # Adding model 'Notification'
        db.create_table(u'lease_notification', (
            (u'id', self.gf('django.db.models.fields.AutoField')
                (primary_key=True)),
            ('name', self.gf('django.db.models.fields.CharField')
                (max_length=100)),
            ('driver', self.gf('django.db.models.fields.CharField')
                (max_length=100)),
            ('metadata', self.gf('django.db.models.fields.CharField')
                (max_length=100)),
            ('time', self.gf('django.db.models.fields.DateTimeField')()),
            ('result', self.gf('django.db.models.fields.CharField')
                (max_length=100)),
            ('lease', self.gf('django.db.models.fields.related.ForeignKey')
                (to=orm['lease.Lease'])),
        ))
        db.send_create_signal(u'lease', ['Notification'])

        # Adding model 'Action'
        db.create_table(u'lease_action', (
            (u'id', self.gf('django.db.models.fields.AutoField')
                (primary_key=True)),
            ('name', self.gf('django.db.models.fields.CharField')
                (max_length=100)),
            ('driver', self.gf('django.db.models.fields.CharField')
                (max_length=100)),
            ('metadata', self.gf('django.db.models.fields.CharField')
                (max_length=100)),
            ('time', self.gf('django.db.models.fields.DateTimeField')()),
            ('result', self.gf('django.db.models.fields.CharField')
                (max_length=100)),
            ('lease', self.gf('django.db.models.fields.related.ForeignKey')
                (to=orm['lease.Lease'])),
        ))
        db.send_create_signal(u'lease', ['Action'])

    def backwards(self, orm):
        # Deleting model 'Lease'
        db.delete_table(u'lease_lease')

        # Deleting model 'Notification'
        db.delete_table(u'lease_notification')

        # Deleting model 'Action'
        db.delete_table(u'lease_action')

    models = {
        u'lease.action': {
            'Meta': {'object_name': 'Action'},
            'driver': ('django.db.models.fields.CharField', [],
                       {'max_length': '100'}),
            u'id': ('django.db.models.fields.AutoField', [],
                    {'primary_key': 'True'}),
            'lease': ('django.db.models.fields.related.ForeignKey', [],
                      {'to': u"orm['lease.Lease']"}),
            'metadata': ('django.db.models.fields.CharField', [],
                         {'max_length': '100'}),
            'name': ('django.db.models.fields.CharField', [],
                     {'max_length': '100'}),
            'result': ('django.db.models.fields.CharField', [],
                       {'max_length': '100'}),
            'time': ('django.db.models.fields.DateTimeField', [], {})
        },
        u'lease.lease': {
            'Meta': {'object_name': 'Lease'},
            'deleted': ('django.db.models.fields.BooleanField', [], {}),
            u'id': ('django.db.models.fields.AutoField', [],
                    {'primary_key': 'True'}),
            'lease_type': ('django.db.models.fields.CharField', [],
                           {'max_length': '100'}),
            'length_in_seconds': ('django.db.models.fields.CharField', [],
                                  {'max_length': '100'}),
            'name': ('django.db.models.fields.CharField', [],
                     {'max_length': '100'}),
            'owner_id': ('django.db.models.fields.CharField', [],
                         {'max_length': '100'}),
            'reason': ('django.db.models.fields.TextField', [], {}),
            'resource_id': ('django.db.models.fields.CharField', [],
                            {'max_length': '100'}),
            'resource_type': ('django.db.models.fields.CharField', [],
                              {'max_length': '100'}),
            'scope': ('django.db.models.fields.CharField', [],
                      {'max_length': '100'}),
            'start_time': ('django.db.models.fields.DateTimeField', [], {}),
            'status': ('django.db.models.fields.CharField', [],
                       {'max_length': '100'}),
            'tenant_id': ('django.db.models.fields.CharField', [],
                          {'max_length': '100'})
        },
        u'lease.notification': {
            'Meta': {'object_name': 'Notification'},
            'driver': ('django.db.models.fields.CharField', [],
                       {'max_length': '100'}),
            u'id': ('django.db.models.fields.AutoField', [],
                    {'primary_key': 'True'}),
            'lease': ('django.db.models.fields.related.ForeignKey', [],
                      {'to': u"orm['lease.Lease']"}),
            'metadata': ('django.db.models.fields.CharField', [],
                         {'max_length': '100'}),
            'name': ('django.db.models.fields.CharField', [],
                     {'max_length': '100'}),
            'result': ('django.db.models.fields.CharField', [],
                       {'max_length': '100'}),
            'time': ('django.db.models.fields.DateTimeField', [], {})
        }
    }

    complete_apps = ['lease']
