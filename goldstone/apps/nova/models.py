# vim: tabstop=4 shiftwidth=4 softtabstop=4

#
# Copyright 2014 Solinea, Inc.
#


import logging
import json
from datetime import datetime
from types import StringType

import pandas as pd

from goldstone.models import ESData


logger = logging.getLogger(__name__)


class NovaClientData(ESData):
    """
    abstract class for data pulled from nova client.  Override _DOC_TYPE
    """
    _DOC_TYPE = None
    _INDEX_PREFIX = 'logstash-'

    def get_date_range(self, start, end, first=0, count=10, sort='desc'):
        """
        get Availability Zone for a date range from the database.
        :arg start: datetime of early boundary
        :arg end: datetime of late boundary
        :arg first: index of first record (optional)
        :arg count: max number of records (optional)
        :arg sort: sort order {'asc', 'desc'} (optional)
        :return array of records
        """
        q = ESData._filtered_query_base()
        q['query']['filtered']['query'] = {'match_all': {}}
        q['query']['filtered']['filter'] = ESData._range_clause(
            '@timestamp',
            start.isoformat(),
            end.isoformat())
        logger.debug("[get_date_range] query = %s", json.dumps(q))
        response = self._conn.search(index="_all",
                                     doc_type=self._DOC_TYPE,
                                     body=q, size=count, from_=first,
                                     sort={'@timestamp': sort})
        logger.debug("[get_date_range] response = %s", json.dumps(response))
        return [h['_source'] for h in response['hits']['hits']]

    def get(self, count=1):
        """
        get the last count Availability Zone records from the database.
        :arg count: number of records to return
        :return array of records
        """
        q = {'query': {'match_all': {}}}
        response = self._conn.search(index="_all",
                                     doc_type=self._DOC_TYPE,
                                     body=q, size=count,
                                     sort={'@timestamp': 'desc'})
        logger.debug("[get] response = %s", json.dumps(response))
        return [h['_source'] for h in response['hits']['hits']]

    def post(self, body):
        """
        posts an Availability Zone record to the database.
        :arg body: record body as JSON object
        :return id of the inserted record
        """
        response = self._conn.create(
            ESData._get_latest_index(self, self._INDEX_PREFIX),
            self._DOC_TYPE, body, refresh=True)
        logger.debug('[post] response = %s', json.dumps(response))
        return response['_id']

    def delete(self, doc_id):
        """
        deletes an Availability Zone record from the database by id.
        :arg doc_id: the id of the doc as returned by post
        :return bool
        """
        q = ESData._query_base()
        q['query'] = ESData._term_clause("_id", doc_id)
        response = self._conn.delete_by_query("_all", self._DOC_TYPE, body=q)
        logger.debug("[delete] response = %s", json.dumps(response))

        # need to test for a single index case where there is no "all" field
        if 'all' in response['_indices']:
            return not bool(response['_indices']['all']['_shards']['failed'])
        else:
            return not bool(response['_indices'].
                            values()[0]['_shards']['failed'])


class AvailabilityZoneData(NovaClientData):
    _DOC_TYPE = 'nova_availability_zones'


class HypervisorStatsData(NovaClientData):
    _DOC_TYPE = 'nova_hypervisor_stats'


class SpawnData(ESData):
    _START_DOC_TYPE = 'nova_spawn_start'
    _FINISH_DOC_TYPE = 'nova_spawn_finish'

    def __init__(self, start, end, interval):
        self.start = start
        self.end = end
        self.interval = interval

    def _spawn_start_query(self, agg_name="events_by_date"):
        q = ESData._query_base()
        q['query'] = ESData._range_clause('@timestamp',
                                          self.start.isoformat(),
                                          self.end.isoformat())
        q['aggs'] = ESData._agg_date_hist(self.interval, name=agg_name)
        return q

    def _spawn_finish_query(self, success):
        filter_name = "success_filter"
        agg_name = "events_by_date"
        q = ESData._query_base()
        q['query'] = ESData._range_clause('@timestamp',
                                          self.start.isoformat(),
                                          self.end.isoformat())
        q['aggs'] = ESData._agg_filter_term("success",
                                            str(success).lower(),
                                            filter_name)
        q['aggs'][filter_name]['aggs'] = ESData._agg_date_hist(self.interval,
                                                               name=agg_name)
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
        data = pd.read_json(json.dumps(
            response['aggregations'][fname][aname]['buckets']),
            orient='records')

        logger.debug("[get_spawn_finish] data = %s", data)
        return data

    def get_spawn_success(self):
        """Return a pandas dataframe with the results of a query for nova spawn
        success events"""
        return self._get_spawn_finish(True)

    def get_spawn_failure(self):
        """Return a pandas dataframe with the results of a query for nova spawn
        failure events"""
        return self._get_spawn_finish(False)


