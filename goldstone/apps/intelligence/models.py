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

logger = logging.getLogger(__name__)


#
# query construction helpers
#
def _query_base():
    return {
        "query": {}
    }


def _filtered_query_base(filter={}, query={}):
    return {
        "query": {
            "filtered": {
                "query": query,
                "filter": filter
            }
        }
    }


def _add_facet(q, facet):
        result = q.copy()
        if not 'facets' in result:
            result['facets'] = {}

        result['facets'][facet.keys()[0]] = facet[facet.keys()[0]]
        return result


def _term_clause(field, value):
    return {
        "term": {
            field: value
        }
    }


def _terms_clause(field):
    return {
        "terms": {
            "field": field
        }
    }


def _bool_clause(must=[], must_not=[]):
    return {
        "bool": {
            "must": must,
            "must_not": must_not
        }
    }


def _range_clause(field, start, end, gte=True, lte=True, facet=None):
        start_op = "gte" if gte else "gt"
        end_op = "lte" if lte else "lt"
        result = {
            "range": {
                field: {
                    start_op: start,
                    end_op: end
                }
            }
        }

        if facet:
            result = _add_facet(result, facet)

        return result


def _agg_date_hist(interval, field="@timestamp", name="events_by_date",
                   min_doc_count=0):
    return {
        name: {
            "date_histogram": {
                "field": field,
                "interval": interval,
                "min_doc_count": min_doc_count
            }
        }
    }


def _agg_filter_term(field, value, name):
    return {
        name: {
            "filter": {
                "term": {
                    field: value
                }
            }
        }
    }


def _max_aggs_clause(name, field):
    return {
        name: {
            "max": {
                "field": field
            }
        }
    }


def _agg_clause(name, clause):
    return {
        name: clause
    }


class GSConnection(object):
    conn = None

    def __init__(self, server=settings.ES_SERVER):
        self.conn = Elasticsearch(server)


class SpawnData(object):
    _START_DOC_TYPE = 'nova_spawn_start'
    _FINISH_DOC_TYPE = 'nova_spawn_finish'
    _conn = GSConnection().conn

    def __init__(self, start, end, interval):
        self.start = start
        self.end = end
        self.interval = interval

    def _spawn_start_query(self, agg_name="events_by_date"):
        q = _query_base()
        q['query'] = _range_clause('@timestamp',
                                   self.start.isoformat(),
                                   self.end.isoformat())
        q['aggs'] = _agg_date_hist(self.interval, name=agg_name)
        return q

    def _spawn_finish_query(self, success):
        filter_name = "success_filter"
        agg_name = "events_by_date"
        q = _query_base()
        q['query'] = _range_clause('@timestamp',
                                   self.start.isoformat(),
                                   self.end.isoformat())
        q['aggs'] = _agg_filter_term("success", str(success).lower(),
                                     filter_name)
        q['aggs'][filter_name]['aggs'] = _agg_date_hist(
            self.interval, name=agg_name)
        return q

    def get_spawn_start(self):
        """Return a pandas dataframe with the results of a query for nova spawn
        start events"""
        agg_name = "events_by_date"
        q = self._spawn_start_query(agg_name)
        logger.debug("[get_spawn_start] query = %s", json.dumps(q))
        response = self._conn.search(index="_all",
                                     doc_type=self._START_DOC_TYPE,
                                     body=q, size=0)
        logger.debug("[get_spawn_start] response = %s", json.dumps(response))
        return pd.read_json(json.dumps(
            response['aggregations'][agg_name]['buckets'])
        )

    def _get_spawn_finish(self, success):
        fname = "success_filter"
        aname = "events_by_date"
        q = self._spawn_finish_query(success)
        logger.debug("[get_spawn_finish] query = %s", json.dumps(q))
        response = self._conn.search(index="_all",
                                     doc_type=self._FINISH_DOC_TYPE,
                                     body=q, size=0)
        logger.debug("[get_spawn_finish] response = %s", json.dumps(response))
        return pd.read_json(json.dumps(
            response['aggregations'][fname][aname]['buckets'])
        )

    def get_spawn_success(self):
        """Return a pandas dataframe with the results of a query for nova spawn
        success events"""
        return self._get_spawn_finish(True)

    def get_spawn_failure(self):
        """Return a pandas dataframe with the results of a query for nova spawn
        failure events"""
        return self._get_spawn_finish(False)


