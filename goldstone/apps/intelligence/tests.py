# Copyright 2014 Solinea, Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

__author__ = 'John Stanford'

from django.test.client import Client
from django.test.client import RequestFactory
from django.utils.unittest.case import skip
from django.test import SimpleTestCase
from django.conf import settings
from waffle import Switch

from .views import IntelSearchView
from .models import *
import os
import json
from datetime import *
import pytz
import gzip
import logging
from elasticsearch import *

logger = logging.getLogger(__name__)


class LogDataModel(SimpleTestCase):
    INDEX_NAME = 'logstash-test'
    DOCUMENT_TYPE = 'logs'
    conn = Elasticsearch(settings.ES_SERVER)
    template_f = gzip.open(os.path.join(os.path.dirname(__file__), "..",
                                        "..", "..", "test_data",
                                        "template.json.gz"), 'rb')
    template = json.load(template_f)

    try:
        conn.indices.delete("_all")
    finally:
        {}

    conn.indices.create(INDEX_NAME, body=template)

    q = {"query": {"match_all": {}}}
    data_f = gzip.open(os.path.join(os.path.dirname(__file__), "..", "..",
                                    "..", "test_data",
                                    "data.json.gz"))
    data = json.load(data_f)
    for dataset in data:
        for event in dataset['hits']['hits']:
            rv = conn.index(INDEX_NAME, event['_type'],
                            event['_source'])

    conn.indices.refresh([INDEX_NAME])
    q = {"query": {"match_all": {}}}
    rs = conn.search(body=q, index="_all")

    def setUp(self):
        pass

    def tearDown(self):
        pass

    def test_get_connection(self):
        q = dict(query={"match": {"type": "syslog"}})
        test_conn = LogData.get_connection("localhost")
        rs = test_conn.search(index="_all", body=q)
        self.assertIsNotNone(rs)
        test_conn = LogData.get_connection("localhost:9200")
        rs = test_conn.search(index="_all", body=q)
        self.assertIsNotNone(rs)
        test_conn = LogData.get_connection(["localhost"])
        rs = test_conn.search(index="_all", body=q)
        self.assertIsNotNone(rs)

    def test_get_components(self):
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
        test_response = self.conn.search(index="_all", body=test_q)
        control = [d['term'] for d in
                   test_response['facets']['components']['terms']]

        comps = LogData().get_components(self.conn)
        self.assertEqual(sorted(comps), sorted(control))

    def test_get_loglevels(self):
        test_q = {
            "query": {
                "match_all": {}
            },
            "facets": {
                "loglevels": {
                    "terms": {
                        "field": "loglevel",
                        "all_terms": True
                    }
                }
            }
        }
        test_response = self.conn.search(index="_all", body=test_q)
        control = [d['term'] for d in
                   test_response['facets']['loglevels']['terms']]

        comps = LogData().get_loglevels(self.conn)
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
            control = self.conn.search(index="_all", body=test_q)
            result = LogData().range_filter_facet(self.conn, start, end,
                                                  filter_field, filter_value,
                                                  facet_field)
            self.assertEqual(result['hits'], control['hits'])

        end = datetime(2014, 02, 24, 23, 59, 59, tzinfo=pytz.utc)
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
                test_q = {
                    'query': {
                        'range': {
                            '@timestamp': {
                                'gte': start.isoformat(),
                                'lte': end.isoformat()
                            }
                        }
                    },
                    'facets': {
                        facet_field: {
                            'facet_filter': {
                                'term': {
                                    filter_field: filter_value
                                }
                            },
                            'terms': {
                                'field': facet_field,
                                'all_terms': True,
                                'order': 'term'
                            }
                        }
                    }
                }
                r = self.conn.search(index="_all", body=test_q)
                control[filter_value] = r['facets']

            result = LogData().aggregate_facets(self.conn, start, end,
                                                filter_field, filter_list,
                                                facet_field)
            self.assertEqual(result, control)

        end = datetime(2014, 2, 24, 23, 59, 59, tzinfo=pytz.utc)
        start = end - timedelta(weeks=52)
        filter_field = 'component'
        filter_list = LogData().get_components(self.conn)
        facet_field = 'loglevel'
        test_scenario()

        filter_field = 'loglevel'
        filter_list = LogData().get_loglevels(self.conn)
        facet_field = 'component'
        test_scenario()

    def test_loglevel_by_time_agg(self):
        end = datetime(2014, 2, 24, 23, 59, 59, tzinfo=pytz.utc)
        start = end - timedelta(weeks=52)
        interval = '3600s'
        test_q = {
            "query": {
                "bool": {
                    "must": [
                        {
                            "range": {
                                "@timestamp": {
                                    "gte": start.isoformat(),
                                    "lte": end.isoformat()
                                }
                            }
                        },
                        {
                            "term": {
                                "type": "syslog"
                            }
                        }
                    ]
                }
            },
            "aggs": {
                "events_by_time": {
                    "date_histogram": {
                        "field": "@timestamp",
                        "interval": interval,
                        "min_doc_count": 0
                    },
                    "aggs": {
                        "events_by_loglevel": {
                            "terms": {
                                "field": "loglevel"
                            }
                        }
                    }
                }
            }
        }
        control = self.conn.search(index="_all", body=test_q)
        result = LogData()._loglevel_by_time_agg(
            self.conn, start, end, interval, query_filter=None)
        self.assertEqual(result['aggregations'], control['aggregations'])

    def test_get_err_and_warn_hists(self):
        def test_scenario():

            test_q = {
                "query": {
                    "bool": {
                        "must": [
                            {
                                "range": {
                                    "@timestamp": {
                                        "gte": start.isoformat(),
                                        "lte": end.isoformat()
                                    }
                                }
                            },
                            {
                                "term": {
                                    "type": "syslog"
                                }
                            }
                        ]
                    }
                },
                "aggs": {
                    "events_by_time": {
                        "date_histogram": {
                            "field": "@timestamp",
                            "interval": interval,
                            "min_doc_count": 0
                        },
                        "aggs": {
                            "events_by_loglevel": {
                                "terms": {
                                    "field": "loglevel"
                                }
                            }
                        }
                    }
                }
            }
            control = self.conn.search(
                index="_all", body=test_q)
            result = LogData().get_loglevel_histogram_data(self.conn, start,
                                                           end, interval)
            self.assertEqual(result, control['aggregations'])

        end = datetime(2014, 02, 24, 23, 59, 59, tzinfo=pytz.utc)
        start = end - timedelta(weeks=52)
        interval = '1m'
        test_scenario()
        interval = '1h'
        test_scenario()
        interval = '1d'
        test_scenario()
        interval = '1w'
        test_scenario()

    def test_get_log_data(self):
        def test_scenario(sort='', level_filters={}, search_text=None):
            my_search_text = None
            if search_text:
                my_search_text = "*" + search_text + "*"

            test_q = {
                'query': {
                    'bool': {
                        'must': [
                            {
                                'range': {
                                    '@timestamp': {
                                        'gte':  start.isoformat(),
                                        'lte':  end.isoformat()
                                    }
                                }
                            },

                        ]
                    }
                }
            }

            if my_search_text:
                wildcard = {'wildcard': {'_message.raw': my_search_text}}
                test_q['query']['bool']['must'].\
                    append(wildcard)

            lev_filts = []

            for lev in [k for k in level_filters.keys() if level_filters[k]]:
                lev_filts.append(self._term_filter('loglevel', lev))

            if len(lev_filts) > 0:
                or_filt = {'or': lev_filts}
                test_q['filter'] = or_filt
                test_q = {
                    'query': {'filtered': test_q}
                }

            control = self.conn.search(index="_all", body=test_q, sort=sort)
            result = LogData().get_log_data(self.conn, start, end,
                                            0, 10, sort=sort,
                                            search_text=search_text)
            self.assertEqual(result['hits'], control['hits'])

        end = datetime(2014, 2, 24, 23, 59, 59, tzinfo=pytz.utc)
        start = end - timedelta(weeks=52)

        test_scenario()
        test_scenario(sort={'loglevel': {'order': 'asc'}})
        test_scenario(sort={'loglevel': {'order': 'desc'}})
        test_scenario(search_text="keystone.common.wsgi")
        test_scenario(sort={'loglevel': {'order': 'asc'}},
                      search_text="keystone.common.wsgi")

    def test_get_new_and_missing_nodes(self):
        short_lookback = datetime(2014, 2, 24, 0, 0, 0, tzinfo=pytz.utc)
        long_lookback = datetime(2014, 2, 14, 0, 0, 0, tzinfo=pytz.utc)
        end = datetime(2014, 2, 24, 23, 59, 59, tzinfo=pytz.utc)

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
        r1 = self.conn.search(index="_all", body=test_q1)
        r2 = self.conn.search(index="_all", body=test_q2)
        s1 = set([fac['term'] for fac in
                  r1['facets']['host_facet']['terms']])
        s2 = set([fac['term'] for fac in
                  r2['facets']['host_facet']['terms']])
        new_nodes = s2.difference(s1)
        missing_nodes = s1.difference(s2)
        logger.debug("test_q1 = ", json.dumps(test_q1))
        logger.debug("test_q2 = ", json.dumps(test_q2))
        control = {
            "missing_nodes": list(missing_nodes),
            "new_nodes": list(new_nodes)
        }
        result = LogData().get_new_and_missing_nodes(self.conn, long_lookback,
                                                     short_lookback, end)
        self.assertEqual(result, control)

    def test_get_hypervisor_stats(self):
        '''
        all tests should look at data after 2014-02-04 20:03:01 UTC.  There
        were some different data formats prior to that date that made it into
        the dev ES database.
        '''

        start = datetime(2014, 2, 20, 0, 0, 0, 0, pytz.utc)
        end = datetime(2014, 2, 24, 23, 59, 59, tzinfo=pytz.utc)
        interval = 'hour'

        test_q = {
            "query": {
                "bool": {
                    "must": [
                        {
                            "range": {
                                "@timestamp": {
                                    "gte": start.isoformat(),
                                    "lte": end.isoformat()
                                }
                            }
                        },
                        {
                            "term": {
                                "type": "goldstone_nodeinfo"
                            }
                        }
                    ]
                }
            },
            "aggs": {
                "events_by_date": {
                    "date_histogram": {
                        "field": "@timestamp",
                        "interval": interval
                    },
                    "aggs": {
                        "events_by_host": {
                            "terms": {
                                "field": "host.raw"
                            },
                            "aggs": {
                                "max_total_vcpus": {
                                    "max": {
                                        "field": "total_vcpus"
                                    }
                                },
                                "avg_total_vcpus": {
                                    "avg": {
                                        "field": "total_vcpus"
                                    }
                                },
                                "max_active_vcpus": {
                                    "max": {
                                        "field": "active_vcpus"
                                    }
                                },
                                "avg_active_vcpus": {
                                    "avg": {
                                        "field": "active_vcpus"
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        control = self.conn.search(index="_all", body=test_q, sort='')
        result = LogData().get_hypervisor_stats(self.conn, start, end,
                                                interval)
        self.assertEqual(result['aggregations'], control['aggregations'])


class IntelViewTest(SimpleTestCase):
    """Lease list view tests"""
    switch = None

    def setUp(self):
        pass

    def tearDown(self):
        pass

    def test_search_template(self):
        response = self.client.get('/intelligence/search')
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'search.html')

    def test_log_cockpit_summary(self):
        end = datetime(2014, 2, 24, 23, 59, 59, tzinfo=pytz.utc)
        start = end - timedelta(weeks=2)
        end_ts = calendar.timegm(end.utctimetuple())
        start_ts = calendar.timegm(start.utctimetuple())
        response = self.client.get(
            '/intelligence/log/cockpit/data?start_time=' +
            str(start_ts) + "&end_time=" + str(end_ts))
        self.assertEqual(response.status_code, 200)

    def test_host_presence_data(self):

        test_parameters = [
            'lookbackQty=10&lookbackUnit=minutes&comparisonQty=1' +
            '&comparisonUnit=minutes',
            'lookbackQty=10&lookbackUnit=hours&comparisonQty=1' +
            '&comparisonUnit=hours',
            'lookbackQty=10&lookbackUnit=days&comparisonQty=1' +
            '&comparisonUnit=days',
            'lookbackQty=10&lookbackUnit=weeks&comparisonQty=1' +
            '&comparisonUnit=days'
        ]

        for params in test_parameters:
            uri = '/intelligence/host_presence_stats?' + params + \
                  '&sEcho=6&iColumns=2&sColumns=host%2Cstatus&' + \
                  'iDisplayStart=0&iDisplayLength=-1&mDataProp_0=0' + \
                  '&mDataProp_1=1&iSortCol_0=0&sSortDir_0=asc&_=1'

            logger.debug("testing URI [%s]", uri)
            response = self.client.get(uri)
            self.assertEqual(response.status_code, 200)
            self.assertDictContainsSubset({'sEcho': 6},
                                          json.loads(response.content))

    @skip('deprecated')
    def test_get_cpu_stats_view(self):
        end = datetime.now(tz=pytz.utc)
        start = datetime(2014, 3, 12, 0, 0, 0, tzinfo=pytz.utc)
        end_ts = calendar.timegm(end.utctimetuple())
        start_ts = calendar.timegm(start.utctimetuple())

        uri = '/intelligence/compute/cpu_stats?start_time=' + \
              str(start_ts) + "&end_time=" + str(end_ts) + "&interval=3600s"

        response = self.client.get(uri)
        logger.debug("[test_get_cpu_stats_view] uri = %s", uri)
        self.assertEqual(response.status_code, 200)
        self.assertNotEqual(json.loads(response.content), [])
        logger.debug("[test_get_cpu_stats_view] response = %s",
                     json.loads(response.content))

    @skip('deprecated')
    def test_get_mem_stats_view(self):
        end = datetime.now(tz=pytz.utc)
        start = datetime(2014, 3, 12, 0, 0, 0, tzinfo=pytz.utc)
        end_ts = calendar.timegm(end.utctimetuple())
        start_ts = calendar.timegm(start.utctimetuple())

        uri = '/intelligence/compute/mem_stats?start_time=' + \
              str(start_ts) + "&end_time=" + str(end_ts) + "&interval=3600s"

        response = self.client.get(uri)
        logger.debug("[test_get_mem_stats_view] uri = %s", uri)
        self.assertEqual(response.status_code, 200)
        self.assertNotEqual(json.loads(response.content), [])
        logger.debug("[test_get_mem_stats_view] response = %s",
                     json.loads(response.content))

    @skip('deprecated')
    def test_get_phys_cpu_stats_view(self):
        end = datetime.now(tz=pytz.utc)
        start = datetime(2014, 3, 12, 0, 0, 0, tzinfo=pytz.utc)
        end_ts = calendar.timegm(end.utctimetuple())
        start_ts = calendar.timegm(start.utctimetuple())

        uri = '/intelligence/compute/phys_cpu_stats?start_time=' + \
              str(start_ts) + "&end_time=" + str(end_ts) + "&interval=3600s"

        response = self.client.get(uri)
        logger.debug("[test_get_phys_cpu_stats_view] uri = %s", uri)
        self.assertEqual(response.status_code, 200)
        self.assertNotEqual(json.loads(response.content), [])
        logger.debug("[test_get_phys_cpu_stats_view] response = %s",
                     json.loads(response.content))

    @skip('deprecated')
    def test_get_virt_cpu_stats_view(self):
        end = datetime.now(tz=pytz.utc)
        start = datetime(2014, 3, 12, 0, 0, 0, tzinfo=pytz.utc)
        end_ts = calendar.timegm(end.utctimetuple())
        start_ts = calendar.timegm(start.utctimetuple())

        uri = '/intelligence/compute/virt_cpu_stats?start_time=' + \
              str(start_ts) + "&end_time=" + str(end_ts) + "&interval=3600s"

        response = self.client.get(uri)
        logger.debug("[test_get_virt_cpu_stats_view] uri = %s", uri)
        self.assertEqual(response.status_code, 200)
        self.assertNotEqual(json.loads(response.content), [])
        logger.debug("[test_get_virt_cpu_stats_view] response = %s",
                     json.loads(response.content))

    @skip('deprecated')
    def test_get_phys_mem_stats_view(self):
        end = datetime.now(tz=pytz.utc)
        start = datetime(2014, 3, 12, 0, 0, 0, tzinfo=pytz.utc)
        end_ts = calendar.timegm(end.utctimetuple())
        start_ts = calendar.timegm(start.utctimetuple())

        uri = '/intelligence/compute/phys_mem_stats?start_time=' + \
              str(start_ts) + "&end_time=" + str(end_ts) + "&interval=3600s"

        response = self.client.get(uri)
        logger.debug("[test_get_phys_mem_stats_view] uri = %s", uri)
        self.assertEqual(response.status_code, 200)
        self.assertNotEqual(json.loads(response.content), [])
        logger.debug("[test_get_phys_mem_stats_view] response = %s",
                     json.loads(response.content))

    @skip('deprecated')
    def test_get_virt_mem_stats_view(self):
        end = datetime.now(tz=pytz.utc)
        start = datetime(2014, 3, 12, 0, 0, 0, tzinfo=pytz.utc)
        end_ts = calendar.timegm(end.utctimetuple())
        start_ts = calendar.timegm(start.utctimetuple())

        uri = '/intelligence/compute/virt_mem_stats?start_time=' + \
              str(start_ts) + "&end_time=" + str(end_ts) + "&interval=3600s"

        response = self.client.get(uri)
        logger.debug("[test_get_virt_mem_stats_view] uri = %s", uri)
        self.assertEqual(response.status_code, 200)
        self.assertNotEqual(json.loads(response.content), [])
        logger.debug("[test_get_virt_mem_stats_view] response = %s",
                     json.loads(response.content))

    @skip('deprecated')
    def test_get_phys_disk_stats_view(self):
        end = datetime.now(tz=pytz.utc)
        start = datetime(2014, 3, 12, 0, 0, 0, tzinfo=pytz.utc)
        end_ts = calendar.timegm(end.utctimetuple())
        start_ts = calendar.timegm(start.utctimetuple())

        uri = '/intelligence/compute/phys_disk_stats?start_time=' + \
              str(start_ts) + "&end_time=" + str(end_ts) + "&interval=3600s"

        response = self.client.get(uri)
        logger.debug("[test_get_phys_disk_stats_view] uri = %s", uri)
        self.assertEqual(response.status_code, 200)
        self.assertNotEqual(json.loads(response.content), [])
        logger.debug("[test_get_phys_disk_stats_view] response = %s",
                     json.loads(response.content))

    # the URI is being used for GSL.  Need to review contents of agent
    # payload and reconcile with data from logs.
    # def test_vcpu_stats_view(self):
    #     start = datetime(2014, 12, 31, 23, 59, 59, tzinfo=pytz.utc)
    #     end = datetime(2014, 1, 1, 0, 0, 0, tzinfo=pytz.utc)
    #     end_ts = calendar.timegm(end.utctimetuple())
    #     start_ts = calendar.timegm(start.utctimetuple())
    #     uri = '/intelligence/compute/vcpu_stats?start_time=' + \
    #           str(start_ts) + "&end_time=" + str(end_ts) + "&interval=hour"
    #
    #     # Test GSL
    #     switch, created = Switch.objects.get_or_create(name='gse',
    #                                                    active=False)
    #     self.assertNotEqual(switch, None)
    #     response = self.client.get(uri)
    #     self.assertEqual(response.status_code, 404)
    #
    #     # Test GSE
    #     switch.active = True
    #     switch.save()
    #     response = self.client.get(uri)
    #     self.assertEqual(response.status_code, 200)
    #     self.assertIsNot(json.loads(response.content), [])
