# Copyright 2014 Solinea, Inc.
#
# Licensed under the Solinea Software License Agreement (goldstone),
# Version 1.0 (the "License"); you may not use this file except in compliance
# with the License. You may obtain a copy of the License at:
#
#     http://www.solinea.com/goldstone/LICENSE.pdf
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

__author__ = 'John Stanford'

from types import StringType
from django.db import models
from django.conf import settings
from datetime import *
from elasticsearch import *
import pytz
import calendar
import logging
import json
import pandas as pd
from goldstone.models import ESData

logger = logging.getLogger(__name__)


class LogData(object):
    @staticmethod
    def _subtract_months(sourcedate, months):

        month = sourcedate.month - 1 - months
        year = sourcedate.year + month / 12
        month = month % 12 + 1
        day = min(sourcedate.day, calendar.monthrange(year, month)[1])
        return datetime(year, month, day, sourcedate.hour,
                        sourcedate.minute, sourcedate.second,
                        sourcedate.microsecond, sourcedate.tzinfo)

    def _calc_start(self, end, unit):

        if unit == "hour":
            t = end - timedelta(hours=1)
        elif unit == "day":
            t = end - timedelta(days=1)
        elif unit == "week":
            t = end - timedelta(weeks=1)
        else:
            t = self._subtract_months(end, 1)
        return t.replace(tzinfo=pytz.utc)

    @staticmethod
    def _term_filter(field, value):

        return {
            "term": {
                field: value
            }
        }

    @staticmethod
    def _regexp_filter(field, value):

        return {
            "regexp": {
                field: value
            }
        }

    @staticmethod
    def _term_facet(name, field, facet_filter=None, all_terms=True,
                    order=None):
        result = {
            name: {
                "terms": {
                    "field": field,
                    "all_terms": all_terms
                }
            }
        }

        if order:
            result[name]['terms']['order'] = order

        if facet_filter:
            result[name]['facet_filter'] = facet_filter

        return result

    @staticmethod
    def _date_hist_facet(name, field, interval, facet_filter=None):
        result = {
            name: {
                "date_histogram": {
                    "field": field,
                    "interval": interval
                }
            }
        }

        if facet_filter:
            result[name]['facet_filter'] = facet_filter

        return result

    def _get_term_facet_terms(self, conn, facet_field):
        fac = self._term_facet(facet_field, facet_field, order='term')
        q = dict(query={
            'match_all': {}
        })

        q['facets'] = {}
        q['facets'][fac.keys()[0]] = fac[fac.keys()[0]]
        logger.debug("[_get_term_facet_terms] query = %s", q)
        rs = conn.search(index="_all", body=q)
        return [d['term'] for d in rs['facets'][facet_field]['terms']]

    @staticmethod
    def get_connection(server):
        return Elasticsearch(server)

    def _loglevel_by_time_agg(self, conn, start, end, interval,
                              query_filter=None):
        logger.debug("[_loglevel_by_time_agg] ENTERING>>")
        logger.debug("[_loglevel_by_time_agg] interval = %s", interval)
        logger.debug("[_loglevel_by_time_agg] start = %s", start.isoformat())
        logger.debug("[_loglevel_by_time_agg] end = %s", end.isoformat())
        q = {
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
                            "terms": {
                                "type": ["syslog"]
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
        logger.debug("[_loglevel_by_time_agg] query = %s", json.dumps(q))
        result = conn.search(index="_all", body=q)
        logger.debug("[_loglevel_by_time_agg] result = %s", json.dumps(result))
        return result

    def get_components(self, conn):
        return self._get_term_facet_terms(conn, "component")

    def get_loglevels(self, conn):
        return self._get_term_facet_terms(conn, "loglevel")

    def get_loglevel_histogram_data(self, conn, start, end, interval):

        result = self._loglevel_by_time_agg(conn, start, end,
                                            interval)['aggregations']

        return result

    def _escape(self, str):
        """Escape lucene reserved characters in string."""
        s = list(str)
        reserved = ["+", "-" "!", "(", ")", "{", "}", "[", "]", '"',
                    "~", ":", "\\", "/"]
        for i, c in enumerate(str):
            if c in reserved:
                if c == "\000":
                    s[i] = "\\000"
                else:
                    s[i] = "\\" + c
        return str[:0].join(s)

    def get_log_data(self, conn, start_t, end_t, first, size,
                     level_filters=dict(), sort='', search_text=None):

        q = {
            "query": {
                "bool": {
                    "must": [
                        {
                            "range": {
                                "@timestamp": {
                                    "gte": start_t.isoformat(),
                                    "lte": end_t.isoformat()
                                }
                            }
                        }
                    ]
                }

            }
        }

        if search_text:
            escaped_search_text = self._escape(search_text)

            sq = {
                "query_string": {
                    "default_operator": "AND",
                    "query": escaped_search_text,
                    "lenient": "true"
                }
            }
            q['query']['bool']['must'].append(sq)

        lev_filts = []

        for lev in [k for k in level_filters.keys() if level_filters[k]]:
                lev_filts.append(self._term_filter('loglevel', lev))

        if len(lev_filts) > 0:
            or_filt = {'or': lev_filts}
            q['filter'] = or_filt
            q = {
                'query': {'filtered': q}
            }

        logger.debug("[get_log_data] query = %s", json.dumps(q))
        return conn.search(index="_all", body=q, from_=first, size=size,
                           sort=sort)

    def get_hypervisor_stats(self, conn, start, end, interval, first=0,
                             size=10, sort=''):

        q = {
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
                        "interval": interval,
                        "min_doc_count": 0
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

        result = conn.search(index="_all", body=q, from_=first, size=size,
                             sort=sort)
        logger.debug('result = ' + json.dumps(result))
        return result
