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

import calendar
from datetime import datetime
import logging

from django.http import HttpResponseBadRequest, HttpResponseNotAllowed
import pandas as pd
from rest_framework.generics import ListAPIView
from rest_framework.response import Response
from rest_framework.serializers import HyperlinkedModelSerializer, \
    BaseSerializer
from rest_framework.viewsets import ReadOnlyModelViewSet

from .models import NovaApiPerfData, HypervisorStatsData, SpawnData, \
    ResourceData, AgentsData, AggregatesData, AvailZonesData, CloudpipesData, \
    FlavorsData, FloatingIpPoolsData, HostsData, HypervisorsData, \
    NetworksData, SecGroupsData, ServersData, ServicesData
from goldstone.apps.core.utils import JsonReadOnlyViewSet
from goldstone.views import TopLevelView, ApiPerfView as GoldstoneApiPerfView, \
    validate

logger = logging.getLogger(__name__)


class ReportView(TopLevelView):
    template_name = 'nova_report.html'


class ApiPerfView(GoldstoneApiPerfView):
    my_template_name = 'nova_api_perf.html'

    def _get_data(self, context):
        return NovaApiPerfData().get(context['start_dt'], context['end_dt'],
                                     context['interval'])


class LatestStatsSerializer(BaseSerializer):
    """The LatestStatsView's serializer class.

    Beacause HypervisorStatsData isn't really a Django model, it doesn't have
    the necessary _meta hooks to be serialized. And indeed, it doesn't need
    serialization per se, because a get() call returns a Python object, and not
    a QuerySet. So this class stubs out the to_serialization() method.

    """

    def to_representation(self, obj):
        """Return obj serialized.

        :param obj: A Python object
        :type obj: Any object
        :return: obj

        """

        return obj


class LatestStatsView(ListAPIView):
    """Provide a collection-of-objects GET endpoint for hypervisor
    statistics."""

    serializer_class = LatestStatsSerializer

    def get_queryset(self):
        """Return a Queryset for the collection GET request."""

        model = HypervisorStatsData()
        return model.get()


class ResourceViewSet(ReadOnlyModelViewSet):
    """The base class for the CPU, memory, and disk hypervisor displays."""

    def _process(self, resource_data):            # pylint: disable=W0613,R0201
        """Collect and process the resource data.

        This must be overridden in the subclasses.

        :param resource_data: Resource data based on start and end dates, and
                              an interval
        :type resource_data: ResourceData
        :return: A response object
        :rtype: Response

        """

        return None

    def list(self, request):
        """The collection-of-objects GET handler for spawns."""

        # Fetch and enhance this request's context.
        context = {
            # Use "now" if not provided. Validate() will calculate the start
            # and interval. Arguments missing from the request are set to None.
            'end':
            request.query_params.get(
                'end',
                str(calendar.timegm(datetime.utcnow().timetuple()))),
            'start': request.query_params.get('start'),
            'interval': request.query_params.get('interval'),
            }

        context = validate(['start', 'end', 'interval'], context)

        # If the context is bad, the request is bad.
        if isinstance(context, HttpResponseBadRequest):
            return context

        # Load up the resource data, do the work, and return the response.
        data = ResourceData(context['start_dt'],
                            context['end_dt'],
                            context['interval'])

        return self._process(data)

    @staticmethod
    def _handle_phys_and_virt_responses(phys, virt):
        """Do the final data processing for this view, and return a
        response."""

        # If both physical and virtual data are empty, we'll return this empty
        # frame.
        data = pd.DataFrame()

        if phys.empty and not virt.empty:
            # Physical data is empty. Return zero-filled column in a non-empty
            # dataframe.
            virt['total_phys'] = virt['total']
            virt['used_phys'] = virt['used']
            data = virt.rename(columns={'total': 'virt_total',
                                        'used': 'virt_used'})
        elif virt.empty and not phys.empty:
            # Virtual data is empty. Return zero-filled column in a non-empty
            # dataframe.
            phys['total_virt'] = phys['total']
            phys['used_virt'] = phys['used']
            data = phys.rename(columns={'total': 'total_phys',
                                        'used': 'used_phys'})
        elif not phys.empty and not virt.empty:
            # Neither are empty. Merge them on the "key" field.
            data = pd.ordered_merge(phys,
                                    virt,
                                    on='key',
                                    suffixes=['_phys', '_virt'])

            # Since this is spotty data, use the cummulative max to carry
            # totals forward.
            data['total_phys'] = data['total_phys'].cummax()
            data['total_virt'] = data['total_virt'].cummax()

            # For the used columns, we want to fill zeros with the last
            # non-zero value.
            data['used_phys'].fillna(method='pad', inplace=True)
            data['used_virt'].fillna(method='pad', inplace=True)

            data = data.set_index('key').fillna(0)

        logger.debug("[_handle_phys_and_virt_responses] data = %s", data)

        return Response(data.transpose().to_dict(outtype='list'))


