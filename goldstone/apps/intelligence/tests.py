# vim: tabstop=4 shiftwidth=4 softtabstop=4

#
# Copyright 2014 Solinea, Inc.
#

from django.test.client import Client
from django.test.client import RequestFactory
from django.test import TestCase
from django.conf import settings

from .views import IntelSearchView, IntelErrorsView
from .models import *

from pyes import *
from pyes.exceptions import IndexMissingException
import os
import json
from datetime import *
import pytz
import gzip
import pickle


def open_result_file(fn):
    with open(os.path.join(os.path.dirname(__file__),
                           "..", "..", "..", "test_data", fn)) \
            as data_f:
                return data_f.read().replace('\n', '')


def read_result_file_as_list(fn):
    with open(os.path.join(os.path.dirname(__file__),
                           "..", "..", "..", "test_data", fn)) \
            as data_f:
                return pickle.load(data_f)


class LogDataModel(TestCase):
    INDEX_NAME = 'test_logstash'
    DOCUMENT_TYPE = 'logs'

    TIME_PERIODS = ["hour", "day", "week", "month"]
    LEVELS = ["fatal", "error", "warning", "info", "debug"]
    COMPONENTS = ['neutron', 'heat', 'keystone', 'ceilometer', 'glance',
                  'nova', 'openvswitch']
    level_facet_result = open_result_file("level_facet_result.json")
    comp_facet_result = open_result_file("comp_facet_result.json")
    level_agg_result = open_result_file("level_agg_result.json")
    comp_agg_result = open_result_file("comp_agg_result.json")
    comp_date_hist_result = open_result_file("comp_date_hist_result.json")
    comp_date_hist_result_filtered = open_result_file(
        "comp_date_hist_result_filtered.json")
    err_and_warn_hists_result = open_result_file(
        "err_and_warn_hists_result.json")
    cockpit_data = list(read_result_file_as_list(
        "cockpit_data_result.pkl"))
    LEVEL_AGG_TOTAL = 182
    COMP_AGG_TOTAL = 186
    TOTAL_DOCS = 186

    conn = ES(settings.ES_SERVER, timeout=settings.ES_TIMEOUT, bulk_size=400,
              default_indices=[INDEX_NAME])

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

    def test_get_components(self):
        comps = LogData.get_components(self.conn)
        self.assertEqual(comps, self.COMPONENTS)

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
        end = datetime(2013, 12, 31, 23, 59, 59, tzinfo=pytz.utc)
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
        end = datetime(2013, 12, 31, 23, 59, 59, tzinfo=pytz.utc)
        start = end - timedelta(weeks=52)
        filter_field = 'component'
        filter_list = LogData.get_components(self.conn)
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

    def test_err_and_warn_hist(self):
        end = datetime(2013, 12, 31, 23, 59, 59, tzinfo=pytz.utc)
        start = end - timedelta(weeks=52)
        interval = 'hour'
        result = LogData.err_and_warn_hist(self.conn, start, end, interval,
                                           query_filter=None).facets
        self.assertEqual(json.dumps(result), self.comp_date_hist_result)

    def test_err_and_warn_hist_filtered(self):
        end = datetime(2013, 12, 31, 23, 59, 59, tzinfo=pytz.utc)
        start = end - timedelta(weeks=52)
        interval = 'hour'
        f = TermFilter('component', 'ceilometer')
        result = LogData.err_and_warn_hist(self.conn, start, end, interval,
                                           query_filter=f).facets
        self.assertEqual(json.dumps(result),
                         self.comp_date_hist_result_filtered)

    def test_get_err_and_warn_hists(self):
        end = datetime(2013, 12, 31, 23, 59, 59, tzinfo=pytz.utc)
        start = end - timedelta(weeks=52)
        result = LogData.get_err_and_warn_hists(self.conn, start, end, 'hour',
                                                LogData.get_components(
                                                    self.conn))
        self.assertEqual(json.dumps(result), self.err_and_warn_hists_result)


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
