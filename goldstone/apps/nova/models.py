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
from arrow import Arrow
from elasticsearch_dsl import A
from goldstone.apps.drfes.models import DailyIndexDocType
from goldstone.models import TopologyData


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
                   cls._datehist_agg(interval, start, end)). \
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