class ApiPerfData(ESData):
    _DOC_TYPE = 'openstack_api_stats'

    def __init__(self, start, end, interval):
        """
        :arg start: datetime used to filter the query range
        :arg end: datetime used to filter the query range
        :arg interval: string representation of the time interval to use when
        aggregating the results.  Form should be something like: '1.5s'.
        Supported time postfixes are s, m, h, d, w, m.
        """
        assert type(start) is datetime, "start is not a datetime: %r" % \
                                        type(start)
        assert type(end) is datetime, "end is not a datetime: %r" % type(end)
        assert type(interval) in [StringType,
                                  unicode], "interval is not a string: %r" \
                                            % type(interval)
        assert interval[-1] in ['s', 'm', 'h', 'd'], \
            "valid units for interval are ['s', 'm', 'h', 'd']: %r" \
            % interval

        self.start = start
        self.end = end
        self.interval = interval

    def _api_perf_query(self):
        """
        Sets up a query that does aggregations on the response_time field min,
        max, avg for the bucket.
        """
        range_filter = self._range_clause('@timestamp', self.start.isoformat(),
                                          self.end.isoformat())
        q = self._filtered_query_base(self._bool_clause(
            [range_filter]), {'match_all': {}})
        date_agg = self._agg_date_hist(self.interval)
        stats_agg = self._ext_stats_aggs_clause("stats", "response_time")
        http_response_agg = self._http_response_aggs_clause("range",
                                                            "response_status")
        date_agg['events_by_date']['aggs'] = dict(stats_agg.items() +
                                                  http_response_agg.items())
        q['aggs'] = date_agg
        logger.debug('[_api_perf_query] query = ' + json.dumps(q))
        return q

    def get(self):
        q = self._api_perf_query()
        r = self._conn.search(index="_all", body=q, doc_type=self._DOC_TYPE)
        logger.debug('[get] search response = = %s', json.dumps(r))
        items = []
        for date_bucket in r['aggregations']['events_by_date']['buckets']:
            logger.debug("[get] processing date_bucket: %s",
                         json.dumps(date_bucket))
            item = {'key': date_bucket['key']}
            item = dict(item.items() + date_bucket['stats'].items())
            item['2xx'] = \
                date_bucket['range']['buckets']['200.0-299.0']['doc_count']
            item['3xx'] = \
                date_bucket['range']['buckets']['300.0-399.0']['doc_count']
            item['4xx'] = \
                date_bucket['range']['buckets']['400.0-499.0']['doc_count']
            item['5xx'] = \
                date_bucket['range']['buckets']['500.0-599.0']['doc_count']

            items.append(item)

        logger.info('[get] items = %s', json.dumps(items))
        result = pd.read_json(json.dumps(items), orient='records',
                              convert_axes=False)
        logger.info('[get] pd = %s', result)
        return result


