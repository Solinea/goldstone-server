from __future__ import unicode_literals

# Copyright 2014 Solinea, Inc.
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
from goldstone.utils import _normalize_hostnames

__author__ = 'John Stanford'

import calendar
from django.http import HttpResponse, HttpResponseBadRequest
from django.conf import settings
from django.views.generic import TemplateView
from .models import *
from goldstone.views import *
from goldstone.views import _validate
from goldstone.apps.intelligence.views import _host_presence_stats
from datetime import datetime, timedelta
import pytz
import json
import logging
import pandas as pd

logger = logging.getLogger(__name__)


class DiscoverView(TopLevelView):
    template_name = 'nova_discover.html'


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


class ZonesView(TemplateView):

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
            self.template_name = 'zones.html'
        else:
            self.template_name = None
            TemplateView.content_type = 'application/json'

        return context

    def _handle_request(self, context):
        context = _validate(['start', 'end', 'interval', 'render'], context)

        if isinstance(context, HttpResponseBadRequest):
            # validation error
            return context

        context['inspect_dt'] = context['end_dt'] - \
            timedelta(seconds=int(context['interval'][:-1]))
        logger.debug("[_handle_request] start_dt = %s", context['start_dt'])
        logger.debug("[_handle_request] inspect_dt = %s",
                     context['inspect_dt'])
        logger.debug("[_handle_request] end_dt = %s", context['end_dt'])
        #
        # we need a couple different things to pull this together:
        #   - AZ data from the start and end.  The older one is used to
        #        identify new hosts
        #   - log error count for each host
        #   - missing host data based on logging to be used to identify
        #       hosts that show up in AZ data, but have not logged anything

        azd = AvailabilityZoneData()
        # new_az = sd.get_date_range(
        #    context['start_dt'], context['end_dt'], count=1)
        current_az = azd.get()
        current_az = dict() if len(current_az) == 0 else current_az[0]['zones']
        old_az = azd.get_date_range(
            datetime.fromtimestamp(0), context['start_dt'], count=1)
        old_az = dict() if len(old_az) == 0 else old_az[0]['zones']

        logger.debug("current_az = %s", json.dumps(current_az))
        logger.debug("old_az = %s", json.dumps(old_az))

        # let's find new and removed hosts
        curr_hosts = [host for zone in current_az for host in zone['hosts']]
        prev_hosts = [host for zone in old_az for host in zone['hosts']]
        new_hosts = set(curr_hosts) - set(prev_hosts)
        removed_hosts = set(prev_hosts) - set(curr_hosts)

        # here's the process to determine if a host is new or missing:
        # if the host is in the new_az, but not the old_az, it's new
        #    it's new
        # if the host is in the old_az, but not the new_az, it's removed
        # if the host shows up as missing in host_presence check
        #    it's missing
        # if it shows up in both,
        #    it's new and missing
        #

        # TODO GOLD-277 TODO: logging for all hosts should use FQDN
        presence_data = _host_presence_stats(
            context['start_dt'],
            context['inspect_dt'],
            context['end_dt'])

        # let's scrub out some stuff we don't need in the view, and make it
        # friendly for a d3 tree map
        response = {'name': 'region', 'rsrcType': 'cloud', 'children': []}
        for z in current_az:
            new_z = {'name': z['zoneName'], 'rsrcType': 'zone', 'children': []}
            for h in z['hosts']:
                short_name = h.split(".", 1)[0]
                new_h = {'name': h, 'rsrcType': 'host',
                         'children': [{'name': s, 'rsrcType': 'service'}
                                      for s in z['hosts'][h].keys()],
                         'lifeStage': 'new' if h in new_hosts else 'seen',
                         'missing': len([hn[0] for hn in presence_data
                                        if hn[0] == short_name]) > 0,
                         'hasInfo': True}
                new_z['children'].append(new_h)
            response['children'].append(new_z)

        if len(removed_hosts) > 0:
            removed_z = {'name': 'removed', 'rsrcType': 'zone',
                         'children': [
                             {'name': name, 'rsrcType': 'host',
                              'lifeStage': 'removed',
                              'children': []} for name in removed_hosts]}

            response['children'].append(removed_z)

        logger.debug("[_handle_request] response = %s", json.dumps(response))

        # TODO get error counts

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