class NovaResourceData(object):
    _PHYS_DOC_TYPE = 'nova_claims_summary_phys'
    _VIRT_DOC_TYPE = 'nova_claims_summary_virt'
    _TYPE_FIELDS = {
        'physical': ['total', 'used'],
        'virtual': ['limit', 'free']
    }
    _conn = GSConnection().conn

    def __init__(self, start, end, interval, resource_type):
        """
        :arg start: datetime used to filter the query range
        :arg end: datetime used to filter the query range
        :arg interval: string representation of the time interval to use when
            aggregating the results.  Form should be something like: '1.5s'.
            Supported time postfixes are s, m, h, d, w, m.
        :arg resource_type: one of 'physical' or 'virtual'
        """
        assert type(start) is datetime, "start is not a datetime: %r" % start
        assert type(end) is datetime, "end is not a datetime: %r" % end
        assert type(interval) is StringType, "interval is not a string: %r" \
            % interval
        assert interval[-1] in ['s', 'm', 'h', 'd'], \
            "valid units for interval are ['s', 'm', 'h', 'd']: %r" \
            % interval
        assert resource_type in ['physical', 'virtual'], \
            "resource_type must be one of ['physical', 'virtual']: %r" \
            % resource_type

        self.start = start
        self.end = end
        self.interval = interval
        self.resource_type = resource_type

    def _claims_resource_query(self, resource):
        date_agg_name = "events_by_date"
        host_agg_name = "events_by_host"
        max_total_agg = "max_total"
        max_used_agg = self._TYPE_FIELDS[self.resource_type][1]

        range_filter = _range_clause('@timestamp', self.start.isoformat(),
                                     self.end.isoformat())
        term_filter = _term_clause('resource', resource)
        q = _filtered_query_base(_bool_clause([range_filter, term_filter]),
                                 {'match_all': {}})

        tl_aggs_clause = _agg_date_hist(self.interval, name=date_agg_name)
        host_aggs_clause = _agg_clause(host_agg_name,
                                       _terms_clause("host.raw"))
        stats_aggs_clause = dict(
            _max_aggs_clause(max_total_agg,
                             self._TYPE_FIELDS[self.resource_type][0]).
            items() +
            _max_aggs_clause(max_used_agg,
                             self._TYPE_FIELDS[self.resource_type][1]).items())
        host_aggs_clause[host_agg_name]['aggs'] = stats_aggs_clause
        tl_aggs_clause[date_agg_name]['aggs'] = host_aggs_clause
        q['aggs'] = tl_aggs_clause
        return q

    def _get_resource(self, resource_type, resource):
        q = self._claims_resource_query(resource)
        doc_type = self._PHYS_DOC_TYPE
        if resource_type == 'virtual':
            doc_type = self._VIRT_DOC_TYPE
        # TODO GOLD-275 need an error handling strategy for ES queries
        r = self._conn.search(index="_all", body=q, size=0, doc_type=doc_type)
        return pd.read_json(json.dumps(r))

    def get_phys_cpu_usage(self):
        result = self._get_resource('physical', 'cpu')
        logger.debug('[get_phys_cpu_usage] result = ' + result)
        return result

    def get_virt_cpu_usage(self):
        result = self._get_resource('virtual', 'cpu')
        logger.debug('[get_virt_cpu_usage] result = ' + result)
        return result

    def get_phys_mem_usage(self):
        result = self._get_resource('physical', 'memory')
        logger.debug('[get_phys_mem_usage] result = ' + result)
        return result

    def get_virt_mem_usage(self):
        result = self._get_resource('virtual', 'memory')
        logger.debug('[get_virt_mem_usage] result = ' + result)
        return result

    def get_phys_disk_usage(self):
        result = self._get_resource('physical', 'disk')
        logger.debug('[get_phys_disk_usage] result = ' + result)
        return result
    

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
        if not 'facets' in result:
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

    @staticmethod
    def _claims_resource_query(start, end, interval, resource,
                               event_type):

        type_field = {
            'nova_claims_summary_phys': ['total', 'max_used',
                                         'avg_used', 'used'],
            'nova_claims_summary_virt': ['limit', 'max_free',
                                         'avg_free', 'free']
        }

        return {
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
                                "resource": resource
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
                                "max_total": {
                                    "max": {
                                        "field": type_field[event_type][0]
                                    }
                                },
                                "avg_total": {
                                    "avg": {
                                        "field": type_field[event_type][0]
                                    }
                                },
                                type_field[event_type][1]: {
                                    "max": {
                                        "field": type_field[event_type][3]
                                    }
                                },
                                type_field[event_type][2]: {
                                    "avg": {
                                        "field": type_field[event_type][3]
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

    def gsl_phys_cpu_stats(self, conn, start, end, interval, first=0,
                           size=10, sort=''):
        q = self._claims_resource_query(start, end, interval, 'cpu',
                                        'nova_claims_summary_phys')
        logger.debug('[gsl_phys_cpu_stats] query = ' + json.dumps(q))
        result = conn.search(index="_all", doc_type="nova_claims_summary_phys",
                             body=q, from_=first, size=size, sort=sort)
        logger.debug('[gsl_phys_cpu_stats] result = ' + json.dumps(result))
        return result

    def gsl_virt_cpu_stats(self, conn, start, end, interval, first=0,
                           size=10, sort=''):
        q = self._claims_resource_query(start, end, interval, 'cpu',
                                        'nova_claims_summary_virt')
        logger.debug('[gsl_virt_cpu_stats] query = ' + json.dumps(q))
        result = conn.search(index="_all", doc_type='nova_claims_summary_virt',
                             body=q, from_=first, size=size, sort=sort)
        logger.debug('[gsl_virt_cpu_stats] result = ' + json.dumps(result))
        return result

    def gsl_phys_mem_stats(self, conn, start, end, interval, first=0,
                           size=10, sort=''):
        q = self._claims_resource_query(start, end, interval, 'memory',
                                        'nova_claims_summary_phys')
        logger.debug('[gsl_phys_mem_stats] query = ' + json.dumps(q))
        result = conn.search(index="_all", doc_type='nova_claims_summary_phys',
                             body=q, from_=first, size=size, sort=sort)
        logger.debug('[gsl_phys_mem_stats] result = ' + json.dumps(result))
        return result

    def gsl_virt_mem_stats(self, conn, start, end, interval, first=0,
                           size=10, sort=''):
        q = self._claims_resource_query(start, end, interval, 'memory',
                                        'nova_claims_summary_virt')
        logger.debug('[gsl_virt_mem_stats] query = ' + json.dumps(q))
        result = conn.search(index="_all", doc_type='nova_claims_summary_virt',
                             body=q, from_=first, size=size, sort=sort)
        logger.debug('[gsl_virt_mem_stats] result = ' + json.dumps(result))
        return result

    def gsl_phys_disk_stats(self, conn, start, end, interval, first=0,
                            size=10, sort=''):
        q = self._claims_resource_query(start, end, interval, 'disk',
                                        'nova_claims_summary_phys')
        logger.debug('[gsl_phys_disk_stats] query = ' + json.dumps(q))
        result = conn.search(index="_all", doc_type='nova_claims_summary_phys',
                             body=q, from_=first, size=size, sort=sort)
        logger.debug('[gsl_phys_disk_stats] result = ' + json.dumps(result))
        return result

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
