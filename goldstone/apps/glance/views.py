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

from goldstone.utils import _get_region_for_glance_client, \
    _normalize_hostnames, _get_keystone_client, _get_client

__author__ = 'John Stanford'

from goldstone.views import *
from .models import ApiPerfData, ImageData, HostData
import logging

logger = logging.getLogger(__name__)


class ReportView(TopLevelView):
    template_name = 'glance_report.html'


class ImageApiPerfView(ApiPerfView):
    my_template_name = 'glance_api_perf.html'

    def _get_data(self, context):
        return ApiPerfData().get(context['start_dt'], context['end_dt'],
                                 context['interval'])


class DiscoverView(TopologyView):

    def my_template_name(self):
        return 'glance_discover.html'

    def __init__(self):
        self.hosts = HostData().get()
        self.images = ImageData().get()

    def _get_image_regions(self):
        return set([s['_source']['region'] for s in self.images])

    def _get_regions(self):
        kc = _get_client(service='keystone')['client']
        r = _get_region_for_glance_client(kc)
        return [{"rsrcType": "region", "label": r}]

    def _transform_hosts_list(self):

        # hosts list can have more than one list of hosts depending on the
        # count param of HostsData.get.  We will wrap each of them and preserve
        # the list structure
        try:
            logger.debug("in _transform_host_list, s[0] = %s",
                         json.dumps(self.hosts[0]))
            updated = self.hosts[-1]['@timestamp']
            region = self._get_regions()[0]['label']

            hlist = [
                {"rsrcType": "host",
                 "label": h,
                 "region": region,
                 "info": {"last_update": updated}
                 }
                for h in self.hosts[-1]['hosts']
            ]
            _normalize_hostnames(['label'], hlist)
            return hlist
        except Exception as e:
            logger.exception(e)
            return []

    def _transform_image_list(self):

        try:
            logger.debug("in _transform_image_list, s[0] = %s",
                         json.dumps(self.images[0]))
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

        hl = self._transform_hosts_list()

        ad = {'sourceRsrcType': 'host',
              'targetRsrcType': 'region',
              'conditions': "%source%['region'] == %target%['label']"}

        rl = self._attach_resource(ad, hl, rl) if hl else rl

        if len(rl) > 1:
            return {"rsrcType": "cloud", "label": "Cloud", "children": rl}
        else:
            return rl[0]
