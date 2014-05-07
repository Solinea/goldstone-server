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
from .models import ApiPerfData, ImageData
import logging

logger = logging.getLogger(__name__)


class DiscoverView(TopLevelView):
    template_name = 'glance_discover.html'


class ReportView(TopLevelView):
    template_name = 'glance_report.html'


class ImageApiPerfView(ApiPerfView):
    my_template_name = 'glance_api_perf.html'

    def _get_data(self, context):
        return ApiPerfData().get(context['start_dt'], context['end_dt'],
                                 context['interval'])


class TopologyView(TopologyView):

    def my_template_name(self):
        return 'glance_topology.html'

    def __init__(self):
        self.images = ImageData().get()

    def _get_image_regions(self):
        return set([s['_source']['region'] for s in self.images])

    def _get_regions(self):
        return [{"rsrcType": "region", "label": r} for r in
                self._get_image_regions()]

    def _transform_image_list(self):
        logger.debug("in _transform_image_list, s[0] = %s",
                     json.dumps(self.images[0]))
        try:
            updated = self.images[0]['_source']['@timestamp']
            region = self.images[0]['_source']['region']
            return [
                {"rsrcType": "image",
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

    def _build_topology_tree(self):
        rl = self._get_regions()

        if len(rl) == 0:
            return {}

        il = self._transform_image_list()

        ad = {'sourceRsrcType': 'image',
              'targetRsrcType': 'region',
              'conditions': "%source%['region'] == %target%['label']"}

        rl = self._attach_resource(ad, il, rl)

        if len(rl) > 1:
            return {"rsrcType": "cloud", "label": "Cloud", "children": rl}
        else:
            return rl[0]
