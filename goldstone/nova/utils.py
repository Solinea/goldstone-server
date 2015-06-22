"""Nova app utilities."""
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
from goldstone.utils import TopologyMixin, NoResourceFound, GoldstoneAuthError


class DiscoverTree(TopologyMixin):

    def __init__(self):
        from .models import AvailZonesData

        self.azs = AvailZonesData().get()

    def _get_region_names(self):
        if self.azs is None:
            return []
        else:
            return set([s['region'] for s in self.azs])

    def get_regions(self):
        return [{"rsrcType": "region", "label": r}
                for r in self._get_region_names()]

    def _populate_regions(self):
        result = []
        updated = self.azs[0]['@timestamp']

        for region in self._get_region_names():
            result.append(
                {"rsrcType": "region",
                 "label": region,
                 "info": {"last_updated": updated},
                 "children": [
                     {
                         "rsrcType": "flavors-leaf",
                         "label": "flavors",
                         "region": region,
                         "info": {
                             "last_update": updated
                         }
                     },
                     {
                         "rsrcType": "hypervisors-leaf",
                         "label": "hypervisors",
                         "region": region,
                         "info": {
                             "last_update": updated
                         }
                     }
                 ]}
            )

        return result

    def _get_zones(self, updated, region):
        """
        returns the zone structure derived from both services.
        has children hosts populated as the attachment point for the services
        and volumes in the graph.
        """
        zones = set(
            [zn['zoneName']
             for zn in self.azs[0]['availability_zones']]
        )

        result = []
        for zone in zones:
            # create children for services, volumes, backups, and snapshots
            result.append({
                "rsrcType": "zone",
                "label": zone,
                "region": region,
                "info": {
                    "last_update": updated
                },
                "children": [
                    {
                        "rsrcType": "aggregates-leaf",
                        "label": "aggregates",
                        "region": region,
                        "zone": zone,
                        "info": {
                            "last_update": updated
                        }
                    },
                    {
                        "rsrcType": "hosts-leaf",
                        "label": "hosts",
                        "region": region,
                        "zone": zone,
                        "info": {
                            "last_update": updated
                        }
                    },
                    {
                        "rsrcType": "servers-leaf",
                        "label": "instances",
                        "region": region,
                        "zone": zone,
                        "info": {
                            "last_update": updated
                        }
                    },
                    {
                        "rsrcType": "services-leaf",
                        "label": "services",
                        "region": region,
                        "zone": zone,
                        "info": {
                            "last_update": updated
                        }
                    }
                ]
            })

        return result

    def build_topology_tree(self):

        try:
            if self.azs is None or len(self.azs.hits) == 0:
                raise NoResourceFound(
                    "No nova availability zones found in database")

            updated = self.azs[0]['@timestamp']

            regions = self._populate_regions()
            new_rl = []

            for region in regions:
                zones = self._get_zones(updated, region['label'])
                state = {'sourceRsrcType': 'zone',
                         'targetRsrcType': 'region',
                         'conditions':
                         "%source%['region'] == %target%['label']"}
                region = self._attach_resource(state, zones, [region])[0]

                new_rl.append(region)

            if len(new_rl) > 1:
                return {"rsrcType": "cloud", "label": "Cloud",
                        "children": new_rl}
            else:
                return new_rl[0]

        except (IndexError, NoResourceFound):
            return {"rsrcType": "error", "label": "No data found"}

        except GoldstoneAuthError:
            raise


def update_nova_nodes():
    """Update the Resource graph's Nova nodes and edges from the current
    OpenStack cloud state.

    Nodes are:
       - deleted if they are no longer in the OpenStack cloud.
       - added if they are in the OpenStack cloud, but not in the graph.
       - updated from the cloud if they are already in the graph.

    """
    from goldstone.core.models import AvailabilityZone, Host, Cloudpipe, \
        Server, Flavor, Hypervisor, Interface, Keypair
    from goldstone.core.utils import process_resource_type

    # The resource type "from" nodes.
    FROM_TYPES = [AvailabilityZone, Cloudpipe, Flavor, Host, Hypervisor,
                  Interface, Keypair, Server]

    for nodetype in FROM_TYPES:
        process_resource_type(nodetype)
