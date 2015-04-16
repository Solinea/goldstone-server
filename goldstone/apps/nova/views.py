"""Nova app views.

This module contains all views for the OpenStack Nova application.

"""
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
# -*- coding: utf-8 -*-
from __future__ import unicode_literals

import logging

from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.serializers import BaseSerializer
from rest_framework.views import APIView
from goldstone.apps.drfes.serializers import ReadOnlyElasticSerializer
from goldstone.apps.drfes.views import DateHistogramAggView
from goldstone.apps.nova.serializers import SpawnsAggSerializer

from .models import SpawnsData, AgentsData, AggregatesData, AvailZonesData, \
    CloudpipesData, NetworksData, SecGroupsData, ServersData, ServicesData, \
    FlavorsData, FloatingIpPoolsData, HostsData, HypervisorsData
from goldstone.core.utils import JsonReadOnlyViewSet
from goldstone.views import TopLevelView

logger = logging.getLogger(__name__)


class ReportView(TopLevelView):
    template_name = 'nova_report.html'


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


class GetSpawnsAggView(APIView):

    def get(self, request):
        """Handle get request."""
        import arrow
        import ast

        self.interval = request.query_params.get('interval')
        if self.interval is None:
            raise ValidationError("Parameter 'interval' is required.")
        else:
            try:
                postfix = self.interval[-1]
                base = self.interval[0:-1]
                if postfix not in ['s', 'm', 'h', 'w', 'd']:
                    raise ValidationError("Parameter 'interval' must be a "
                                          "number with a postfix in ['s', 'm',"
                                          " 'h', 'w', 'd'].")
                if type(ast.literal_eval(base)) not in [int, float]:
                    raise ValidationError("Parameter 'interval' must be a "
                                          "number with a postfix in ['s', 'm',"
                                          " 'h', 'w', 'd'].")
            except Exception:
                raise ValidationError("Parameter 'interval' is malformed.")

        self.start_str = request.query_params.get('start')
        if self.start_str is None:
            raise ValidationError("Parameter 'start' is required.")

        try:
            self.start = arrow.get(self.start_str)
        except Exception:
            raise ValidationError("Parameter 'start' "
                                  "must be a unix timestamp or "
                                  "ISO format string.")
        try:
            self.end = arrow.get(request.query_params.get(
                'end', arrow.utcnow().timestamp))
        except Exception:
            raise ValidationError("Parameter 'end' must be a unix "
                                  "timestamp or ISO format string.")

        data = SpawnsData().get_spawn_finish(self.start, self.end,
                                             self.interval)
        serializer = ReadOnlyElasticSerializer(data, many=False)
        return Response(serializer.data)
