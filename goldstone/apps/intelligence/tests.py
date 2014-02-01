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
import logging

logger = logging.getLogger(__name__)


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
    begin = datetime.datetime(year, 1, 1, 0, 0, 0)
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
    test_messages = [
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
    maxDiff = None
    INDEX_NAME = 'logstash-test'
    DOCUMENT_TYPE = 'logs'

    TIME_PERIODS = ["hour", "day", "week", "month"]
    LEVELS = ["fatal", "error", "warning", "info", "debug"]
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

        template_f = gzip.open(os.path.join(os.path.dirname(__file__), "..",
                                            "..", "..", "test_data",
                                            "data.json.gz"), 'rb')
        template = json.load(template_f)

        try:
            conn.indices.delete("_all")
        finally:
            {}

        conn.indices.create(self.INDEX_NAME, body=template)

        q = {"query": {"match_all": {}}}
        data_f = gzip.open(os.path.join(os.path.dirname(__file__), "..", "..",
                                        "..", "test_data",
                                        "data.json.gz"))
        data = json.load(data_f)
        for event in data['hits']['hits']:
            rv = conn.index(self.INDEX_NAME, self.DOCUMENT_TYPE,
                            event['_source'])

        conn.indices.refresh([self.INDEX_NAME])
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
        test_q = {
            "query": {
                "match_all": {}
            },
            "facets": {
                "components": {
                    "terms": {
                        "field": "component",
                        "all_terms": True
                    }
                }
            }
        }
        test_response = my_conn.search(index="_all", body=test_q)
        control = [d['term'] for d in
                   test_response['facets']['components']['terms']]

        comps = LogData().get_components(my_conn)
        self.assertEqual(sorted(comps), sorted(control))

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
        def test_scenario():
            test_q = {'query': {'range': {
                '@timestamp': {'gte': start.isoformat(),
                               'lte': end.isoformat()}}}, 'facets': {
                facet_field: {
                    'facet_filter': {'term': {filter_field: filter_value}},
                    'terms': {'field': facet_field, 'all_terms': True,
                              'order': 'term'}}}}
            control = my_conn.search(index="_all", body=test_q)
            result = LogData().range_filter_facet(my_conn, start, end,
                                                  filter_field, filter_value,
                                                  facet_field)
            self.assertEqual(result['hits'], control['hits'])

        my_conn = LogData.get_connection("localhost")
        end = datetime(2013, 12, 31, 23, 59, 59, tzinfo=pytz.utc)
        start = end - timedelta(weeks=52)

        filter_field = 'component'
        filter_value = 'nova'
        facet_field = 'loglevel'
        test_scenario()
        filter_field = 'loglevel'
        filter_value = 'info'
        facet_field = 'component'
        test_scenario()

    def test_aggregate_facets(self):

        def test_scenario():
            control = {}
            for filter_value in filter_list:
                test_q = {'query': {'range': {
                    '@timestamp': {'gte': start.isoformat(),
                                   'lte': end.isoformat()}}}, 'facets': {
                    facet_field: {'facet_filter': {'term': {
                        filter_field: filter_value}},
                                  'terms': {'field': facet_field,
                                            'all_terms': True,
                                            'order': 'term'}}}}
                r = my_conn.search(index="_all", body=test_q)
                control[filter_value] = r['facets']

            result = LogData().aggregate_facets(my_conn, start, end,
                                                filter_field, filter_list,
                                                facet_field)
            self.assertEqual(result, control)

        my_conn = LogData.get_connection("localhost")
        end = datetime(2013, 12, 31, 23, 59, 59, tzinfo=pytz.utc)
        start = end - timedelta(weeks=52)
        filter_field = 'component'
        filter_list = LogData().get_components(my_conn)
        facet_field = 'loglevel'
        test_scenario()

        filter_field = 'loglevel'
        filter_list = LogData().get_loglevels(my_conn)
        facet_field = 'component'
        test_scenario()

    def test_err_and_warn_hist(self):
        my_conn = LogData.get_connection("localhost")
        end = datetime(2013, 12, 31, 23, 59, 59, tzinfo=pytz.utc)
        start = end - timedelta(weeks=52)
        interval = 'hour'
        test_q = {"query": {"range": {
            "@timestamp": {"gte": start,
                           "lte": end}}}, "facets": {
            "err_facet": {
                "date_histogram": {"field": "@timestamp",
                                   "interval": interval},
                "facet_filter": {"or": [{"term": {"loglevel": "error"}},
                                        {"term": {"loglevel": "fatal"}}]}},
            "warn_facet": {
                "date_histogram": {"field": "@timestamp",
                                   "interval": interval},
                "facet_filter": {"term": {"loglevel": "warning"}}}}}
        control = my_conn.search(index="_all", body=test_q)['facets']
        result = LogData().err_and_warn_hist(my_conn, start, end, interval,
                                             query_filter=None)['facets']
        self.assertEqual(result, control)

    def test_err_and_warn_hist_filtered(self):
        my_conn = LogData.get_connection("localhost")
        end = datetime(2013, 12, 31, 23, 59, 59, tzinfo=pytz.utc)
        start = end - timedelta(weeks=52)
        interval = 'hour'
        test_q = {"query": {"range": {
            "@timestamp": {"gte": start.isoformat(),
                           "lte": end.isoformat()}}}, "facets": {
            "err_facet": {
                "date_histogram": {"field": "@timestamp",
                                   "interval": interval},
                "facet_filter": {"and": [
                    {"or": [{"term": {"loglevel": "error"}},
                            {"term": {"loglevel": "fatal"}}]},
                    {"term": {"component": "ceilometer"}}]}},
            "warn_facet": {
                "date_histogram": {"field": "@timestamp",
                                   "interval": interval},
                "facet_filter": {"and": [
                    {"term": {"loglevel": "warning"}},
                    {"term": {"component": "ceilometer"}}]}}}}
        control = my_conn.search(index="_all", body=test_q)['facets']
        f = LogData._term_filter('component', 'ceilometer')
        result = LogData().err_and_warn_hist(my_conn, start, end, interval,
                                             query_filter=f)['facets']
        self.assertEqual(result, control)

    def test_get_err_and_warn_hists(self):
        def test_scenario():
            test_q = {"query": {"range": {
                "@timestamp": {"gte": start,
                               "lte": end}}}, "facets": {
                "err_facet": {
                    "date_histogram": {"field": "@timestamp",
                                       "interval": interval},
                    "facet_filter": {"or": [{"term": {"loglevel": "error"}},
                                            {"term": {"loglevel": "fatal"}}]}},
                "warn_facet": {
                    "date_histogram": {"field": "@timestamp",
                                       "interval": interval},
                    "facet_filter": {"term": {"loglevel": "warning"}}}}}
            control = my_conn.search(index="_all", body=test_q)['facets']
            result = LogData().get_err_and_warn_hists(my_conn, start, end,
                                                      'minute')
            self.assertEqual(result, control)

        my_conn = LogData.get_connection("localhost")
        end = datetime(2013, 12, 31, 23, 59, 59, tzinfo=pytz.utc)
        start = end - timedelta(weeks=52)
        interval = 'minute'
        test_scenario()
        interval = 'hour'
        test_scenario()
        interval = 'day'
        test_scenario()
        interval = None
        test_scenario()
        interval = 'xyz'
        test_scenario()

    def test_get_err_and_warn_range(self):

        def test_scenario(sort='', global_filter_text=None):
            test_q = {'query': {'filtered': {'query': {'range': {
                '@timestamp': {'gte': start.isoformat(),
                'lte': end.isoformat()}}}}}}
            loglevel_filt = {'or': [{'term': {'loglevel': 'error'}},
                    {'term': {'loglevel': 'fatal'}},
                    {'term': {'loglevel': 'warning'}}]}
            global_filt = {'term': {'_all': global_filter_text.lower()}} \
                if global_filter_text and global_filter_text != '' else None
            f1 = loglevel_filt if not global_filt \
                else {'and': [loglevel_filt, global_filt]}

            test_q['query']['filtered']['filter'] = f1
            logger.debug("************************ q = %s", test_q)
            control = my_conn.search(index="_all", body=test_q, sort=sort)
            result = LogData().get_err_and_warn_range(my_conn, start, end,
                                                      0, 10, sort,
                                                      global_filter_text)
            self.assertEqual(result['hits'], control['hits'])

        my_conn = LogData.get_connection("localhost")
        end = datetime(2013, 12, 31, 23, 59, 59, tzinfo=pytz.utc)
        start = end - timedelta(weeks=52)

        test_scenario()
        test_scenario(sort={'loglevel': {'order': 'asc'}})
        test_scenario(sort={'loglevel': {'order': 'desc'}})
        test_scenario(global_filter_text="keystone.common.wsgi")

        #test_scenario(sort={'loglevel': {'order': 'asc'}},
        #              global_filter_text="error")


    def test_get_new_and_missing_nodes(self):
        my_conn = LogData.get_connection("localhost")
        short_lookback = datetime(2013, 12, 14, 0, 0, 0, tzinfo=pytz.utc)
        long_lookback = datetime(2013, 1, 1, 0, 0, 0, tzinfo=pytz.utc)
        end = datetime(2013, 12, 31, 23, 59, 59, tzinfo=pytz.utc)

        test_q1 = {'query': {'range': {
            '@timestamp': {'gte': long_lookback.isoformat(),
                           'lte': short_lookback.isoformat()}}}, 'facets': {
            'host_facet': {
                'terms': {'field': 'host.raw', 'all_terms': False,
                          'order': 'term'}}}}
        test_q2 = {'query': {'range': {
            '@timestamp': {'gte': short_lookback.isoformat(),
                           'lte': end.isoformat()}}}, 'facets': {
            'host_facet': {
                'terms': {'field': 'host.raw', 'all_terms': False,
                          'order': 'term'}}}}
        r1 = my_conn.search(index="_all", body=test_q1)
        r2 = my_conn.search(index="_all", body=test_q2)
        s1 = set([fac['term'] for fac in
                  r1['facets']['host_facet']['terms']])
        s2 = set([fac['term'] for fac in
                  r2['facets']['host_facet']['terms']])
        new_nodes = s2.difference(s1)
        missing_nodes = s1.difference(s2)
        control = {
            "missing_nodes": list(missing_nodes),
            "new_nodes": list(new_nodes)
        }
        result = LogData().get_new_and_missing_nodes(my_conn, long_lookback,
                                                     short_lookback, end)
        self.assertEqual(result, control)


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
