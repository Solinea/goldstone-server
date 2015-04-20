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


class AgentsDataViewSet(JsonReadOnlyViewSet):
    model = AgentsData
    key = 'agents'


class AggregatesDataViewSet(JsonReadOnlyViewSet):
    model = AggregatesData
    key = 'aggregates'
    zone_key = 'availability_zone'


class AvailZonesDataViewSet(JsonReadOnlyViewSet):
    model = AvailZonesData
    key = 'availability_zones'


class CloudpipesDataViewSet(JsonReadOnlyViewSet):
    model = CloudpipesData
    key = 'cloudpipes'


class FlavorsDataViewSet(JsonReadOnlyViewSet):
    model = FlavorsData
    key = 'flavors'


class FloatingIpPoolsDataViewSet(JsonReadOnlyViewSet):
    model = FloatingIpPoolsData
    key = 'floating_ip_pools'


class HostsDataViewSet(JsonReadOnlyViewSet):
    model = HostsData
    key = 'hosts'
    zone_key = 'zone'


class HypervisorsDataViewSet(JsonReadOnlyViewSet):
    model = HypervisorsData
    key = 'hypervisors'


class NetworksDataViewSet(JsonReadOnlyViewSet):
    model = NetworksData
    key = 'networks'


class SecGroupsDataViewSet(JsonReadOnlyViewSet):
    model = SecGroupsData
    key = 'secgroups'


class ServersDataViewSet(JsonReadOnlyViewSet):
    model = ServersData
    key = 'servers'
    zone_key = 'OS-EXT-AZ:availability_zone'


class ServicesDataViewSet(JsonReadOnlyViewSet):
    model = ServicesData
    key = 'services'
    zone_key = 'zone'


class SpawnsAggView(DateHistogramAggView):
    """The 'get' view for nova spawns aggregate data."""

    serializer_class = SpawnsAggSerializer
    reserved_params = ['interval']
    SUCCESS_AGG_NAME = 'success'

    class Meta:
        """Meta"""
        model = SpawnsData

    def get(self, request):
        search = self._get_search(request).query('term', event='finish')
        search.aggs[self.AGG_NAME].bucket(
            self.SUCCESS_AGG_NAME, self.Meta.model.success_agg())
        serializer = self.serializer_class(search.execute().aggregations)
        return Response(serializer.data)
