# vim: tabstop=4 shiftwidth=4 softtabstop=4

#
# Copyright 2014 Solinea, Inc.
#

from django.test.client import Client
from django.test.client import RequestFactory
from django.test import TestCase
from django.conf import settings

from .views import IntelSearchView, IntelKibanaView
from .models import *

from pyes import *
from pyes.exceptions import IndexMissingException
import os
import json
from datetime import *
import pytz
import gzip
import pickle


# TODO confirm that the Elasticsearch-py connection works, and use if for all
# test connections
def _get_connection(server=None, timeout=None):
        return ES(server=server, timeout=timeout) \
            if server \
            else ES(timeout=timeout)


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
    INDEX_NAME = 'log_samples'
    DOCUMENT_TYPE = 'logs'

    TIME_PERIODS = ["hour", "day", "week", "month"]
    LEVELS = ["fatal", "error", "warning", "info", "debug"]
    COMPONENTS = ['ceilometer', 'cinder', 'glance', 'heat', 'keystone',
                  'neutron', 'nova']
    level_facet_result = open_result_file("level_facet_result.json")
    comp_facet_result = open_result_file("comp_facet_result.json")
    level_agg_result = open_result_file("level_agg_result.json")
    comp_agg_result = open_result_file("comp_agg_result.json")
    comp_date_hist_result = open_result_file("comp_date_hist_result.json")
    comp_date_hist_result_filtered = open_result_file(
        "comp_date_hist_result_filtered.json")
    err_and_warn_hists_result_day = open_result_file(
        "err_and_warn_hists_result_day.json")
    err_and_warn_hists_result_hour = open_result_file(
        "err_and_warn_hists_result_hour.json")
    err_and_warn_hists_result_minute = open_result_file(
        "err_and_warn_hists_result_minute.json")
    cockpit_data = list(read_result_file_as_list(
        "cockpit_data_result.pkl"))
    LEVEL_AGG_TOTAL = 426
    TOTAL_DOCS = 500

    conn = ES(settings.ES_SERVER, timeout=30, bulk_size=500,
              default_indices=[INDEX_NAME])

    def setUp(self):
        self.conn.indices.delete_index_if_exists(self.INDEX_NAME)
        self.conn.indices.create_index(self.INDEX_NAME,
                                       settings={
                                           'index.analysis.analyzer.default.'
                                           'stopwords': '_none_',
                                           'index.refresh_interval': '5s',
                                           'index.analysis.analyzer.default.'
                                           'type': 'standard'})

        mapping_f = open(os.path.join(os.path.dirname(__file__), "..", "..",
                                      "..", "test_data", "mapping.pkl"), "rb")
        mapping = pickle.load(mapping_f)
        self.conn.indices.put_mapping(self.DOCUMENT_TYPE, mapping,
                                      self.INDEX_NAME)

        data_f = gzip.open(os.path.join(os.path.dirname(__file__), "..", "..",
                                        "..", "test_data",
                                        "data.json.gz"))
        data = json.load(data_f)

        for doc in data:
            self.conn.index(doc, self.INDEX_NAME, self.DOCUMENT_TYPE,
                            bulk=True)
        self.conn.indices.refresh([self.INDEX_NAME])
        q = MatchAllQuery().search()
        rs = self.conn.search(q)
        self.assertEqual(rs.count(), self.TOTAL_DOCS)

    #def tearDown(self):
    #    rv = self.conn.indices.delete_index_if_exists(self.INDEX_NAME)
    #    print rv

    def test_get_connection(self):
        pyesq = MatchAllQuery().search()
        q = dict(query={"match_all": {}})
        rs = self.conn.search(pyesq)
        self.assertEqual(rs.count(), self.TOTAL_DOCS)
        test_conn = LogData.get_connection("localhost")
        rs = test_conn.search(index="_all", body=q)
        self.assertEqual(rs['hits']['total'], self.TOTAL_DOCS)
        test_conn = LogData.get_connection("localhost:9200")
        rs = test_conn.search(index="_all", body=q)
        self.assertEqual(rs['hits']['total'], self.TOTAL_DOCS)
        test_conn = LogData.get_connection(["localhost"])
        rs = test_conn.search(index="_all", body=q)
        self.assertEqual(rs['hits']['total'], self.TOTAL_DOCS)

    def test_get_components(self):
        my_conn = LogData.get_connection("localhost")
        comps = LogData().get_components(my_conn)
        self.assertEqual(sorted(comps), sorted(self.COMPONENTS))

    def test_subtract_months(self):
        d = LogData()._subtract_months(datetime(2014, 1, 1), 1)
        self.assertEqual(d, datetime(2013, 12, 1, 0, 0))
        d = LogData()._subtract_months(datetime(2013, 12, 1), 2)
        self.assertEqual(d, datetime(2013, 10, 1, 0, 0))
        d = LogData()._subtract_months(datetime(2013, 12, 1), 12)
        self.assertEqual(d, datetime(2012, 12, 1, 0, 0))

    def test_calc_start(self):
        d = LogData()._calc_start(datetime(2013, 12, 10, 12, 0, 0), 'hour')
        self.assertEqual(d, datetime(2013, 12, 10, 11, 0, tzinfo=pytz.utc))
        d = LogData()._calc_start(datetime(2013, 12, 10, 12, 0, 0), 'day')
        self.assertEqual(d, datetime(2013, 12, 9, 12, 0, tzinfo=pytz.utc))
        d = LogData()._calc_start(datetime(2013, 12, 10, 12, 0, 0), 'week')
        self.assertEqual(d, datetime(2013, 12, 3, 12, 0, tzinfo=pytz.utc))
        d = LogData()._calc_start(datetime(2013, 12, 10, 12, 0, 0), 'month')
        self.assertEqual(d, datetime(2013, 11, 10, 12, 0, tzinfo=pytz.utc))

    def test_range_filter_facet(self):
        my_conn = LogData.get_connection("localhost")
        end = datetime(2013, 12, 31, 23, 59, 59, tzinfo=pytz.utc)
        start = end - timedelta(weeks=52)

        filter_field = 'component'
        filter_value = 'nova'
        facet_field = 'loglevel'
        result = LogData().range_filter_facet(my_conn, start, end,
                                              filter_field, filter_value,
                                              facet_field)
        print "result = ", result
        self.assertEqual(result['facets']['loglevel']['total'], 108)
        self.assertEqual(json.dumps(result['facets']), self.level_facet_result)

        filter_field = 'loglevel'
        filter_value = 'info'
        facet_field = 'component'
        result = LogData().range_filter_facet(my_conn, start, end,
                                              filter_field, filter_value,
                                              facet_field)['facets']
        self.assertEqual(json.dumps(result), self.comp_facet_result)

    def test_aggregate_facets(self):
        my_conn = LogData.get_connection("localhost")
        end = datetime(2013, 12, 31, 23, 59, 59, tzinfo=pytz.utc)
        start = end - timedelta(weeks=52)
        filter_field = 'component'
        filter_list = LogData().get_components(my_conn)
        facet_field = 'loglevel'
        ag = LogData().aggregate_facets(my_conn, start, end, filter_field,
                                        filter_list, facet_field)
        self.assertEqual(json.dumps(ag), self.comp_agg_result)
        total = sum([ag[key][facet_field]['total'] for key in ag.keys()])
        self.assertEqual(total, self.TOTAL_DOCS)

        filter_field = 'loglevel'
        filter_list = self.LEVELS
        facet_field = 'component'
        ag = LogData().aggregate_facets(my_conn, start, end, filter_field,
                                        filter_list, facet_field)
        self.assertEqual(json.dumps(ag), self.level_agg_result)
        total = sum([ag[key][facet_field]['total'] for key in ag.keys()])
        self.assertEqual(total, self.LEVEL_AGG_TOTAL)

    def test_err_and_warn_hist(self):
        my_conn = LogData.get_connection("localhost")
        end = datetime(2013, 12, 31, 23, 59, 59, tzinfo=pytz.utc)
        start = end - timedelta(weeks=52)
        interval = 'hour'
        result = LogData().err_and_warn_hist(my_conn, start, end, interval,
                                             query_filter=None)['facets']

        self.assertEqual(json.dumps(result), self.comp_date_hist_result)

    def test_err_and_warn_hist_filtered(self):
        my_conn = LogData.get_connection("localhost")
        end = datetime(2013, 12, 31, 23, 59, 59, tzinfo=pytz.utc)
        start = end - timedelta(weeks=52)
        interval = 'hour'
        f = LogData._term_filter('component', 'ceilometer')
        result = LogData().err_and_warn_hist(my_conn, start, end, interval,
                                             query_filter=f)['facets']
        self.assertEqual(json.dumps(result),
                         self.comp_date_hist_result_filtered)

    def test_get_err_and_warn_hists(self):
        my_conn = LogData.get_connection("localhost")
        end = datetime(2013, 12, 31, 23, 59, 59, tzinfo=pytz.utc)
        start = end - timedelta(weeks=52)
        result = LogData().get_err_and_warn_hists(my_conn, start, end,
                                                  'minute')
        self.assertEqual(json.dumps(result),
                         self.err_and_warn_hists_result_minute)
        result = LogData().get_err_and_warn_hists(my_conn, start, end, 'hour')
        self.assertEqual(json.dumps(result),
                         self.err_and_warn_hists_result_hour)
        result = LogData().get_err_and_warn_hists(my_conn, start, end, 'day')
        self.assertEqual(json.dumps(result),
                         self.err_and_warn_hists_result_day)
        result = LogData().get_err_and_warn_hists(my_conn, start, end)
        self.assertEqual(json.dumps(result),
                         self.err_and_warn_hists_result_day)
        result = LogData().get_err_and_warn_hists(my_conn, start, end, 'xyz')
        self.assertEqual(json.dumps(result),
                         self.err_and_warn_hists_result_day)

    def test_get_err_and_warn_range(self):
        my_conn = LogData.get_connection("localhost")
        end = datetime(2013, 12, 31, 23, 59, 59, tzinfo=pytz.utc)
        start = end - timedelta(weeks=52)

        result = LogData().get_err_and_warn_range(my_conn, start, end,
                                                  first=0, size=10)
        self.assertEqual(result['hits']['total'], 25)
        self.assertEqual(len(result['hits']['hits']), 10)

        result = LogData().\
            get_err_and_warn_range(my_conn, start, end, first=0, size=10,
                                   sort={'loglevel': {'order': 'asc'}})
        print result
        self.assertEqual(result['hits']['total'], 25)
        self.assertEqual(len(result['hits']['hits']), 10)

        result = LogData().\
            get_err_and_warn_range(my_conn, start, end, 0, 10,
                                   global_filter_text="error")
        self.assertEqual(result['hits']['total'], 3)
        self.assertEqual(len(result['hits']['hits']), 3)

        result = LogData().\
            get_err_and_warn_range(my_conn, start, end, 0, 10,
                                   sort={'loglevel': {'order': 'asc'}},
                                   global_filter_text="error")
        self.assertEqual(result['hits']['total'], 3)
        self.assertEqual(len(result['hits']['hits']), 3)


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

    def test_kibana_template(self):
        response = self.client.get('/intelligence/kibana')
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'kibana.html')

    def test_log_cockpit_summary(self):
        end = datetime(2013, 12, 31, 23, 59, 59, tzinfo=pytz.utc)
        start = end - timedelta(weeks=4)
        end_ts = calendar.timegm(end.utctimetuple())
        start_ts = calendar.timegm(start.utctimetuple())
        response = self.client.get('/intelligence/log/cockpit?start_time' +
                                   str(start_ts) + "&end_time=" + str(end_ts))
        self.assertEqual(response.status_code, 200)
