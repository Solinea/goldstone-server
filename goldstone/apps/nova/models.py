"""Nova app models."""
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
from datetime import datetime
import json
import logging
import pandas as pd
# TODO replace pyes
from pyes import BoolQuery, RangeQuery, ESRangeOp, TermQuery
from types import StringType

from goldstone.models import ESData, TopologyData, ApiPerfData

logger = logging.getLogger(__name__)


class NovaApiPerfData(ApiPerfData):
    """
    Nova model for API performance data
    """
    component = 'nova'


class NovaClientData(ESData):
    """
    abstract class for data pulled from nova client.  Override _DOC_TYPE
    """
    _DOC_TYPE = None
    _INDEX_PREFIX = 'logstash'

    def get_date_range(self, start, end, first=0, count=10, sort='desc'):
        """Return the Availability Zone for a date range from the database.

        :arg start: datetime of early boundary
        :arg end: datetime of late boundary
        :arg first: index of first record (optional)
        :arg count: max number of records (optional)
        :arg sort: sort order {'asc', 'desc'} (optional)
        :return array of records

        """

        query = ESData._filtered_query_base()
        query['query']['filtered']['query'] = {'match_all': {}}
        query['query']['filtered']['filter'] = ESData._range_clause(
            '@timestamp',
            start.isoformat(),
            end.isoformat())

        sort_str = '@timestamp:' + sort
        logger.debug("[get_date_range] query = %s", json.dumps(query))

        response = self._conn.search(index="_all",
                                     doc_type=self._DOC_TYPE,
                                     body=query, size=count, from_=first,
                                     sort=sort_str)
        logger.debug("[get_date_range] response = %s", json.dumps(response))

        if response['hits']['hits']:
            logger.debug("[get] response = %s", json.dumps(response))
            return [h['_source'] for h in response['hits']['hits']]
        else:
            return []

    def get(self, count=1):
        """Return the last <count> records from the database.

        :arg count: number of records to return
        :return: array of records

        """

        query = {'query': {'match_all': {}}}
        response = self._conn.search(index="_all",
                                     doc_type=self._DOC_TYPE,
                                     body=query, size=count,
                                     sort='@timestamp:desc')

        if response['hits']['hits']:
            logger.debug("[get] response = %s", json.dumps(response))
            return [response['hits']['hits'][0]['_source']]
        else:
            return []

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

        query = ESData._query_base()
        query['query'] = ESData._term_clause("_id", doc_id)
        response = self._conn.delete_by_query("_all", self._DOC_TYPE,
                                              body=query)
        logger.debug("[delete] response = %s", json.dumps(response))

        # need to test for a single index case where there is no "all" field
        if 'all' in response['_indices']:
            return not bool(response['_indices']['all']['_shards']['failed'])
        else:
            return not bool(response['_indices'].
                            values()[0]['_shards']['failed'])


class HypervisorStatsData(NovaClientData):
    """The pseudo model for hypervisor statistics."""

    _INDEX_PREFIX = 'goldstone'
    _DOC_TYPE = 'nova_hypervisor_stats'