class TopologyView(TopologyView):

    def my_template_name(self):
        return 'nova_topology.html'

    def __init__(self):
        self.services = ServiceData().get()
        self.hypervisors = HypervisorData().get()

    def _get_regions(self):
        return [{"rsrcType": "region", "label": r} for r in
                set([s['_source']['region'] for s in self.services])]

    @staticmethod
    def _get_zones(updated, region, sl, hl):
        """
        returns the zone structure derived from the services list and
        has children hosts populated as the attachment point for the services
        and volumes in the graph.
        """
        zones = set(
            s['info']['zone']
            for s in sl
        )
        result = []
        for zone in zones:
            # build the initial list from services and volumes
            hosts = set(
                s['info']['host']
                for s in sl
                if s['info']['zone'] == zone and s['label'] != 'nova-compute'
            )
            hypers = set(
                s['info']['host']
                for s in sl
                if s['info']['zone'] == zone and s['label'] == 'nova-compute'
            )

            base_hosts = []
            for h in hosts:
                base_hosts.append({
                    "rsrcType": "host",
                    "label": h,
                    "info": {
                        "zone": zone,  # supports _attach_resource
                        "last_update": updated,
                    }})
            # process these separately so we can get their info structure
            for h in hypers:
                for hy in hl:
                    if h == hy['label']:
                        base_hosts.append(hy)
            result.append({
                "rsrcType": "zone",
                "label": zone,
                "region": region,
                "info": {
                    "last_update": updated
                },
                "children": base_hosts
            })

        return result

    def _transform_service_list(self):
        logger.debug("in _transform_service_list, s[0] = %s",
                     json.dumps(self.services[0]))
        try:
            updated = self.services[0]['_source']['@timestamp']
            region = self.services[0]['_source']['region']
            svcs = [
                {"rsrcType": "service",
                 "label": s['binary'],
                 "enabled": True if s['status'] == 'enabled' else False,
                 "region": region,
                 "info": dict(s.items() + {'last_update': updated}.items())
                 } for s in self.services[0]['_source']['services']
            ]
            _normalize_hostnames(['host'], svcs)
            return svcs
        except Exception as e:
            logger.exception(e)
            return []

    def _transform_hypervisor_list(self):
        try:
            updated = self.hypervisors[0]['_source']['@timestamp']
            region = self.hypervisors[0]['_source']['region']
            hypers = [
                {"rsrcType": "host",
                 "label": h['host'],
                 "region": region,
                 "info": dict(h.items() + {'last_update': updated}.items())
                 } for h in self.hypervisors[0]['_source']['hypervisors']
            ]
            _normalize_hostnames(['label', 'host'],
                                 hypers)
            return hypers
        except Exception as e:
            logger.exception(e)
            return []

    def _build_topology_tree(self):
        rl = self._get_regions()
        if len(rl) == 0:
            return {}

        updated = self.services[0]['_source']['@timestamp']
        region = self.services[0]['_source']['region']
        sl = self._transform_service_list()
        hl = self._transform_hypervisor_list()
        zl = self._get_zones(updated, region, sl, hl)

        # hypervisors are already bound to zones.  just need to bind services
        # to hosts within zones.
        ad = {'sourceRsrcType': 'service',
              'targetRsrcType': 'host',
              'conditions': "%source%['info']['zone'] == "
                            "%target%['info']['zone'] and "
                            "%source%['info']['host'] == %target%['label']"}
        zl = self._attach_resource(ad, sl, zl)

        ad = {'sourceRsrcType': 'zone',
              'targetRsrcType': 'region',
              'conditions': "%source%['region'] == %target%['label']"}

        rl = self._attach_resource(ad, zl, rl)

        if len(rl) > 1:
            return {"rsrcType": "cloud", "label": "Cloud", "children": rl}
        else:
            return rl[0]
