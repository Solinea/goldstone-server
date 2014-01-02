# vim: tabstop=4 shiftwidth=4 softtabstop=4

#
# Copyright 2014 Solinea, Inc.
#

from django.test.client import Client
from django.test.client import RequestFactory
from django.test import TestCase


from .views import IntelSearchView, IntelErrorsView
from .models import get_log_summary_counts, get_component_summary_counts

from pyes import *
from pyes.exceptions import IndexMissingException
import os
import json
import hashlib

class TestModel(TestCase):
    INDEX_NAME = 'test_logstash'
    DOCUMENT_TYPE = 'logs'
    LEVEL_STR ='{"week": [{"count": 3386, "term": "info"}, {"count": 140, "term": "warning"}, {"count": 56, "term": "error"}, {"count": 3, "term": "audit"}], "day": [{"count": 584, "term": "info"}], "hour": [{"count": 24, "term": "info"}], "month": [{"count": 4757, "term": "info"}, {"count": 428, "term": "warning"}, {"count": 163, "term": "audit"}, {"count": 117, "term": "error"}, {"count": 4, "term": "critical"}]}'
    COMP_STR = '{"week": [{"fatal": []}, {"error": [{"count": 24, "term": "neutron"}, {"count": 16, "term": "nova"}, {"count": 15, "term": "openvswitch"}, {"count": 1, "term": "glance"}]}, {"warning": [{"count": 70, "term": "openvswitch"}, {"count": 45, "term": "neutron"}, {"count": 8, "term": "keystone"}, {"count": 6, "term": "ceilometer"}, {"count": 5, "term": "cinder"}, {"count": 4, "term": "nova"}, {"count": 2, "term": "glance"}]}, {"info": [{"count": 3092, "term": "nova"}, {"count": 130, "term": "ceilometer"}, {"count": 99, "term": "openvswitch"}, {"count": 62, "term": "heat"}, {"count": 3, "term": "keystone"}]}, {"debug": []}], "day": [{"fatal": []}, {"error": []}, {"warning": []}, {"info": [{"count": 584, "term": "nova"}]}, {"debug": []}], "hour": [{"fatal": []}, {"error": []}, {"warning": []}, {"info": [{"count": 24, "term": "nova"}]}, {"debug": []}], "month": [{"fatal": []}, {"error": [{"count": 42, "term": "neutron"}, {"count": 39, "term": "openvswitch"}, {"count": 16, "term": "nova"}, {"count": 9, "term": "cinder"}, {"count": 5, "term": "glance"}, {"count": 4, "term": "ceilometer"}, {"count": 2, "term": "keystone"}]}, {"warning": [{"count": 269, "term": "openvswitch"}, {"count": 69, "term": "neutron"}, {"count": 30, "term": "keystone"}, {"count": 26, "term": "ceilometer"}, {"count": 18, "term": "glance"}, {"count": 9, "term": "cinder"}, {"count": 7, "term": "nova"}]}, {"info": [{"count": 3185, "term": "nova"}, {"count": 528, "term": "ceilometer"}, {"count": 449, "term": "openvswitch"}, {"count": 326, "term": "heat"}, {"count": 251, "term": "neutron"}, {"count": 18, "term": "keystone"}]}, {"debug": []}]}'
    conn = ES(default_indices=[INDEX_NAME], bulk_size=1000)

    def _setup_index(self):
        mapping = {
            u"@timestamp": {"type": "date","format": "dateOptionalTime"},
            u"@version": {"type": u"string"},
            u"_message": {"type": u"string"},
            u"component": {"type": u"string"},
            u"host": {"type": u"string"},
            u"loglevel": {"type": u"string"},
            u"message": {"type": u"string"},
            u"path": {"type": u"string"},
            u"pid": {"type": u"string"},
            u"program": {"type": u"string"},
            u"received_at": {"type": u"string"},
            u"separator": {"type": u"string"},
            u"tags": {"type": u"string"},
            u"type": {"type": u"string"}
        }

        self.conn.indices.create_index(self.INDEX_NAME)
        self.conn.indices.put_mapping(
            self.DOCUMENT_TYPE, {'properties': mapping}, self.INDEX_NAME
        )
        data_f = open(os.path.join(os.path.dirname(__file__), "..", "..", "..",
                                   "etc", "sample_es_data.json"))
        data = json.load(data_f)
        for rec in data['hits']['hits']:
            self.conn.index(rec, self.INDEX_NAME, self.DOCUMENT_TYPE)
        self.conn.indices.refresh(self.INDEX_NAME)

    def setUp(self):
        self._setup_index()
        q = MatchAllQuery().search()
        rs = self.conn.search(q)
        rs = self.conn.search(q)
        self.assertEqual(rs.count(), 1000)

    def tearDown(self):
        self.conn.indices.delete_index_if_exists(self.INDEX_NAME)

    def test_get_log_summary_counts(self):
        counts = get_log_summary_counts()
        s = json.dumps(counts)
        self.assertEqual(s, self.LEVEL_STR)

    def test_get_component_summary_counts(self):
        counts = get_component_summary_counts()
        s = json.dumps(counts)
        self.assertEqual(s, self.COMP_STR)

class IntelViewTest(TestCase):
    """Lease list view tests"""

    def setUp(self):
        pass

    def tearDown(self):
        pass

    def test_search_template(self):
        response = self.client.get('/intelligence/search')
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'search.html')
        # TODO add test to verify window popped up.  may need selenium?

    def test_errors_template(self):
        response = self.client.get('/intelligence/errors')
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'errors.html')
        # TODO add test to verify window popped up.  may need selenium?
