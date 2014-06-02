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

__author__ = 'John Stanford'

from goldstone.views import *
from .models import ApiPerfData, ServiceData, EndpointData
import logging

logger = logging.getLogger(__name__)


class ReportView(TopLevelView):
    template_name = 'keystone_report.html'


class AuthApiPerfView(ApiPerfView):
    my_template_name = 'keystone_api_perf.html'

    def _get_data(self, context):
        return ApiPerfData().get(context['start_dt'], context['end_dt'],
                                 context['interval'])


class DiscoverView(TopologyView):

    def my_template_name(self):
        return 'keystone_discover.html'

    def __init__(self):
        self.services = ServiceData().get()
        self.endpoints = EndpointData().get()

    def _get_service_regions(self):
        return set([s['_source']['region'] for s in self.services])

    def _get_endpoint_regions(self):
        return set(
            [
                r['region']
                for ep in self.endpoints
                for r in ep['_source']['endpoints']
            ])

    def _get_regions(self):
        return [{"rsrcType": "region", "label": r} for r in
                self._get_service_regions().union(
                self._get_endpoint_regions())]

    def _transform_service_list(self):

        try:
            logger.debug("in _transform_service_list, s[0] = %s",
                         json.dumps(self.services[0]))
            updated = self.services[0]['_source']['@timestamp']
            region = self.services[0]['_source']['region']
            return [
                {"rsrcType": "service",
                 "label": s['name'],
                 "enabled": s['enabled'],
                 "region": region,
                 "info": {
                     "id": s['id'],
                     "description": s['description'],
                     "type": s['type'],
                     "last_update": updated

                 }} for s in self.services[0]['_source']['services']
            ]
        except Exception as e:
            logger.exception(e)
            return []

    def _transform_endpoint_list(self):

        try:
            updated = self.endpoints[0]['_source']['@timestamp']
            return [
                {"rsrcType": "endpoint",
                 "service_id": s['service_id'],
                 "info": {
                     "id": s['id'],
                     "admin_URL": s['adminurl'],
                     "internal_URL": s['internalurl'],
                     "public_URL": s['publicurl'],
                     "last_update": updated
                 }} for s in self.endpoints[0]['_source']['endpoints']
            ]
        except Exception as e:
            logger.exception(e)
            return []

    def _map_service_children(self):
        """
        use the service ID of the endpoint to append a child to the list
        of service children.
        """
        sl = self._transform_service_list()
        el = self._transform_endpoint_list()

        for s in sl:
            children = []
            for e in el:
                if e['service_id'] == s['info']['id']:
                    children.append(e)
            if len(children) > 0:
                s['children'] = children

        for s in sl:
            for e in s['children']:
                e['label'] = s['label']
                del e['service_id']

        return sl

    def _build_topology_tree(self):
        rl = self._get_regions()
        if len(rl) == 0:
            return {}

        sl = self._map_service_children()

        ad = {'sourceRsrcType': 'service',
              'targetRsrcType': 'region',
              'conditions': "%source%['region'] == %target%['label']"}

        rl = self._attach_resource(ad, sl, rl)

        if len(rl) > 1:
            return {"rsrcType": "cloud", "label": "Cloud", "children": rl}
        else:
            return rl[0]