class ResourceData(ESData):
    _PHYS_DOC_TYPE = 'nova_claims_summary_phys'
    _VIRT_DOC_TYPE = 'nova_claims_summary_virt'
    _TYPE_FIELDS = {
        'physical': ['total', 'used'],
        'virtual': ['limit', 'free']
    }

    def __init__(self, start, end, interval):
        """
        :arg start: datetime used to filter the query range
        :arg end: datetime used to filter the query range
        :arg interval: string representation of the time interval to use when
            aggregating the results.  Form should be something like: '1.5s'.
            Supported time postfixes are s, m, h, d, w, m.
        """
        assert type(start) is datetime, "start is not a datetime: %r" % \
                                        type(start)
        assert type(end) is datetime, "end is not a datetime: %r" % type(end)
        assert type(interval) in [StringType,
                                  unicode], "interval is not a string: %r" \
                                            % type(interval)
        assert interval[-1] in ['s', 'm', 'h', 'd'], \
            "valid units for interval are ['s', 'm', 'h', 'd']: %r" \
            % interval

        self.start = start
        self.end = end
        self.interval = interval

    def _claims_resource_query(self, resource_type, resource):
        date_agg_name = "events_by_date"
        host_agg_name = "events_by_host"
        max_total_agg = "max_total"
        used_or_free_agg = self._TYPE_FIELDS[resource_type][1]

        # virtual resource report free instead of used.  We need to find the
        # min of the bucket rather than the max.
        max_or_min_aggs_clause = None
        if used_or_free_agg == 'free':
            max_or_min_aggs_clause = self._min_aggs_clause(
                used_or_free_agg, self._TYPE_FIELDS[resource_type][1])
        else:
            max_or_min_aggs_clause = self._max_aggs_clause(
                used_or_free_agg, self._TYPE_FIELDS[resource_type][1])

        range_filter = self._range_clause('@timestamp', self.start.isoformat(),
                                          self.end.isoformat())
        term_filter = self._term_clause('resource', resource)
        q = self._filtered_query_base(self._bool_clause(
            [range_filter, term_filter]), {'match_all': {}})

        tl_aggs_clause = self._agg_date_hist(self.interval, name=date_agg_name)
        host_aggs_clause = self._agg_clause(host_agg_name,
                                            self._terms_clause("host.raw"))
        stats_aggs_clause = dict(
            self._max_aggs_clause(max_total_agg,
                                  self._TYPE_FIELDS[resource_type][0]).
            items() + max_or_min_aggs_clause.items())
        host_aggs_clause[host_agg_name]['aggs'] = stats_aggs_clause
        tl_aggs_clause[date_agg_name]['aggs'] = host_aggs_clause
        q['aggs'] = tl_aggs_clause
        return q

    def _get_resource(self, resource_type, resource, custom_field):
        q = self._claims_resource_query(resource_type, resource)
        doc_type = self._PHYS_DOC_TYPE
        if resource_type == 'virtual':
            doc_type = self._VIRT_DOC_TYPE
        # TODO GOLD-275 need an error handling strategy for ES queries
        r = self._conn.search(index="_all", body=q, size=0, doc_type=doc_type)

        logger.debug('[_get_resource] search response = = %s', json.dumps(r))
        items = []
        for date_bucket in r['aggregations']['events_by_date']['buckets']:
            logger.debug("[_get_resource] processing date_bucket: %s",
                         json.dumps(date_bucket))
            item = {'key': date_bucket['key'], 'total': 0,
                    custom_field: 0}

            for host_bucket in date_bucket['events_by_host']['buckets']:
                logger.debug("[_get_resource] processing host_bucket: %s",
                             json.dumps(host_bucket))
                item['total'] += \
                    (host_bucket['max_total']).get('value', 0)
                item[custom_field] += \
                    (host_bucket[custom_field]).get('value', 0)

            if custom_field is 'free':
                item['used'] = item['total'] - item['free']
                del item['free']

            # set zero values to None so we can do a pandas fillna in the view
            if item['used'] == 0:
                item['used'] = None

            items.append(item)

        logger.debug('[_get_resource] items = %s', json.dumps(items))
        result = pd.read_json(json.dumps(items), orient='records',
                              convert_axes=False)
        logger.debug('[_get_resource] pd = %s', result)
        return result

    def get_phys_cpu(self):
        result = self._get_resource('physical', 'cpu', 'used')
        return result

    def get_virt_cpu(self):
        result = self._get_resource('virtual', 'cpu', 'free')
        return result

    def get_phys_mem(self):
        result = self._get_resource('physical', 'memory', 'used')
        return result

    def get_virt_mem(self):
        result = self._get_resource('virtual', 'memory', 'free')
        return result

    def get_phys_disk(self):
        result = self._get_resource('physical', 'disk', 'used')
        return result
