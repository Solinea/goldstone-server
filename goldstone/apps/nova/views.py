from __future__ import unicode_literals
# Copyright 2014 Solinea, Inc.
#
# Licensed under the Solinea Software License Agreement (goldstone),
# Version 1.0 (the "License"); you may not use this file except in compliance
# with the License. You may obtain a copy of the License at:
#
#     http://www.solinea.com/goldstone/LICENSE.pdf
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

from goldstone.utils import _normalize_hostnames, NoResourceFound

__author__ = 'John Stanford'

import calendar
from django.http import HttpResponse, HttpResponseBadRequest
from django.conf import settings
from django.views.generic import TemplateView
from .models import *
from goldstone.views import *
from goldstone.views import _validate
from datetime import datetime, timedelta
import pytz
import json
import logging
import pandas as pd

logger = logging.getLogger(__name__)


class ReportView(TopLevelView):
    template_name = 'nova_report.html'


class ApiPerfView(ApiPerfView):
    my_template_name = 'nova_api_perf.html'

    def _get_data(self, context):
        return ApiPerfData().get(context['start_dt'], context['end_dt'],
                                 context['interval'])


class SpawnsView(TemplateView):
    data = pd.DataFrame()

    def get_context_data(self, **kwargs):
        context = TemplateView.get_context_data(self, **kwargs)
        context['render'] = self.request.GET.get('render', "True"). \
            lower().capitalize()
        # use "now" if not provided, will calc start and interval in _validate
        context['end'] = self.request.GET.get('end', str(calendar.timegm(
            datetime.utcnow().timetuple())))
        context['start'] = self.request.GET.get('start', None)
        context['interval'] = self.request.GET.get('interval', None)

        # if render is true, we will return a full template, otherwise only
        # a json data payload
        if context['render'] == 'True':
            self.template_name = 'spawns.html'
        else:
            self.template_name = None
            TemplateView.content_type = 'application/json'

        return context

    def _handle_request(self, context):
        context = _validate(['start', 'end', 'interval', 'render'], context)

        if isinstance(context, HttpResponseBadRequest):
            # validation error
            return context

        logger.debug("[_handle_request] start_dt = %s", context['start_dt'])
        sd = SpawnData(context['start_dt'], context['end_dt'],
                       context['interval'])
        success_data = sd.get_spawn_success()
        failure_data = sd.get_spawn_failure()

        # there are a few cases to handle here
        #  - both empty: return empty dataframe
        #  - one empty: return zero filled column in non-empty dataframe
        #  - neither empty: merge them on the 'key' field

        if not (success_data.empty and failure_data.empty):
            if success_data.empty:
                failure_data['successes'] = 0
                self.data = failure_data.rename(
                    columns={'doc_count': 'failures'})
            elif failure_data.empty:
                success_data['failures'] = 0
                self.data = success_data.rename(
                    columns={'doc_count': 'successes'})
            else:
                logger.debug("[_handle_request] successes = %s", success_data)
                logger.debug("[_handle_request] failures = %s", failure_data)
                self.data = pd.ordered_merge(
                    success_data, failure_data, on='key',
                    suffixes=['_successes', '_failures']) \
                    .rename(columns={'doc_count_successes': 'successes',
                                     'doc_count_failures': 'failures'})

        logger.debug("[_handle_request] self.data = %s", self.data)
        if not self.data.empty:
            self.data = self.data.set_index('key').fillna(0)

        response = self.data.transpose().to_dict(outtype='list')
        return response

    def render_to_response(self, context, **response_kwargs):
        """
        Overriding to handle case of data only request (render=False).  In
        that case an application/json data payload is returned.
        """
        response = self._handle_request(context)
        if isinstance(response, HttpResponseBadRequest):
            return response

        if self.template_name is None:
            return HttpResponse(json.dumps(response),
                                content_type="application/json")

        return TemplateView.render_to_response(
            self, {'data': json.dumps(response)})