class CpuViewSet(ResourceViewSet):
    """Provide a view of CPU resources."""

    def _process(self, resource_data):
        """Do the CPU resource tabulation and processing for this view."""

        return \
            self._handle_phys_and_virt_responses(resource_data.get_phys_cpu(),
                                                 resource_data.get_virt_cpu())


class MemoryViewSet(ResourceViewSet):
    """Provide a view of memory resources."""

    def _process(self, resource_data):
        """Do the memory resource tabulation and processing for this view."""

        return \
            self._handle_phys_and_virt_responses(resource_data.get_phys_mem(),
                                                 resource_data.get_virt_mem())


class DiskViewSet(ResourceViewSet):

    def _process(self, resource_data):
        """Do the disk resource tabulation and processing for this view."""

        data = resource_data.get_phys_disk()

        if not data.empty:
            # Since this is spotty data, we'll use the cummulative max to carry
            # totals forward.
            data['total'] = data['total'].cummax()

            # for the used columns, we want to fill zeros with the last
            # non-zero value
            data['used'].fillna(method='pad', inplace=True)
            data = data.set_index('key').fillna(0)

        return Response(data.transpose().to_dict(outtype='list'))


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


class SpawnsViewSet(ReadOnlyModelViewSet):
    """The /hypervisor/spawns views."""

    def list(self, request):
        """The collection-of-objects GET handler for spawns."""

        # Fetch and enhance this request's context.
        context = {
            # Use "now" if not provided. Validate() will calculate the start
            # and interval. Arguments missing from the request are set to None.
            'end':
            request.query_params.get(
                'end',
                str(calendar.timegm(datetime.utcnow().timetuple()))),
            'start': request.query_params.get('start'),
            'interval': request.query_params.get('interval'),
            }

        context = validate(['start', 'end', 'interval'], context)

        # If the context is bad, the request is bad.
        if isinstance(context, HttpResponseBadRequest):
            return context

        logger.debug("[_handle_request] start_dt = %s", context['start_dt'])

        spawndata = SpawnData(context['start_dt'],
                              context['end_dt'],
                              context['interval'])
        success_data = spawndata.get_spawn_success()
        failure_data = spawndata.get_spawn_failure()

        # If both success and failure data are empty, we'll return this empty
        # frame.
        data = pd.DataFrame()

        if success_data.empty and not failure_data.empty:
            # Success__data is empty. Return zero-filled column in a non-empty
            # dataframe.
            failure_data['successes'] = 0
            data = failure_data.rename(columns={'doc_count': 'failures'})
        elif failure_data.empty and not success_data.empty:
            # Failure__data is empty. Return zero-filled column in a
            # non-empty dataframe.
            success_data['failures'] = 0
            data = success_data.rename(columns={'doc_count': 'successes'})
        elif not success_data.empty and not failure_data.empty:
            # Neither are empty. Merge them on the "key" field.
            logger.debug("[_handle_request] successes = %s", success_data)
            logger.debug("[_handle_request] failures = %s", failure_data)

            data = \
                pd.ordered_merge(success_data,
                                 failure_data,
                                 on='key',
                                 suffixes=['_successes', '_failures'])\
                  .rename(columns={'doc_count_successes': 'successes',
                                   'doc_count_failures': 'failures'})

            data = data.set_index('key').fillna(0)

        logger.debug("[_handle_request] data = %s", data)

        return Response(data.transpose().to_dict(outtype='list'))

    def retrieve(self, request, *args, **kwargs):
        """We do not implement single object GET."""

        return HttpResponseNotAllowed
