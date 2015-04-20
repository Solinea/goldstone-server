"""Keystone utilities."""
# Copyright 2015 Solinea, Inc.
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
from goldstone.keystone.models import EndpointsData
from goldstone.utils import NoResourceFound, TopologyMixin


class DiscoverTree(TopologyMixin):

    def __init__(self):
        self.endpoints = EndpointsData().get()

    def _get_endpoint_regions(self):
        if self.endpoints is None:
            return []
        else:
            return set(
                [
                    r['region']
                    for ep in self.endpoints
                    for r in ep['endpoints']
                ])

    def get_regions(self):
        return [{"rsrcType": "region", "label": r} for r in
                self._get_endpoint_regions()]

    def _populate_regions(self):

        if self.endpoints is None or len(self.endpoints.hits) == 0:
            raise NoResourceFound("No keystone endpoints found in database")

        updated = self.endpoints[0]['@timestamp']

        result = []
        for region in self._get_endpoint_regions():
            result.append(
                {"rsrcType": "region",
                 "label": region,
                 "info": {"last_updated": updated},
                 "children": [
                     {
                         "rsrcType": "endpoints-leaf",
                         "label": "endpoints",
                         "region": region,
                         "info": {
                             "last_update": updated
                         }
                     },
                     {
                         "rsrcType": "roles-leaf",
                         "label": "roles",
                         "region": region,
                         "info": {
                             "last_update": updated
                         }
                     },
                     {
                         "rsrcType": "services-leaf",
                         "label": "services",
                         "region": region,
                         "info": {
                             "last_update": updated
                         }
                     },
                     {
                         "rsrcType": "tenants-leaf",
                         "label": "tenants",
                         "region": region,
                         "info": {
                             "last_update": updated
                         }
                     },
                     {
                         "rsrcType": "users-leaf",
                         "label": "users",
                         "region": region,
                         "info": {
                             "last_update": updated
                         }
                     }
                 ]}
            )

        return result

    def build_topology_tree(self):

        try:
            regions = self._populate_regions()

            return \
                {"rsrcType": "cloud", "label": "Cloud", "children": regions} \
                if len(regions) > 1 else regions[0]

        except (IndexError, NoResourceFound):
            return {"rsrcType": "error", "label": "No data found"}