class ResourceView(TemplateView):
    data = pd.DataFrame()
    # override in subclass
    my_template_name = None

    def get_context_data(self, **kwargs):
        context = TemplateView.get_context_data(self, **kwargs)
        context['render'] = self.request.GET.get('render', "True"). \
            lower().capitalize()
        # use "now" if not provided, will calc start and interval in _validate
        context['end'] = self.request.GET.get('end', str(calendar.timegm(
            datetime.utcnow().timetuple())))
        context['start'] = self.request.GET.get('start', None)
        context['interval'] = self.request.GET.get('interval', None)

        # if render is true, we will return a full template, otherwise only
        # a json data payload
        if context['render'] == 'True':
            self.template_name = self.my_template_name
        else:
            self.template_name = None
            TemplateView.content_type = 'application/json'

        return context

    def _handle_phys_and_virt_responses(self, phys, virt):
        # there are a few cases to handle here
        #  - both empty: return empty dataframe
        #  - one empty: return zero filled column in non-empty dataframe
        #  - neither empty: merge them on the 'key' field

        if not (phys.empty and virt.empty):
            if phys.empty:
                virt['total_phys'] = virt['total']
                virt['used_phys'] = virt['used']
                self.data = virt.rename(
                    columns={'total': 'virt_total', 'used': 'virt_used'})
            elif virt.empty:
                phys['total_virt'] = phys['total']
                phys['used_virt'] = phys['used']
                self.data = phys.rename(
                    columns={'total': 'total_phys', 'used': 'used_phys'})
            else:
                self.data = pd.ordered_merge(
                    phys, virt, on='key',
                    suffixes=['_phys', '_virt'])

            # since this is spotty data, we'll use the cummulative max to carry
            # totals forward
            self.data['total_phys'] = self.data['total_phys'].cummax()
            self.data['total_virt'] = self.data['total_virt'].cummax()
            # for the used columns, we want to fill zeros with the last
            # non-zero value
            self.data['used_phys'].fillna(method='pad', inplace=True)
            self.data['used_virt'].fillna(method='pad', inplace=True)

        logger.debug("[_handle_phys_and_virt_responses] self.data = %s",
                     self.data)
        if not self.data.empty:
            self.data = self.data.set_index('key').fillna(0)

        response = self.data.transpose().to_dict(outtype='list')
        return response

    def render_to_response(self, context, **response_kwargs):
        """
        Overriding to handle case of data only request (render=False).  In
        that case an application/json data payload is returned.
        """
        response = self._handle_request(context)
        if isinstance(response, HttpResponseBadRequest):
            return response

        if self.template_name is None:
            return HttpResponse(json.dumps(response),
                                content_type="application/json")

        return TemplateView.render_to_response(
            self, {'data': json.dumps(response)})


class CpuView(ResourceView):
    my_template_name = 'cpu.html'

    def _handle_request(self, context):
        context = _validate(['start', 'end', 'interval', 'render'], context)

        if isinstance(context, HttpResponseBadRequest):
            # validation error
            return context
        rd = ResourceData(context['start_dt'], context['end_dt'],
                          context['interval'])
        p_cpu = rd.get_phys_cpu()
        v_cpu = rd.get_virt_cpu()
        response = self._handle_phys_and_virt_responses(p_cpu, v_cpu)
        return response


class MemoryView(ResourceView):
    my_template_name = 'mem.html'

    def _handle_request(self, context):
        context = _validate(['start', 'end', 'interval', 'render'], context)

        if isinstance(context, HttpResponseBadRequest):
            # validation error
            return context
        rd = ResourceData(context['start_dt'], context['end_dt'],
                          context['interval'])
        p_mem = rd.get_phys_mem()
        v_mem = rd.get_virt_mem()
        response = self._handle_phys_and_virt_responses(p_mem, v_mem)
        return response


class DiskView(ResourceView):
    my_template_name = 'disk.html'

    def _handle_request(self, context):
        context = _validate(['start', 'end', 'interval', 'render'], context)

        if isinstance(context, HttpResponseBadRequest):
            # validation error
            return context
        rd = ResourceData(context['start_dt'], context['end_dt'],
                          context['interval'])
        self.data = rd.get_phys_disk()

        if not self.data.empty:
            # since this is spotty data, we'll use the cummulative max to carry
            # totals forward
            self.data['total'] = self.data['total'].cummax()
            # for the used columns, we want to fill zeros with the last
            # non-zero value
            self.data['used'].fillna(method='pad', inplace=True)
            self.data = self.data.set_index('key').fillna(0)

        response = self.data.transpose().to_dict(outtype='list')
        return response


class LatestStatsView(TemplateView):
    template_name = 'latest_stats.html'

    def get_context_data(self, **kwargs):
        context = TemplateView.get_context_data(self, **kwargs)
        context['render'] = self.request.GET.get('render', "True"). \
            lower().capitalize()

        # if render is true, we will return a full template, otherwise only
        # a json data payload
        if context['render'] != 'True':
            self.template_name = None

        return context

    def render_to_response(self, context, **response_kwargs):

        model = HypervisorStatsData()
        response = model.get(1)

        if self.template_name:
            return TemplateView.render_to_response(
                self, {'data': json.dumps(response)})
        else:
            return HttpResponse(json.dumps({'data': response}),
                                content_type='application/json')


