"""Glance app utilities."""
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
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
from goldstone.apps.glance.models import ImagesData
from goldstone.utils import _get_region_for_glance_client, NoResourceFound, \
    GoldstoneAuthError, TopologyMixin


class DiscoverTree(TopologyMixin):

    def __init__(self):
        self.images = ImagesData().get()

    def _get_image_regions(self):
        return set([s['_source']['region'] for s in self.images])

    def _get_regions(self):
        from goldstone.utils import get_client

        kc = _get_client(service='keystone')['client']
        r = _get_region_for_glance_client(kc)
        return [{"rsrcType": "region", "label": r}]

    def _populate_regions(self):
        result = []
        updated = self.images[0]['_source']['@timestamp']
        for r in self._get_image_regions():
            result.append(
                {"rsrcType": "region",
                 "label": r,
                 "info": {"last_updated": updated},
                 "children": [
                     {
                         "rsrcType": "images-leaf",
                         "label": "images",
                         "region": r,
                         "info": {
                             "last_update": updated
                         }
                     }
                 ]}
            )

        return result

    def _build_topology_tree(self):
        try:
            if self.images is None or len(self.images) == 0:
                raise NoResourceFound(
                    "No glance images found in database")

            rl = self._populate_regions()

            if len(rl) > 1:
                return {"rsrcType": "cloud", "label": "Cloud", "children": rl}
            else:
                return rl[0]
        except (IndexError, NoResourceFound):
            return {"rsrcType": "error", "label": "No data found"}
        except GoldstoneAuthError:
            raise
