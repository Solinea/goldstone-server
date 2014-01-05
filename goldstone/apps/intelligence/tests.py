# vim: tabstop=4 shiftwidth=4 softtabstop=4

#
# Copyright 2014 Solinea, Inc.
#

from django.test.client import Client
from django.test.client import RequestFactory
from django.test import TestCase

from .views import IntelSearchView, IntelErrorsView
from .models import *

from pyes import *
from pyes.exceptions import IndexMissingException
import os
import json
from datetime import *
import pytz
import gzip


def open_result_file(fn):
        with open(os.path.join(os.path.dirname(__file__),
                               "..", "..", "..", "test_data", fn)) \
                as data_f:
                    return data_f.read().replace('\n', '')


class IntelTestModel(TestCase):
    INDEX_NAME = 'test_logstash'
    DOCUMENT_TYPE = 'logs'
    COMPONENTS = ["ceilometer", "cinder", "glance", "nova", "neutron",
                  "openvswitch", "apache", "heat", "keystone"]
    TIME_PERIODS = ["hour", "day", "week", "month"]
    LEVELS = ["fatal", "error", "warning", "info", "debug"]

    level_facet_result = open_result_file("level_facet_result.json")
    comp_facet_result = open_result_file("comp_facet_result.json")
    level_agg_result = open_result_file("level_agg_result.json")
    comp_agg_result = open_result_file("comp_agg_result.json")
    LEVEL_AGG_TOTAL = 182
    COMP_AGG_TOTAL = 186
    TOTAL_DOCS = 186

    conn = ES("localhost:9200", bulk_size=400, default_indices=[INDEX_NAME])

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

        data_f = gzip.open(os.path.join(os.path.dirname(__file__), "..", "..",
                                        "..", "test_data",
                                        "sample_es_data.json.gz"))
        data = json.load(data_f)

        for doc in data['hits']['hits']:
            self.conn.index(doc, self.INDEX_NAME, self.DOCUMENT_TYPE,
                            bulk=True)
        self.conn.refresh()
        q = MatchAllQuery().search()
        rs = self.conn.search(q)
        self.assertEqual(rs.count(), self.TOTAL_DOCS)

    def tearDown(self):
        self.conn.indices.delete_index_if_exists(self.INDEX_NAME)

    def test_subtract_months(self):
        d = subtract_months(datetime(2014, 1, 1), 1)
        self.assertEqual(d, datetime(2013, 12, 1, 0, 0))
        d = subtract_months(datetime(2013, 12, 1), 2)
        self.assertEqual(d, datetime(2013, 10, 1, 0, 0))
        d = subtract_months(datetime(2013, 12, 1), 12)
        self.assertEqual(d, datetime(2012, 12, 1, 0, 0))

    def test_calc_start(self):
        d = calc_start(datetime(2013, 12, 10, 12, 0, 0), 'hour')
        self.assertEqual(d, datetime(2013, 12, 10, 11, 0, tzinfo=pytz.utc))
        d = calc_start(datetime(2013, 12, 10, 12, 0, 0), 'day')
        self.assertEqual(d, datetime(2013, 12, 9, 12, 0, tzinfo=pytz.utc))
        d = calc_start(datetime(2013, 12, 10, 12, 0, 0), 'week')
        self.assertEqual(d, datetime(2013, 12, 3, 12, 0, tzinfo=pytz.utc))
        d = calc_start(datetime(2013, 12, 10, 12, 0, 0), 'month')
        self.assertEqual(d, datetime(2013, 11, 10, 12, 0, tzinfo=pytz.utc))

    def test_range_filter_facet(self):
        q = MatchAllQuery().search()
        rs = self.conn.search(q)
        self.assertEqual(rs.count(), self.TOTAL_DOCS)
        end = datetime(2013, 12, 31, 23, 59, 59)
        start = end - timedelta(weeks=52)

        filter_field = 'component'
        filter_value = 'nova'
        facet_field = 'loglevel'
        result = range_filter_facet(self.conn, start, end, filter_field,
                                    filter_value, facet_field).facets
        self.assertEqual(result['loglevel']['total'], 4)
        self.assertEqual(json.dumps(result), self.level_facet_result)

        filter_field = 'loglevel'
        filter_value = 'info'
        facet_field = 'component'
        result = range_filter_facet(self.conn, start, end, filter_field,
                                    filter_value, facet_field).facets
        self.assertEqual(json.dumps(result), self.comp_facet_result)

    def test_aggregate_facets(self):
        q = MatchAllQuery().search()
        rs = self.conn.search(q)
        self.assertEqual(rs.count(), self.TOTAL_DOCS)
        end = datetime(2013, 12, 31, 23, 59, 59)
        start = end - timedelta(weeks=52)
        filter_field = 'component'
        filter_list = self.COMPONENTS
        facet_field = 'loglevel'
        ag = aggregate_facets(self.conn, start, end, filter_field, filter_list,
                              facet_field)
        self.assertEqual(json.dumps(ag), self.comp_agg_result)
        total = sum([ag[key][facet_field]['total'] for key in ag.keys()])
        self.assertEqual(total, self.COMP_AGG_TOTAL)

        filter_field = 'loglevel'
        filter_list = self.LEVELS
        facet_field = 'component'
        ag = aggregate_facets(self.conn, start, end, filter_field, filter_list,
                              facet_field)
        self.assertEqual(json.dumps(ag), self.level_agg_result)
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
