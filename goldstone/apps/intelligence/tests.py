# vim: tabstop=4 shiftwidth=4 softtabstop=4

#
# Copyright 2014 Solinea, Inc.
#

from django.test.client import Client
from django.test.client import RequestFactory
from django.test import TestCase
from django.conf import settings

from .views import IntelSearchView
from .models import *
import os
import json
from datetime import *
import pytz
import gzip
import pickle
import socket
import random


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


def _stash_log(message, host='localhost', port=55514):
    """
    Send syslog TCP packet to given host and port.
    """
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM, socket.IPPROTO_TCP)
    data = '%s' % message
    sock.sendto(data, (host, port))
    sock.close()


def _random_time_of_year(year=2013):
    end = datetime.datetime(year, 12, 31, 23, 59, 59)
    begin = datetime.datetime(year,1, 1, 0, 0, 0)
    micros_in_yr = (end - begin).microseconds
    rand_micros = random.randrange(0, micros_in_yr + 1)
    return begin + timedelta(microseconds=rand_micros)


def _random_host():
    hosts = ["controller",
             "compute-1.lab.solinea.com",
             "compute-2.lab.solinea.com",
             "compute-3.lab.solinea.com",
             "compute-4.lab.solinea.com",
             "volume.lab.solinea.com",
             "object-1.lab.solinea.com",
             "object-2.lab.solinea.com",
             "object-3.lab.solinea.com"]

    return random.choice(hosts)

def _random_level():
    levels = ["INFO", "WARN", "AUDIT", "ERROR", "DEBUG", "TRACE"]

def _random_message_string():
    test_messages=[
        "openstack_log, nova, {0}, {1} 1000 {2} test.module [-] "
        "test nova message".
        format(_random_host(), _random_time_of_year().isoformat(),
               _random_level()),
        "openstack_log, ceilometer, {0}, {1} 2000 {2} test.module [-] "
        "test ceilometer message".
        format(_random_host(), _random_time_of_year().isoformat(),
               _random_level()),
        "openstack_log, neutron, {0}, {1} 3000 {2} test.module [-] "
        "test neutron message".
        format(_random_host(), _random_time_of_year().isoformat(),
               _random_level()),
        "openstack_log, cinder, {0}, {1} 4000 {2} test.module [-] "
        "test cinder message".
        format(_random_host(), _random_time_of_year().isoformat(),
               _random_level()),
        "openvswitch_log, openvswitch, {0}, {1} 5000 {2} test.module [-] "
        "test openvswitch message".
        format(_random_host(), _random_time_of_year().isoformat(),
               _random_level()),
        "libvirt_log, libvirt, {0}, {1} 5000 {2} test.module [-] "
        "test libvirt message".
        format(_random_host(), _random_time_of_year().isoformat(),
               _random_level())
    ]

    return random.choice(test_messages)



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

    def setUp(self):
        conn = Elasticsearch(settings.ES_SERVER)
        if conn.indices.exists(self.INDEX_NAME):
            conn.indices.delete(self.INDEX_NAME)

        idx_body = {'settings': {
            'index.analysis.analyzer.default.stopwords': '_none_',
            'index.refresh_interval': '5s',
            'index.analysis.analyzer.default.type': 'standard'
        }}

        mapping_f = gzip.open(os.path.join(os.path.dirname(__file__), "..",
                                           "..", "..", "test_data",
                                           "mapping.json.gz"), "rb")
        idx_body['mappings'] = json.load(mapping_f)
        conn.indices.create(self.INDEX_NAME, body=idx_body)

        data_f = gzip.open(os.path.join(os.path.dirname(__file__), "..", "..",
                                        "..", "test_data",
                                        "data.json.gz"))
        data = json.load(data_f)
        for event in data['hits']['hits']:
            rv = conn.index('log_samples', 'logs', event['_source'])

        conn.indices.refresh(["log_samples"])
        q = {"query": {"match_all": {}}}
        rs = conn.search(body=q, index="_all")
        self.assertEqual(rs['hits']['total'], self.TOTAL_DOCS)

    #def tearDown(self):
    #    rv = self.conn.indices.delete_index_if_exists(self.INDEX_NAME)
    #    print rv

    def test_get_connection(self):
        my_conn = LogData.get_connection("localhost")
        q = dict(query={"match_all": {}})
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

    def test_get_new_and_missing_nodes(self):
        my_conn = LogData.get_connection("localhost")
        short_lookback = datetime(2013, 12, 31, 23, 59, 59, tzinfo=pytz.utc)
        long_lookback = short_lookback - timedelta(weeks=52)
        end = short_lookback + timedelta(minutes=1)

        result = LogData().get_new_and_missing_nodes(my_conn, long_lookback,
                                                     short_lookback, end)
        print result
        self.assertEqual(result, {"missing_nodes": [], "new_nodes": []})

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

    def test_log_cockpit_summary(self):
        end = datetime(2013, 12, 31, 23, 59, 59, tzinfo=pytz.utc)
        start = end - timedelta(weeks=4)
        end_ts = calendar.timegm(end.utctimetuple())
        start_ts = calendar.timegm(start.utctimetuple())
        response = self.client.get('/intelligence/log/cockpit?start_time' +
                                   str(start_ts) + "&end_time=" + str(end_ts))
        self.assertEqual(response.status_code, 200)
