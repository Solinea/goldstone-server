"""Cinder utilities."""
# Copyright '2014 - 2015' Solinea, Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
from goldstone.utils import TopologyMixin


class DiscoverTree(TopologyMixin):

    def __init__(self):
        """Initialization.

        To minimize payload here, we'll assume that there are no zones
        that don't have at least one service.

        """
        from .models import TransfersData, VolTypesData, ServicesData

        self.transfers = TransfersData().get()
        self.vol_types = VolTypesData().get()
        self.services = ServicesData().get()

    def _get_service_regions(self):
        if self.services is None:
            return []
        else:
            return set([s['_source']['region'] for s in self.services])

    def _get_regions(self):
        return [{"rsrcType": "region", "label": r} for r in
                self._get_service_regions()]

    def _populate_regions(self):
        result = []
        updated = self.services[0]['_source']['@timestamp']
        for region in self._get_service_regions():
            result.append(
                {"rsrcType": "region",
                 "label": region,
                 "info": {"last_updated": updated},
                 "children": [
                     {
                         "rsrcType": "volume-types-leaf",
                         "label": "volume types",
                         "region": region,
                         "info": {
                             "last_update": updated
                         }
                     },
                     {
                         "rsrcType": "snapshots-leaf",
                         "label": "snapshots",
                         "region": region,
                         "info": {
                             "last_update": updated
                         }
                     },
                     {
                         "rsrcType": "transfers-leaf",
                         "label": "transfers",
                         "region": region,
                         "info": {
                             "last_update": updated
                         }
                     },
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
            z['zone']
            for z in self.services[0]['_source']['services']
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
                        "rsrcType": "services-leaf",
                        "label": "services",
                        "region": region,
                        "zone": zone,
                        "info": {
                            "last_update": updated
                        }
                    },
                    {
                        "rsrcType": "volumes-leaf",
                        "label": "volumes",
                        "region": region,
                        "zone": zone,
                        "info": {
                            "last_update": updated
                        }
                    },
                    {
                        "rsrcType": "backups-leaf",
                        "label": "backups",
                        "region": region,
                        "zone": zone,
                        "info": {
                            "last_update": updated
                        }
                    },

                ]
            })

        return result

    def _build_topology_tree(self):
        from goldstone.utils import GoldstoneAuthError, NoResourceFound

        try:
            if self.services is None or len(self.services) == 0:
                raise NoResourceFound(
                    "No cinder services found in database")

            updated = self.services[0]['_source']['@timestamp']
            rl = self._populate_regions()
            new_rl = []
            for region in rl:
                zl = self._get_zones(updated, region['label'])
                ad = {'sourceRsrcType': 'zone',
                      'targetRsrcType': 'region',
                      'conditions': "%source%['region'] == %target%['label']"}
                region = self._attach_resource(ad, zl, [region])[0]

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
