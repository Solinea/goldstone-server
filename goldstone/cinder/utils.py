"""Cinder utilities."""
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
from goldstone.utils import TopologyMixin


class DiscoverTree(TopologyMixin):
    """A topology class for cinder nodes."""

    def __init__(self):
        """Initialization.

        To minimize payload here, we'll assume that all zones have at least one
        service.

        """
        from .models import TransfersData, VolTypesData, ServicesData

        self.transfers = TransfersData().get()
        self.vol_types = VolTypesData().get()
        self.services = ServicesData().get()

    def _get_service_regions(self):
        """Return the regions of all the cinder services."""

        return [] if self.services is None \
            else set([s['region'] for s in self.services])

    def get_regions(self):
        """Return an rsrcType+label dict the regions in the cinder services."""

        return [{"rsrcType": "region", "label": r} for r in
                self._get_service_regions()]

    def _populate_regions(self):
        """Return boilerplate dicts for the regions in the cinder services."""

        updated = self.services[0]['@timestamp']

        result = [{"rsrcType": "region",
                   "label": region,
                   "info": {"last_updated": updated},
                   "children": [{"rsrcType": "volume-types-leaf",
                                 "label": "volume types",
                                 "region": region,
                                 "info": {"last_update": updated}
                                 },
                                {"rsrcType": "snapshots-leaf",
                                 "label": "snapshots",
                                 "region": region,
                                 "info": {"last_update": updated}
                                 },
                                {"rsrcType": "transfers-leaf",
                                 "label": "transfers",
                                 "region": region,
                                 "info": {"last_update": updated}
                                 }]}
                  for region in self._get_service_regions()]

        return result

    def _get_zones(self, updated, region):
        """Return zone boilerplate dicts."""

        zones = set(z['zone'] for z in self.services[0]['services'])

        result = [{"rsrcType": "zone",
                   "label": zone,
                   "region": region,
                   "info": {"last_update": updated},
                   "children": [{"rsrcType": "services-leaf",
                                 "label": "services",
                                 "region": region,
                                 "zone": zone,
                                 "info": {"last_update": updated},
                                 },
                                {"rsrcType": "volumes-leaf",
                                 "label": "volumes",
                                 "region": region,
                                 "zone": zone,
                                 "info": {"last_update": updated}
                                 },
                                {"rsrcType": "backups-leaf",
                                 "label": "backups",
                                 "region": region,
                                 "zone": zone,
                                 "info": {"last_update": updated}
                                 },
                                ]}
                  for zone in zones]

        return result

    def build_topology_tree(self):
        """Return a cinder topology tree."""
        from goldstone.utils import NoResourceFound

        try:
            if self.services is None or len(self.services.hits) == 0:
                raise NoResourceFound("No cinder services found in database")

            updated = self.services[0]['@timestamp']
            regionlist = self._populate_regions()
            new_regionlist = []

            for region in regionlist:
                zonelist = self._get_zones(updated, region['label'])
                node = {'sourceRsrcType': 'zone',
                        'targetRsrcType': 'region',
                        'conditions':
                        "%source%['region'] == %target%['label']"}
                region = self._attach_resource(node, zonelist, [region])[0]

                new_regionlist.append(region)

            if len(new_regionlist) > 1:
                return {"rsrcType": "cloud",
                        "label": "Cloud",
                        "children": new_regionlist}
            else:
                return new_regionlist[0]

        except (IndexError, NoResourceFound):
            return {"rsrcType": "error", "label": "No data found"}


def update_cinder_nodes():
    """Update the Resource graph's Cinder nodes and edges from the current
    OpenStack cloud state.

    Nodes are:
       - deleted if they are no longer in the OpenStack cloud.
       - added if they are in the OpenStack cloud, but not in the graph.
       - updated from the cloud if they are already in the graph.

    """
    from goldstone.core.models import QOSSpec, VolumeType, Snapshot
    from goldstone.core.utils import process_resource_type

    # The resource type "from" nodes.
    FROM_TYPES = [QOSSpec, VolumeType, Snapshot]

    for nodetype in FROM_TYPES:
        process_resource_type(nodetype)