class SpawnData(ESData):
    _DOC_TYPE = 'nova_spawns'

    def __init__(self, start, end, interval):
        self.start = start
        self.end = end
        self.interval = interval

    def _spawn_start_query(self, agg_name="events_by_date"):

        _query_value = BoolQuery(must=[
            RangeQuery(qrange=ESRangeOp(
                "@timestamp",
                "gte", self.start.isoformat(),
                "lte", self.end.isoformat())),
            TermQuery("event", "start")
        ]).serialize()

        query = {
            "query": _query_value,
            "aggs": ESData._agg_date_hist(self.interval, name=agg_name)
        }
        return query

    def _spawn_finish_query(self, success):
        filter_name = "success_filter"
        agg_name = "events_by_date"

        _query_value = BoolQuery(must=[
            RangeQuery(qrange=ESRangeOp(
                "@timestamp",
                "gte", self.start.isoformat(),
                "lte", self.end.isoformat())),
            TermQuery("event", "finish")
        ]).serialize()

        query = {
            "query": _query_value,
            "aggs": ESData._agg_filter_term("success",
                                            str(success).lower(),
                                            filter_name)
        }
        query['aggs'][filter_name]['aggs'] = ESData._agg_date_hist(
            self.interval, name=agg_name)

        return query

    def get_spawn_start(self):
        """Return a pandas dataframe with the results of a query for nova spawn
        start events"""
        agg_name = "events_by_date"
        q = self._spawn_start_query(agg_name)
        logger.info("[get_spawn_start] query = %s", json.dumps(q))
        index = ",".join(self.get_index_names('goldstone-'))
        logger.info("[get_spawn_start] calling query with index=%s, "
                    "doc_type=%s", index, self._DOC_TYPE)
        response = self._conn.search(
            index=index, doc_type=self._DOC_TYPE, body=q, size=0)
        logger.info("[get_spawn_start] response = %s", json.dumps(response))
        return pd.read_json(json.dumps(
            response['aggregations'][agg_name]['buckets'])
        )

    def _get_spawn_finish(self, success):
        fname = "success_filter"
        aname = "events_by_date"
        q = self._spawn_finish_query(success)
        logger.debug("[get_spawn_finish] query = %s", json.dumps(q))
        response = self._conn.search(
            index=",".join(self.get_index_names('goldstone-')),
            doc_type=self._DOC_TYPE,
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


class ResourceData(ESData):
    _DOC_TYPE = 'nova_claims'
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

        _query_value = BoolQuery(must=[
            RangeQuery(qrange=ESRangeOp(
                "@timestamp",
                "gte", self.start.isoformat(),
                "lte", self.end.isoformat())),
            TermQuery("resource", resource),
            TermQuery("state", resource_type)
        ]).serialize()

        if used_or_free_agg == 'free':
            max_or_min_aggs_clause = self._min_aggs_clause(
                used_or_free_agg, self._TYPE_FIELDS[resource_type][1])
        else:
            max_or_min_aggs_clause = self._max_aggs_clause(
                used_or_free_agg, self._TYPE_FIELDS[resource_type][1])

        tl_aggs_clause = self._agg_date_hist(self.interval, name=date_agg_name)
        host_aggs_clause = self._agg_clause(host_agg_name,
                                            self._terms_clause("host"))
        stats_aggs_clause = dict(
            self._max_aggs_clause(max_total_agg,
                                  self._TYPE_FIELDS[resource_type][0]).
            items() + max_or_min_aggs_clause.items())
        host_aggs_clause[host_agg_name]['aggs'] = stats_aggs_clause
        tl_aggs_clause[date_agg_name]['aggs'] = host_aggs_clause

        query = {
            "query": _query_value,
            "aggs": tl_aggs_clause
        }

        logger.debug("[_claims_resource_query] query = %s", json.dumps(query))

        return query

    def _get_resource(self, resource_type, resource, custom_field):

        query = self._claims_resource_query(resource_type, resource)
        logger.debug('query = %s', json.dumps(query))

        index = ",".join(self.get_index_names('goldstone-'))
        result = self._conn.search(index=index,
                                   body=query,
                                   size=0,
                                   doc_type=self._DOC_TYPE)

        logger.debug('[_get_resource] search response = %s',
                     json.dumps(result))

        items = []

        for date_bucket in result['aggregations']['events_by_date']['buckets']:
            logger.debug("[_get_resource] processing date_bucket: %s",
                         json.dumps(date_bucket))
            item = {'key': date_bucket['key'], 'total': 0, custom_field: 0}

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

        result = pd.read_json(json.dumps(items),
                              orient='records',
                              convert_axes=False)

        logger.debug('[_get_resource] pd = %s', result)

        return result

    def get_phys_cpu(self):
        result = self._get_resource('physical', 'cpus', 'used')
        return result

    def get_virt_cpu(self):
        result = self._get_resource('virtual', 'cpus', 'free')
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


class AgentsData(TopologyData):
    _DOC_TYPE = 'nova_agents_list'
    _INDEX_PREFIX = 'goldstone'


class AggregatesData(TopologyData):
    _DOC_TYPE = 'nova_aggregates_list'
    _INDEX_PREFIX = 'goldstone'


class AvailZonesData(TopologyData):
    _DOC_TYPE = 'nova_avail_zones_list'
    _INDEX_PREFIX = 'goldstone'


class CloudpipesData(TopologyData):
    _DOC_TYPE = 'nova_cloudpipes_list'
    _INDEX_PREFIX = 'goldstone'


class FlavorsData(TopologyData):
    _DOC_TYPE = 'nova_flavors_list'
    _INDEX_PREFIX = 'goldstone'


class FloatingIpPoolsData(TopologyData):
    _DOC_TYPE = 'nova_floating_ip_pools_list'
    _INDEX_PREFIX = 'goldstone'


class HostsData(TopologyData):
    _DOC_TYPE = 'nova_hosts_list'
    _INDEX_PREFIX = 'goldstone'


class HypervisorsData(TopologyData):
    _DOC_TYPE = 'nova_hypervisors_list'
    _INDEX_PREFIX = 'goldstone'


class NetworksData(TopologyData):
    _DOC_TYPE = 'nova_networks_list'
    _INDEX_PREFIX = 'goldstone'


class SecGroupsData(TopologyData):
    _DOC_TYPE = 'nova_secgroups_list'
    _INDEX_PREFIX = 'goldstone'


class ServersData(TopologyData):
    _DOC_TYPE = 'nova_servers_list'
    _INDEX_PREFIX = 'goldstone'


class ServicesData(TopologyData):
    _DOC_TYPE = 'nova_services_list'
    _INDEX_PREFIX = 'goldstone'
