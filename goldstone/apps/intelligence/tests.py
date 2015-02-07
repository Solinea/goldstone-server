# Copyright 2014 - 2015 Solinea, Inc.
#
# Licensed under the Solinea Software License Agreement (goldstone),
# Version 1.0 (the "License"); you may not use this file except in compliance
# with the License. You may obtain a copy of the License at:
#
#     http://www.solinea.com/goldstone/LICENSE.pdf
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either expressed or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

from django.test import SimpleTestCase
from goldstone.models import GSConnection
from .models import *
import json
from datetime import *
import pytz
import logging
from elasticsearch import *

logger = logging.getLogger(__name__)


class LogDataModel(SimpleTestCase):
    conn = GSConnection().conn

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

        comps = LogData().get_components()
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

        comps = LogData().get_loglevels()
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
            start, end, interval, query_filter=None)
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
            result = LogData().get_loglevel_histogram_data(start,
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
            result = LogData().get_log_data(start, end,
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
        result = LogData().get_hypervisor_stats(start, end,
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
