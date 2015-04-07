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
from arrow import Arrow
from elasticsearch_dsl import A
from goldstone.apps.drfes.models import DailyIndexDocType

from goldstone.models import ESData, TopologyData

logger = logging.getLogger(__name__)


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


class SpawnsData(DailyIndexDocType):
    """A model that searches a set of daily indices (intended to be
    read-only)."""

    INDEX_PREFIX = 'goldstone-'
    SORT = '-@timestamp'

    class Meta:
        doc_type = 'nova_spawns'

    @classmethod
    def _spawn_finish_query(cls, start, end, interval):
        """Build the query for spawn finish events with term and
        date hist agg."""

        search = cls.bounded_search(start, end).query('term', event='finish')
        search.aggs. \
            bucket('per_interval',
                   cls._datehist_agg(start, end, interval)). \
            bucket('per_success', A('terms', field='success', size=0,
                                    min_doc_count=0))

        return search

    def get_spawn_finish(self, start, end, interval):
        """Get the aggregated spawn finish results.

        :type start: Arrow
        :param start: start time
        :type end: Arrow
        :param end: end time
        :type interval: str
        :param interval: ES interval specification
        :return: A dict of results
        """
        return self._spawn_finish_query(start, end, interval). \
            execute().aggregations


class AgentsData(TopologyData):
    _DOC_TYPE = 'nova_agents_list'
    _INDEX_PREFIX = 'goldstone-'


class AggregatesData(TopologyData):
    _DOC_TYPE = 'nova_aggregates_list'
    _INDEX_PREFIX = 'goldstone-'


class AvailZonesData(TopologyData):
    _DOC_TYPE = 'nova_avail_zones_list'
    _INDEX_PREFIX = 'goldstone-'


class CloudpipesData(TopologyData):
    _DOC_TYPE = 'nova_cloudpipes_list'
    _INDEX_PREFIX = 'goldstone-'


class FlavorsData(TopologyData):
    _DOC_TYPE = 'nova_flavors_list'
    _INDEX_PREFIX = 'goldstone-'


class FloatingIpPoolsData(TopologyData):
    _DOC_TYPE = 'nova_floating_ip_pools_list'
    _INDEX_PREFIX = 'goldstone-'


class HostsData(TopologyData):
    _DOC_TYPE = 'nova_hosts_list'
    _INDEX_PREFIX = 'goldstone-'


class HypervisorsData(TopologyData):
    _DOC_TYPE = 'nova_hypervisors_list'
    _INDEX_PREFIX = 'goldstone-'


class NetworksData(TopologyData):
    _DOC_TYPE = 'nova_networks_list'
    _INDEX_PREFIX = 'goldstone-'


class SecGroupsData(TopologyData):
    _DOC_TYPE = 'nova_secgroups_list'
    _INDEX_PREFIX = 'goldstone-'


class ServersData(TopologyData):
    _DOC_TYPE = 'nova_servers_list'
    _INDEX_PREFIX = 'goldstone-'


class ServicesData(TopologyData):
    _DOC_TYPE = 'nova_services_list'
    _INDEX_PREFIX = 'goldstone-'
