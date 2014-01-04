# vim: tabstop=4 shiftwidth=4 softtabstop=4

#
# Copyright 2014 Solinea, Inc.
#

from django.test.client import Client
from django.test.client import RequestFactory
from django.test import TestCase

from .views import IntelSearchView, IntelErrorsView
from .models import range_filter_facet, aggregate_facets

from pyes import *
from pyes.exceptions import IndexMissingException
import os
import json
from datetime import *
import pytz


class TestModel(TestCase):
    INDEX_NAME = 'test_logstash'
    DOCUMENT_TYPE = 'logs'
    COMPONENTS = ["ceilometer", "cinder", "glance", "nova", "neutron",
              "openvswitch", "apache", "heat", "keystone"]
    TIME_PERIODS = ["hour", "day", "week", "month"]
    LEVELS = ["fatal", "error", "warning", "info", "debug"]
    LEVEL_FACET_RESULT = '{"loglevel": {"_type": "terms", "total": 343, "terms": [{"count": 0, "term": "audit"}, {"count": 168, "term": "debug"}, {"count": 0, "term": "error"}, {"count": 175, "term": "info"}, {"count": 0, "term": "warning"}], "other": 0, "missing": 0}}'
    COMP_FACET_RESULT = '{"component": {"_type": "terms", "total": 514, "terms": [{"count": 0, "term": "apache"}, {"count": 18, "term": "ceilometer"}, {"count": 0, "term": "cinder"}, {"count": 0, "term": "glance"}, {"count": 68, "term": "heat"}, {"count": 14, "term": "keystone"}, {"count": 232, "term": "neutron"}, {"count": 175, "term": "nova"}, {"count": 7, "term": "openvswitch"}], "other": 0, "missing": 0}}'
    LEVEL_AGG_RESULT = '{"info": {"component": {"_type": "terms", "total": 514, "terms": [{"count": 0, "term": "apache"}, {"count": 18, "term": "ceilometer"}, {"count": 0, "term": "cinder"}, {"count": 0, "term": "glance"}, {"count": 68, "term": "heat"}, {"count": 14, "term": "keystone"}, {"count": 232, "term": "neutron"}, {"count": 175, "term": "nova"}, {"count": 7, "term": "openvswitch"}], "other": 0, "missing": 0}}, "debug": {"component": {"_type": "terms", "total": 168, "terms": [{"count": 0, "term": "apache"}, {"count": 0, "term": "ceilometer"}, {"count": 0, "term": "cinder"}, {"count": 0, "term": "glance"}, {"count": 0, "term": "heat"}, {"count": 0, "term": "keystone"}, {"count": 0, "term": "neutron"}, {"count": 168, "term": "nova"}, {"count": 0, "term": "openvswitch"}], "other": 0, "missing": 0}}, "fatal": {"component": {"_type": "terms", "total": 0, "terms": [{"count": 0, "term": "apache"}, {"count": 0, "term": "ceilometer"}, {"count": 0, "term": "cinder"}, {"count": 0, "term": "glance"}, {"count": 0, "term": "heat"}, {"count": 0, "term": "keystone"}, {"count": 0, "term": "neutron"}, {"count": 0, "term": "nova"}, {"count": 0, "term": "openvswitch"}], "other": 0, "missing": 0}}, "warning": {"component": {"_type": "terms", "total": 105, "terms": [{"count": 0, "term": "apache"}, {"count": 5, "term": "ceilometer"}, {"count": 1, "term": "cinder"}, {"count": 10, "term": "glance"}, {"count": 0, "term": "heat"}, {"count": 54, "term": "keystone"}, {"count": 35, "term": "neutron"}, {"count": 0, "term": "nova"}, {"count": 0, "term": "openvswitch"}], "other": 0, "missing": 0}}, "error": {"component": {"_type": "terms", "total": 201, "terms": [{"count": 0, "term": "apache"}, {"count": 21, "term": "ceilometer"}, {"count": 3, "term": "cinder"}, {"count": 4, "term": "glance"}, {"count": 16, "term": "heat"}, {"count": 0, "term": "keystone"}, {"count": 157, "term": "neutron"}, {"count": 0, "term": "nova"}, {"count": 0, "term": "openvswitch"}], "other": 0, "missing": 0}}}'
    LEVEL_AGG_TOTAL = 988
    COMP_AGG_RESULT = '{"ceilometer": {"loglevel": {"_type": "terms", "total": 53, "terms": [{"count": 9, "term": "audit"}, {"count": 0, "term": "debug"}, {"count": 21, "term": "error"}, {"count": 18, "term": "info"}, {"count": 5, "term": "warning"}], "other": 0, "missing": 0}}, "openvswitch": {"loglevel": {"_type": "terms", "total": 7, "terms": [{"count": 0, "term": "audit"}, {"count": 0, "term": "debug"}, {"count": 0, "term": "error"}, {"count": 7, "term": "info"}, {"count": 0, "term": "warning"}], "other": 0, "missing": 0}}, "nova": {"loglevel": {"_type": "terms", "total": 343, "terms": [{"count": 0, "term": "audit"}, {"count": 168, "term": "debug"}, {"count": 0, "term": "error"}, {"count": 175, "term": "info"}, {"count": 0, "term": "warning"}], "other": 0, "missing": 0}}, "heat": {"loglevel": {"_type": "terms", "total": 84, "terms": [{"count": 0, "term": "audit"}, {"count": 0, "term": "debug"}, {"count": 16, "term": "error"}, {"count": 68, "term": "info"}, {"count": 0, "term": "warning"}], "other": 0, "missing": 0}}, "keystone": {"loglevel": {"_type": "terms", "total": 68, "terms": [{"count": 0, "term": "audit"}, {"count": 0, "term": "debug"}, {"count": 0, "term": "error"}, {"count": 14, "term": "info"}, {"count": 54, "term": "warning"}], "other": 0, "missing": 0}}, "apache": {"loglevel": {"_type": "terms", "total": 0, "terms": [{"count": 0, "term": "audit"}, {"count": 0, "term": "debug"}, {"count": 0, "term": "error"}, {"count": 0, "term": "info"}, {"count": 0, "term": "warning"}], "other": 0, "missing": 3}}, "cinder": {"loglevel": {"_type": "terms", "total": 4, "terms": [{"count": 0, "term": "audit"}, {"count": 0, "term": "debug"}, {"count": 3, "term": "error"}, {"count": 0, "term": "info"}, {"count": 1, "term": "warning"}], "other": 0, "missing": 0}}, "glance": {"loglevel": {"_type": "terms", "total": 14, "terms": [{"count": 0, "term": "audit"}, {"count": 0, "term": "debug"}, {"count": 4, "term": "error"}, {"count": 0, "term": "info"}, {"count": 10, "term": "warning"}], "other": 0, "missing": 0}}, "neutron": {"loglevel": {"_type": "terms", "total": 424, "terms": [{"count": 0, "term": "audit"}, {"count": 0, "term": "debug"}, {"count": 157, "term": "error"}, {"count": 232, "term": "info"}, {"count": 35, "term": "warning"}], "other": 0, "missing": 0}}}'
    COMP_AGG_TOTAL = 997
    conn = ES("localhost:9200", bulk_size=1000, default_indices=[INDEX_NAME])

    def setUp(self):

        mapping = {
            u"@timestamp": {"type": "date", "format": "dateOptionalTime"},
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

        self.conn.indices.delete_index_if_exists(self.INDEX_NAME)
        self.conn.indices.create_index(self.INDEX_NAME)
        self.conn.indices.put_mapping(
            self.DOCUMENT_TYPE, {'properties': mapping}, self.INDEX_NAME
        )
        data_f = open(os.path.join(os.path.dirname(__file__), "..", "..", "..",
                                   "etc", "sample_es_data.json"))
        data = json.load(data_f)

        for doc in data['hits']['hits']:
            self.conn.index(doc, self.INDEX_NAME, self.DOCUMENT_TYPE,
                            bulk=True)
        self.conn.refresh()
        q = MatchAllQuery().search()
        rs = self.conn.search(q)
        self.assertEqual(rs.count(), 1000)

    def tearDown(self):
        self.conn.indices.delete_index_if_exists(self.INDEX_NAME)

    def test_range_filter_facet(self):
        q = MatchAllQuery().search()
        rs = self.conn.search(q)
        self.assertEqual(rs.count(), 1000)
        end = datetime.now(pytz.utc)
        start = end - timedelta(weeks=52)

        filter_field = 'component'
        filter_value = 'nova'
        facet_field = 'loglevel'
        result = range_filter_facet(self.conn, start, end, filter_field,
                                    filter_value, facet_field).facets
        self.assertEqual(result['loglevel']['total'], 343)
        self.assertEqual(json.dumps(result), self.LEVEL_FACET_RESULT)

        filter_field = 'loglevel'
        filter_value = 'info'
        facet_field = 'component'
        result = range_filter_facet(self.conn, start, end, filter_field,
                                    filter_value, facet_field).facets
        self.assertEqual(json.dumps(result), self.COMP_FACET_RESULT)

    def test_aggregate_facets(self):
        q = MatchAllQuery().search()
        rs = self.conn.search(q)
        self.assertEqual(rs.count(), 1000)
        end = datetime.now(pytz.utc)
        start = end - timedelta(weeks=52)
        filter_field = 'component'
        filter_list = self.COMPONENTS
        facet_field = 'loglevel'
        ag = aggregate_facets(self.conn, start, end, filter_field, filter_list,
                              facet_field)
        self.assertEqual(json.dumps(ag), self.COMP_AGG_RESULT)
        total = sum([ag[key][facet_field]['total'] for key in ag.keys()])
        self.assertEqual(total, self.COMP_AGG_TOTAL)

        filter_field = 'loglevel'
        filter_list = self.LEVELS
        facet_field = 'component'
        ag = aggregate_facets(self.conn, start, end, filter_field, filter_list,
                              facet_field)
        self.assertEqual(json.dumps(ag), self.LEVEL_AGG_RESULT)
        total = sum([ag[key][facet_field]['total'] for key in ag.keys()])
        self.assertEqual(total, self.LEVEL_AGG_TOTAL)


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
