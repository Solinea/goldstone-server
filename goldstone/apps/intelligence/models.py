# vim: tabstop=4 shiftwidth=4 softtabstop=4

#
# Copyright 2014 Solinea, Inc.
#
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

    # TODO GOLD-270 refactor _range_query out and use the module method
    def _range_query(self, field, start, end, gte=True, lte=True, facet=None):

        start_op = "gte" if gte else "gt"
        end_op = "lte" if lte else "lt"
        result = {
            "query": {
                "range": {
                    field: {
                        start_op: start,
                        end_op: end
                    }
                }
            }
        }

        if facet:
            result = self._add_facet(result, facet)

        return result

    # TODO GOLD-271 refactor _add_facet out and use the module method
    @staticmethod
    def _add_facet(q, facet):

        result = q.copy()
        if 'facets' not in result:
            result['facets'] = {}

        result['facets'][facet.keys()[0]] = facet[facet.keys()[0]]
        return result

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
                                "type": ["syslog", "openstack_log"]
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

    def range_filter_facet(self, conn, start, end, filter_field, filter_value,
                           facet_field, facet_order=None):

        filt = self._term_filter(filter_field, filter_value)
        fac = self._term_facet(facet_field, facet_field, filt, order='term')
        rangeq = self._range_query('@timestamp', start.isoformat(),
                                   end.isoformat())
        rangeq = self._add_facet(rangeq, fac)
        logger.debug("[range_filter_facet] query = %s", rangeq)
        return conn.search(index="_all", body=rangeq)

    def aggregate_facets(self, conn, start, end, filter_field, filter_list,
                         facet_field):

        result = {}
        for filt in filter_list:
            rff = self.range_filter_facet(conn, start, end, filter_field, filt,
                                          facet_field)
            result[filt] = rff['facets']

        return result

    def get_loglevel_histogram_data(self, conn, start, end, interval):

        result = self._loglevel_by_time_agg(conn, start, end,
                                            interval)['aggregations']

        return result

    def get_log_data(self, conn, start_t, end_t, first, size,
                     level_filters=dict(), sort='', search_text=None):

        if search_text:
            search_text = "*" + search_text + "*"

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

            sq = {
                "wildcard": {
                    "_message.raw": search_text
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

        logger.debug("[get_log_data] query = %s", q)
        return conn.search(index="_all", body=q, from_=first, size=size,
                           sort=sort)

    def get_new_and_missing_nodes(self, conn, long_lookback, short_lookback,
                                  end=datetime.now(tz=pytz.utc)):

        logger.debug("[get_new_and_missing_nodes] long_lookback = %s",
                     long_lookback.isoformat())
        logger.debug("[get_new_and_missing_nodes], short_lookback = %s",
                     short_lookback.isoformat())

        host_facet = self._term_facet('host_facet', 'host.raw',
                                      all_terms=False, order='term')
        q1 = self._range_query('@timestamp', long_lookback.isoformat(),
                               short_lookback.isoformat(), facet=host_facet)
        q2 = self._range_query('@timestamp', short_lookback.isoformat(),
                               end.isoformat(),
                               facet=host_facet)

        r1 = conn.search(index="_all", body=q1)
        r2 = conn.search(index="_all", body=q2)

        logger.debug("[get_new_and_missing_nodes] query1 = %s", q1)
        logger.debug("[get_new_and_missing_nodes], query2 = %s", q2)

        # new hosts are in q2, but not in q1
        # absent hosts are in q1, but not in q2
        # everything else is less interesting

        s1 = set([fac['term'] for fac in
                  r1['facets']['host_facet']['terms']])
        s2 = set([fac['term'] for fac in
                  r2['facets']['host_facet']['terms']])

        new_nodes = s2.difference(s1)
        missing_nodes = s1.difference(s2)
        logger.debug("[get_new_and_missing_nodes] missing_nodes = %s",
                     missing_nodes)
        logger.debug("[get_new_and_missing_nodes] new_nodes = %s", new_nodes)
        return {
            "missing_nodes": list(missing_nodes),
            "new_nodes": list(new_nodes)
        }

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
