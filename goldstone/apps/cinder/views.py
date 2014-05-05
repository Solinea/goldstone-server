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
from .models import ApiPerfData
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

class TopologyView(TemplateView):
    """
    Produces a view of the glance topology (or json data if render=false).
    The data structure is a list of resource types.  If the list contains
    only one element, it will be used as the root node, otherwise a "cloud"
    resource will be constructed as the root.

    A resource has the following structure:

    {
        "rsrcType": "cloud|region|image",
        "label": "string",
        "info": {"key": "value" [, "key": "value", ...]}, (optional)
        "lifeStage": "new|existing|absent", (optional)
        "enabled": True|False, (optional)
        "children": [rsrcType] (optional)
     }

    """
    my_template_name = 'cinder_topology.html'

    def __init__(self):
        self.services = ServiceData().get()
        self.volumes = VolumeData().get()

    def _get_image_regions(self):
        return set([s['_source']['region'] for s in self.images])

    def _transform_image_list(self):
        logger.debug("in _transform_image_list, s[0] = %s",
                     json.dumps(self.images[0]))
        try:
            updated = self.images[0]['_source']['@timestamp']
            region = self.images[0]['_source']['region']
            return [
                {"rsrcType": "service",
                 "label": s['name'],
                 "enabled": True if s['status'] == 'active' else False,
                 "region": region,
                 "info": {
                     'id': s['id'],
                     'name': s['name'],
                     'tags': s['tags'],
                     'container_format': s['container_format'],
                     'disk_format': s['disk_format'],
                     'protected': s['protected'],
                     'size': s['size'],
                     'checksum': s['checksum'],
                     'min_disk': s['min_disk'],
                     'min_ram': s['min_ram'],
                     'created_at': s['created_at'],
                     'updated_at': s['updated_at'],
                     'visibility': s['visibility'],
                     'owner': s['owner'],
                     'file': s['file'],
                     'schema': s['schema'],
                     "last_update": updated

                 }} for s in self.images[0]['_source']['images']
            ]
        except Exception as e:
            logger.exception(e)
            return []

    def _build_region_tree(self):
        rl = [{"rsrcType": "region", "label": r} for r in
              self._get_image_regions()]
        if len(rl) == 0:
            return {}

        il = self._transform_image_list()

        for r in rl:
            children = []
            for i in il:
                if i['region'] == r['label']:
                    children.append(i)
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
