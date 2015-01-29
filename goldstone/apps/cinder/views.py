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

__author__ = 'John Stanford'

from goldstone.views import *
from goldstone.utils import NoResourceFound
from .models import *
import logging

logger = logging.getLogger(__name__)


class ReportView(TopLevelView):
    template_name = 'cinder_report.html'


class ServiceListApiPerfView(ApiPerfView):
    my_template_name = 'cinder_api_perf.html'

    def _get_data(self, context):
        return ApiPerfData().get(context['start_dt'], context['end_dt'],
                                 context['interval'])


class DiscoverView(TopologyView):

    def my_template_name(self):
        return 'cinder_discover.html'

    def __init__(self):
        self.transfers = TransfersData().get()
        self.vol_types = VolTypesData().get()
        self.services = ServicesData().get()
        # to minimize payload here, we'll assume that there are no zones
        # that don't have at least one service.

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
        for r in self._get_service_regions():
            result.append(
                {"rsrcType": "region",
                 "label": r,
                 "info": {"last_updated": updated},
                 "children": [
                     {
                         "rsrcType": "volume-types-leaf",
                         "label": "volume types",
                         "region": r,
                         "info": {
                             "last_update": updated
                         }
                     },
                     {
                         "rsrcType": "snapshots-leaf",
                         "label": "snapshots",
                         "region": r,
                         "info": {
                             "last_update": updated
                         }
                     },
                     {
                         "rsrcType": "transfers-leaf",
                         "label": "transfers",
                         "region": r,
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


class VolumesDataView(JSONView):
    model = VolumesData
    key = 'volumes'
    zone_key = 'availability_zone'


class BackupsDataView(JSONView):
    model = BackupsData
    key = 'backups'
    zone_key = 'availability_zone'


class SnapshotsDataView(JSONView):
    model = SnapshotsData
    key = 'snapshots'


class ServicesDataView(JSONView):
    model = ServicesData
    key = 'services'
    zone_key = 'zone'


class VolumeTypesDataView(JSONView):
    model = VolTypesData
    key = 'volume_types'


class TransfersDataView(JSONView):
    model = TransfersData
    key = 'transfers'
