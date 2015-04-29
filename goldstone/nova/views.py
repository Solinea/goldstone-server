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
from goldstone.core.utils import JsonReadOnlyViewSet


# Our API documentation extracts this docstring, hence the use of markup.
class AgentsDataViewSet(JsonReadOnlyViewSet):
    """Return Agents data.

    \n\nQuery string parameters:\n

    <b>zone</b>: The desired zone.\n
    <b>region</b>: The desired region.\n\n

    """

    model = AgentsData
    key = 'agents'


# Our API documentation extracts this docstring, hence the use of markup.
class AggregatesDataViewSet(JsonReadOnlyViewSet):
    """Return Aggregates data.

    \n\nQuery string parameters:\n

    <b>zone</b>: The desired zone.\n
    <b>region</b>: The desired region.\n\n

    """

    model = AggregatesData
    key = 'aggregates'
    zone_key = 'availability_zone'


# Our API documentation extracts this docstring, hence the use of markup.
class AvailZonesDataViewSet(JsonReadOnlyViewSet):
    """Return Availability Zones data.

    \n\nQuery string parameters:\n

    <b>zone</b>: The desired zone.\n
    <b>region</b>: The desired region.\n\n

    """

    model = AvailZonesData
    key = 'availability_zones'


# Our API documentation extracts this docstring, hence the use of markup.
class CloudpipesDataViewSet(JsonReadOnlyViewSet):
    """Return Cloudpipes data.

    \n\nQuery string parameters:\n

    <b>zone</b>: The desired zone.\n
    <b>region</b>: The desired region.\n\n

    """

    model = CloudpipesData
    key = 'cloudpipes'


# Our API documentation extracts this docstring, hence the use of markup.
class FlavorsDataViewSet(JsonReadOnlyViewSet):
    """Return Flavors data.

    \n\nQuery string parameters:\n

    <b>zone</b>: The desired zone.\n
    <b>region</b>: The desired region.\n\n

    """

    model = FlavorsData
    key = 'flavors'


# Our API documentation extracts this docstring, hence the use of markup.
class FloatingIpPoolsDataViewSet(JsonReadOnlyViewSet):
    """Return Floating IP Pool data.

    \n\nQuery string parameters:\n

    <b>zone</b>: The desired zone.\n
    <b>region</b>: The desired region.\n\n

    """

    model = FloatingIpPoolsData
    key = 'floating_ip_pools'


# Our API documentation extracts this docstring, hence the use of markup.
class HostsDataViewSet(JsonReadOnlyViewSet):
    """Return hosts data.

    \n\nQuery string parameters:\n

    <b>zone</b>: The desired zone.\n
    <b>region</b>: The desired region.\n\n

    """

    model = HostsData
    key = 'hosts'
    zone_key = 'zone'


# Our API documentation extracts this docstring, hence the use of markup.
class HypervisorsDataViewSet(JsonReadOnlyViewSet):
    """Return Hypervisor data.

    \n\nQuery string parameters:\n

    <b>zone</b>: The desired zone.\n
    <b>region</b>: The desired region.\n\n

    """

    model = HypervisorsData
    key = 'hypervisors'


# Our API documentation extracts this docstring, hence the use of markup.
class NetworksDataViewSet(JsonReadOnlyViewSet):
    """Return Networks data.

    \n\nQuery string parameters:\n

    <b>zone</b>: The desired zone.\n
    <b>region</b>: The desired region.\n\n

    """

    model = NetworksData
    key = 'networks'


# Our API documentation extracts this docstring, hence the use of markup.
class SecGroupsDataViewSet(JsonReadOnlyViewSet):
    """Return SecurityGroups data.

    \n\nQuery string parameters:\n

    <b>zone</b>: The desired zone.\n
    <b>region</b>: The desired region.\n\n

    """

    model = SecGroupsData
    key = 'secgroups'


# Our API documentation extracts this docstring, hence the use of markup.
class ServersDataViewSet(JsonReadOnlyViewSet):
    """Return Servers data.

    \n\nQuery string parameters:\n

    <b>zone</b>: The desired zone.\n
    <b>region</b>: The desired region.\n\n

    """

    model = ServersData
    key = 'servers'
    zone_key = 'OS-EXT-AZ:availability_zone'


# Our API documentation extracts this docstring, hence the use of markup.
class ServicesDataViewSet(JsonReadOnlyViewSet):
    """Return Services data.

    \n\nQuery string parameters:\n

    <b>zone</b>: The desired zone.\n
    <b>region</b>: The desired region.\n\n

    """

    model = ServicesData
    key = 'services'
    zone_key = 'zone'


# Our API documentation extracts this docstring, hence the use of markup.
class SpawnsAggView(DateHistogramAggView):
    """Return aggregated ata about nova spawns.

    \n\nQuery string parameters:\n

    <b>start_time</b>: The desired start time, in UTC\n
    <b>end_time</b>: The desired end time, in UTC\n
    <b>interval</b>: The desired interval, as nnni. nnn is a number, i is
                     one of: smhwd.  E.g., 3600s.\n
    <b>@timestamp__range</b>: Another way to specify a time range. Value is
                              xxx:nnn. Xxx is one of: gte, gt, lte, or lt.
                              Nnn is an epoch number. E.g.,
                              gte:1430164651890.\n

    """

    serializer_class = SpawnsAggSerializer
    reserved_params = ['interval']
    SUCCESS_AGG_NAME = 'success'

    class Meta:
        """Meta."""
        model = SpawnsData

    def get(self, request):

        search = self._get_search(request).query('term', event='finish')
        search.aggs[self.AGG_NAME].bucket(
            self.SUCCESS_AGG_NAME, self.Meta.model.success_agg())

        serializer = self.serializer_class(search.execute().aggregations)

        return Response(serializer.data)