class DiscoverView(TopologyView):

    def my_template_name(self):
        return 'nova_discover.html'

    def __init__(self):
        self.azs = AvailZonesData().get()

    def _get_region_names(self):
        if self.azs is None:
            return []
        else:
            return set([s['_source']['region'] for s in self.azs])

    def _get_regions(self):
        return [{"rsrcType": "region", "label": r}
                for r in self._get_region_names()]

    def _populate_regions(self):
        result = []
        updated = self.azs[0]['_source']['@timestamp']
        for r in self._get_region_names():
            result.append(
                {"rsrcType": "region",
                 "label": r,
                 "info": {"last_updated": updated},
                 "children": [
                     {
                         "rsrcType": "flavors-leaf",
                         "label": "flavors",
                         "region": r,
                         "info": {
                             "last_update": updated
                         }
                     },
                     {
                         "rsrcType": "hypervisors-leaf",
                         "label": "hypervisors",
                         "region": r,
                         "info": {
                             "last_update": updated
                         }
                     }
                 ]}
            )

        return result

    def _get_zones(self, updated, region):
        """
        returns the zone structure derived from both services.
        has children hosts populated as the attachment point for the services
        and volumes in the graph.
        """
        zones = set(
            [zn['zoneName']
             for zn in self.azs[0]['_source']['availability_zones']]
        )

        result = []
        for zone in zones:
            # create children for services, volumes, backups, and snapshots
            result.append({
                "rsrcType": "zone",
                "label": zone,
                "region": region,
                "info": {
                    "last_update": updated
                },
                "children": [
                    {
                        "rsrcType": "aggregates-leaf",
                        "label": "aggregates",
                        "region": region,
                        "zone": zone,
                        "info": {
                            "last_update": updated
                        }
                    },
                    {
                        "rsrcType": "hosts-leaf",
                        "label": "hosts",
                        "region": region,
                        "zone": zone,
                        "info": {
                            "last_update": updated
                        }
                    },
                    {
                        "rsrcType": "servers-leaf",
                        "label": "instances",
                        "region": region,
                        "zone": zone,
                        "info": {
                            "last_update": updated
                        }
                    },
                    {
                        "rsrcType": "services-leaf",
                        "label": "services",
                        "region": region,
                        "zone": zone,
                        "info": {
                            "last_update": updated
                        }
                    }
                ]
            })

        return result

    def _build_topology_tree(self):
        try:
            if self.azs is None or len(self.azs) == 0:
                raise NoResourceFound(
                    "No nova availability zones found in database")
            updated = self.azs[0]['_source']['@timestamp']
            rl = self._populate_regions()
            new_rl = []
            for region in rl:
                zl = self._get_zones(updated, region['label'])
                ad = {'sourceRsrcType': 'zone',
                      'targetRsrcType': 'region',
                      'conditions': "%source%['region'] == %target%['label']"}
                region = self._attach_resource(ad, zl, [region])[0]

                new_rl.append(region)

            if len(new_rl) > 1:
                return {"rsrcType": "cloud", "label": "Cloud",
                        "children": new_rl}
            else:
                return new_rl[0]
        except (IndexError, NoResourceFound):
            return {"rsrcType": "error", "label": "No data found"}
        except GoldstoneAuthError:
            raise


class AgentsDataView(JSONView):
    def __init__(self):
        self.data = AgentsData().get()
        self.key = 'agents'


class AggregatesDataView(JSONView):
    def __init__(self):
        self.data = AggregatesData().get()
        self.key = 'aggregates'
        self.zone_key = 'availability_zone'


class AvailZonesDataView(JSONView):
    def __init__(self):
        self.data = AvailZonesData().get()
        self.key = 'availability_zones'


class CloudpipesDataView(JSONView):
    def __init__(self):
        self.data = CloudpipesData().get()
        self.key = 'cloudpipes'


class FlavorsDataView(JSONView):
    def __init__(self):
        self.data = FlavorsData().get()
        self.key = 'flavors'


class FloatingIpPoolsDataView(JSONView):
    def __init__(self):
        self.data = FloatingIpPoolsData().get()
        self.key = 'floating_ip_pools'


class HostsDataView(JSONView):
    def __init__(self):
        self.data = HostsData().get()
        self.key = 'hosts'
        self.zone_key = 'zone'


class HypervisorsDataView(JSONView):
    def __init__(self):
        self.data = HypervisorsData().get()
        self.key = 'hypervisors'


class NetworksDataView(JSONView):
    def __init__(self):
        self.data = NetworksData().get()
        self.key = 'networks'


class SecGroupsDataView(JSONView):
    def __init__(self):
        self.data = SecGroupsData().get()
        self.key = 'secgroups'


class ServersDataView(JSONView):
    def __init__(self):
        self.data = ServersData().get()
        self.key = 'servers'
        self.zone_key = 'OS-EXT-AZ:availability_zone'


class ServicesDataView(JSONView):
    def __init__(self):
        self.data = ServicesData().get()
        self.key = 'services'
        self.zone_key = 'zone'
