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
import ast
import copy
import itertools
from goldstone.utils import _is_ip_addr, _partition_hostname, _resolve_fqdn, \
    _resolve_addr, _host_details, _normalize_hostnames, _normalize_hostname

__author__ = 'John Stanford'

from goldstone.views import *
from .models import ApiPerfData, ServiceData, VolumeData
import logging

logger = logging.getLogger(__name__)


class DiscoverView(TopLevelView):
    template_name = 'cinder_discover.html'


class ReportView(TopLevelView):
    template_name = 'cinder_report.html'


class ServiceListApiPerfView(ApiPerfView):
    my_template_name = 'cinder_api_perf.html'

    def _get_data(self, context):
        return ApiPerfData().get(context['start_dt'], context['end_dt'],
                                 context['interval'])


class TopologyView(TopologyView):

    def my_template_name(self):
        return 'cinder_topology.html'

    def __init__(self):
        self.services = ServiceData().get()
        self.volumes = VolumeData().get()

    def _get_service_regions(self):
        return set([s['_source']['region'] for s in self.services])

    def _get_volume_regions(self):
        return set(
            [
                ep['_source']['region']
                for ep in self.volumes
            ])

    def _get_regions(self):
        return [{"rsrcType": "region", "label": r} for r in
                self._get_service_regions().union(
                self._get_volume_regions())]

    def _get_zones(self, updated, region):
        """
        returns the zone structure derived from both services and volumes.
        has children hosts populated as the attachment point for the services
        and volumes in the graph.
        """
        zones = set(
            z['zone']
            for z in self.services[0]['_source']['services']
        ).union(set([v['availability_zone']
                     for v in self.volumes[0]['_source']['volumes']]))
        result = []
        for zone in zones:
            # build the initial list from services and volumes
            hosts = set(
                s['host']
                for s in self.services[0]['_source']['services']
                if s['zone'] == zone
            ).union(set([
                v['os-vol-host-attr:host']
                for v in self.volumes[0]['_source']['volumes']
                if v['availability_zone'] == zone]))
            # remove domain names from hostnames if they are there
            hosts = set([_normalize_hostname(h) for h in hosts])
            base_hosts = []
            for h in hosts:
                base_hosts.append({
                    "rsrcType": "host",
                    "label": h,
                    "zone": zone,  # supports _attach_resource
                    "info": {

                        "last_update": updated,
                    }})
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

    def _transform_service_list(self, updated, region):

        try:
            logger.debug("in _transform_service_list, s[0] = %s",
                     json.dumps(self.services[0]))
            svcs = {"services": [
                {"rsrcType": "service",
                 "label": s['binary'],
                 "enabled": True
                 if s['status'] == "enabled" else False,
                 "region": region,
                 "info": dict(s.items() + {
                     'last_update': updated}.items()),
                 "children": []}
                for s in self.services[0]['_source']['services']
            ]}
            _normalize_hostnames(['host'], svcs)
            return svcs['services']

        except Exception as e:
            logger.exception(e)
            return []

    def _transform_volume_list(self, updated, region):

        try:
            logger.debug("in _transform_volume_list, s[0] = %s",
                         json.dumps(self.volumes[0]))
            vols = [
                {"rsrcType": "volume",
                 "label": v['display_name'],
                 "enabled": True if not (v['status'] == 'error' or
                                         v['status'] == 'deleting') else False,
                 "region": region,
                 "host": v['os-vol-host-attr:host'],
                 "info": dict(v.items() + {'last_update': updated}.items())
                 }
                for v in self.volumes[0]['_source']['volumes']
            ]
            _normalize_hostnames(['host'], vols)
            return vols

        except Exception as e:
            logger.exception(e)
            return []

    def _build_topology_tree(self):

        rl = self._get_regions()

        if len(rl) == 0:
            return {}

        updated = self.services[0]['_source']['@timestamp']
        region = self.services[0]['_source']['region']
        zl = self._get_zones(updated, region)
        sl = self._transform_service_list(updated, region)
        vl = self._transform_volume_list(updated, region)

        # combine volumes with services
        ad = {'sourceRsrcType': 'volume',
              'targetRsrcType': 'service',
              'conditions': "%source%['host'] == "
                            "%target%['info']['host'] and "
                            "%source%['info']['availability_zone'] == "
                            "%target%['info']['zone'] and "
                            "%target%['label'] == 'cinder-volume'"}
        sl = self._attach_resource(ad, vl, sl)

        # combine services with zones at the host level
        ad = {'sourceRsrcType': 'service',
              'targetRsrcType': 'host',
              'conditions': "%source%['info']['zone'] == %target%['zone'] and "
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
