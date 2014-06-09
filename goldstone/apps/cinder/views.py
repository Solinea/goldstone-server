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
import ast
import copy
import itertools
from django.test import SimpleTestCase
from goldstone.utils import _is_ip_addr, _partition_hostname, _resolve_fqdn, \
    _resolve_addr, _host_details, _normalize_hostnames, _normalize_hostname

__author__ = 'John Stanford'

from goldstone.views import *
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
        return set([s['_source']['region'] for s in self.services])

    def _transform_voltype_list(self, updated, region):
        try:
            logger.debug("in _transform_voltype_list, s[0] = %s",
                         json.dumps(self.vol_types[0]))
            voltypes = {"vol_types": [
                {"rsrcType": "volume-type",
                 "label": s['name'],
                 "enabled": True,
                 "region": region,
                 "info": dict(s.items() + {
                     'last_update': updated}.items())}
                for s in self.vol_types[0]['_source']['volume_types']
            ]}
            return voltypes['vol_types']

        except Exception as e:
            logger.exception(e)
            return []

    def _transform_transfer_list(self, updated, region):
        try:
            logger.debug("in _transform_transfer_list, s[0] = %s",
                         json.dumps(self.transfers[0]))
            transfers = {"transfers": [
                {"rsrcType": "transfer",
                 "label": s['name'] if s['name'] else 'unnamed',
                 "enabled": True,
                 "region": region,
                 "info": dict(s.items() + {
                     'last_update': updated}.items())}
                for s in self.transfers[0]['_source']['transfers']
            ]}
            return transfers['transfers']

        except Exception as e:
            logger.exception(e)
            return []

    def _get_regions(self):
        return [{"rsrcType": "region", "label": r} for r in
                self._get_service_regions()]

    def _populate_regions(self):
        result = []
        updated = self.services[0]['_source']['@timestamp']
        for r in self._get_service_regions():
            vtl = [vt for vt in self._transform_voltype_list(updated, r)
                   if vt['region'] == r]
            ttl = [tt for tt in self._transform_transfer_list(updated, r)
                   if tt['region'] == r]
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
                        "info": {
                            "last_update": updated
                        }
                    },
                    {
                        "rsrcType": "volumes-leaf",
                        "label": "volumes",
                        "region": region,
                        "info": {
                            "last_update": updated
                        }
                    },
                    {
                        "rsrcType": "backups-leaf",
                        "label": "backups",
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
                    }
                ]
            })

        return result

    def _build_topology_tree(self):

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
            return {"rsrcType": "cloud", "label": "Cloud", "children": new_rl}
        else:
            return new_rl[0]


class VolumesDataView(JSONView):
    def __init__(self):
        self.data = VolumesData().get()
        self.key = 'volumes'


class BackupsDataView(JSONView):
    def __init__(self):
        self.data = BackupsData().get()
        self.key = 'backups'


class SnapshotsDataView(JSONView):
    def __init__(self):
        self.data = SnapshotsData().get()
        self.key = 'snapshots'


class ServicesDataView(JSONView):
    def __init__(self):
        self.data = ServicesData().get()
        self.key = 'services'


class VolumeTypesDataView(JSONView):
    def __init__(self):
        self.data = VolTypesData().get()
        self.key = 'volume_types'


class TransfersDataView(JSONView):
    def __init__(self):
        self.data = TransfersData().get()
        self.key = 'transfers'
