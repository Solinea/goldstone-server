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


class DiscoverView(TopLevelView):
    template_name = 'keystone_discover.html'


class ReportView(TopLevelView):
    template_name = 'keystone_report.html'


class AuthApiPerfView(ApiPerfView):
    my_template_name = 'keystone_api_perf.html'

    def _get_data(self, context):
        return ApiPerfData().get(context['start_dt'], context['end_dt'],
                                 context['interval'])


class TopologyView(TemplateView):
    """
    Produces a view of the keystone topology (or json data if render=false).
    The data structure is a list of resource types.  If the list contains
    only one element, it will be used as the root node, otherwise a "cloud"
    resource will be constructed as the root.

    A resource has the following structure:

    {
        "rsrcType": "region|service|endpoints",
        "label": "string",
        "info": {"key": "value" [, "key": "value", ...]}, (optional)
        "lifeStage": "new|existing|absent", (optional)
        "enabled": True|False, (optional)
        "children": [rsrcType] (optional)
     }

    """
    my_template_name = 'keystone_topology.html'

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

    def _transform_service_list(self):
        logger.debug("in _transform_service_list, s[0] = %s",
                    json.dumps(self.services[0]))
        try:
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

    def _build_region_tree(self):
        rl = [{"rsrcType": "region", "label": r} for r in
              self._get_service_regions().union(
                  self._get_endpoint_regions())]
        if len(rl) == 0:
            return {}

        sl = self._map_service_children()

        for r in rl:
            children = []
            for s in sl:
                if s['region'] == r['label']:
                    children.append(s)
            if len(children) > 0:
                r['children'] = children

        for r in rl:
            for s in r['children']:
                del s['region']

        if len(rl) > 1:
            return {"rsrcType": "cloud", "label": "Cloud", "children": rl}
        else:
            return rl[0]

    def get_context_data(self, **kwargs):
        context = TemplateView.get_context_data(self, **kwargs)
        context['render'] = self.request.GET.get('render', "True"). \
            lower().capitalize()

        # if render is true, we will return a full template, otherwise only
        # a json data payload
        if context['render'] == 'True':
            self.template_name = self.my_template_name
        else:
            self.template_name = None
            TemplateView.content_type = 'application/json'

        return context

    def render_to_response(self, context, **response_kwargs):
        """
        Overriding to handle case of data only request (render=False).  In
        that case an application/json data payload is returned.
        """
        response = self._build_region_tree()
        if isinstance(response, HttpResponseBadRequest):
            return response

        if self.template_name is None:
            return HttpResponse(json.dumps(response),
                                content_type="application/json")

        return TemplateView.render_to_response(
            self, {'data': json.dumps(response)})
