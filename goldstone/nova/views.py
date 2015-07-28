"""Nova app views.

This module contains all views for the OpenStack Nova application.

"""
# Copyright 2015 Solinea, Inc.
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
from __future__ import unicode_literals

from rest_framework.response import Response
from goldstone.drfes.views import DateHistogramAggView
from goldstone.nova.serializers import SpawnsAggSerializer

from .models import SpawnsData, AgentsData, AggregatesData, AvailZonesData, \
    CloudpipesData, NetworksData, SecGroupsData, ServersData, ServicesData, \
    FlavorsData, FloatingIpPoolsData, HostsData, HypervisorsData
from goldstone.core.utils import JsonReadOnlyView


# Our API documentation extracts this docstring, hence the use of markup.
class AgentsDataView(JsonReadOnlyView):
    """Return Agents data.

    ---

    GET:
        parameters:
           - name: region
             description: The desired region.
             paramType: query
           - name: zone
             description: The desired zone.
             paramType: query

    """

    model = AgentsData
    key = 'agents'


# Our API documentation extracts this docstring, hence the use of markup.
class AggregatesDataView(JsonReadOnlyView):
    """Return Aggregates data.

    ---

    GET:
        parameters:
           - name: region
             description: The desired region.
             paramType: query
           - name: zone
             description: The desired zone.
             paramType: query

    """

    model = AggregatesData
    key = 'aggregates'
    zone_key = 'availability_zone'


# Our API documentation extracts this docstring, hence the use of markup.
class AvailZonesDataView(JsonReadOnlyView):
    """Return Availability Zones data.

    ---

    GET:
        parameters:
           - name: region
             description: The desired region.
             paramType: query
           - name: zone
             description: The desired zone.
             paramType: query

    """

    model = AvailZonesData
    key = 'availability_zones'


# Our API documentation extracts this docstring, hence the use of markup.
class CloudpipesDataView(JsonReadOnlyView):
    """Return Cloudpipes data.

    ---

    GET:
        parameters:
           - name: region
             description: The desired region.
             paramType: query
           - name: zone
             description: The desired zone.
             paramType: query

    """

    model = CloudpipesData
    key = 'cloudpipes'


# Our API documentation extracts this docstring, hence the use of markup.
class FlavorsDataView(JsonReadOnlyView):
    """Return Flavors data.

    ---

    GET:
        parameters:
           - name: region
             description: The desired region.
             paramType: query
           - name: zone
             description: The desired zone.
             paramType: query

    """

    model = FlavorsData
    key = 'flavors'


# Our API documentation extracts this docstring, hence the use of markup.
class FloatingIpPoolsDataView(JsonReadOnlyView):
    """Return Floating IP Pool data.

    ---

    GET:
        parameters:
           - name: region
             description: The desired region.
             paramType: query
           - name: zone
             description: The desired zone.
             paramType: query

    """

    model = FloatingIpPoolsData
    key = 'floating_ip_pools'


# Our API documentation extracts this docstring, hence the use of markup.
class HostsDataView(JsonReadOnlyView):
    """Return hosts data.

    ---

    GET:
        parameters:
           - name: region
             description: The desired region.
             paramType: query
           - name: zone
             description: The desired zone.
             paramType: query

    """

    model = HostsData
    key = 'hosts'
    zone_key = 'zone'


# Our API documentation extracts this docstring, hence the use of markup.
class HypervisorsDataView(JsonReadOnlyView):
    """Return Hypervisor data.

    ---

    GET:
        parameters:
           - name: region
             description: The desired region.
             paramType: query
           - name: zone
             description: The desired zone.
             paramType: query

    """

    model = HypervisorsData
    key = 'hypervisors'


# Our API documentation extracts this docstring, hence the use of markup.
class NetworksDataView(JsonReadOnlyView):
    """Return Networks data.

    ---

    GET:
        parameters:
           - name: region
             description: The desired region.
             paramType: query
           - name: zone
             description: The desired zone.
             paramType: query

    """

    model = NetworksData
    key = 'networks'


# Our API documentation extracts this docstring, hence the use of markup.
class SecGroupsDataView(JsonReadOnlyView):
    """Return SecurityGroups data.

    ---

    GET:
        parameters:
           - name: region
             description: The desired region.
             paramType: query
           - name: zone
             description: The desired zone.
             paramType: query

    """

    model = SecGroupsData
    key = 'secgroups'


# Our API documentation extracts this docstring, hence the use of markup.
class ServersDataView(JsonReadOnlyView):
    """Return Servers data.

    ---

    GET:
        parameters:
           - name: region
             description: The desired region.
             paramType: query
           - name: zone
             description: The desired zone.
             paramType: query
    """

    model = ServersData
    key = 'servers'
    zone_key = 'OS-EXT-AZ:availability_zone'


# Our API documentation extracts this docstring, hence the use of markup.
class ServicesDataView(JsonReadOnlyView):
    """Return Services data.

    ---

    GET:
        parameters:
           - name: region
             description: The desired region.
             paramType: query
           - name: zone
             description: The desired zone.
             paramType: query

    """

    model = ServicesData
    key = 'services'
    zone_key = 'zone'


# Our API documentation extracts this docstring, hence the use of markup.
class SpawnsAggView(DateHistogramAggView):
    """Return aggregated data about nova spawns.

    ---

    GET:
        parameters:
           - name: interval
             description: The desired time interval, as n(s|m|h|w). E.g., 1d
                          or 3m.
             required: true
             paramType: query
           - name: "@timestamp__range"
             description: The time range, as {'xxx':nnn}. Xxx is gte, gt, lte,
                          or lt.  Nnn is an epoch number.  E.g.,
                          {'gte':1430164651890}. You can also use AND, e.g.,
                          {'gte':1430164651890, 'lt':1455160000000}
             paramType: query

    """

    serializer_class = SpawnsAggSerializer

    # Do not add these query parameters to the Elasticsearch query.
    reserved_params = ['interval']

    SUCCESS_AGG_NAME = 'success'

    class Meta:                 # pylint: disable=C1001,W0232
        """Meta."""
        model = SpawnsData

    def get(self, request):

        search = self._get_search(request).query('term', event='finish')
        search.aggs[self.AGG_NAME].bucket(
            self.SUCCESS_AGG_NAME, self.Meta.model.success_agg())

        serializer = self.serializer_class(search.execute().aggregations)

        return Response(serializer.data)
