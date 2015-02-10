"""Nova app utilities."""
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
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either expressed or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
from goldstone.utils import TopologyMixin, NoResourceFound, GoldstoneAuthError
from .models import AvailZonesData


class DiscoverTree(TopologyMixin):

    def __init__(self):
        self.azs = AvailZonesData().get()

    def _get_region_names(self):
        if self.azs is None:
            return []
        else:
            return set([s['_source']['region'] for s in self.azs])

    def get_regions(self):
        return [{"rsrcType": "region", "label": r}
                for r in self._get_region_names()]

    def _populate_regions(self):
        result = []
        updated = self.azs[0]['_source']['@timestamp']

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
             for zn in self.azs[0]['_source']['availability_zones']]
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
            if self.azs is None or len(self.azs) == 0:
                raise NoResourceFound(
                    "No nova availability zones found in database")

            updated = self.azs[0]['_source']['@timestamp']

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
