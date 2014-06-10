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

import ast
import copy
import itertools
from goldstone.utils import _is_ip_addr, _partition_hostname, _resolve_fqdn, \
    _resolve_addr, _host_details, _normalize_hostnames, _normalize_hostname

__author__ = 'John Stanford'

from goldstone.views import *
from .models import ApiPerfData, ServiceData, TransferData, VolTypeData, \
    VolumeData, BackupData, SnapshotData
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
        self.transfers = TransferData().get()
        self.vol_types = VolTypeData().get()
        self.services = ServiceData().get()
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


def _get_data_for_json_view(context, data, key):
    result = []
    for item in data:
        region = item['_source']['region']
        ts = item['_source']['@timestamp']
        new_list = []
        for rec in item['_source'][key]:
            rec['region'] = region
            rec['@timestamp'] = ts
            new_list.append(rec)

        result.append(new_list)
        return result


class VolumeDataView(JSONView):
    def _get_data(self, context):
        data = VolumeData().get()
        return _get_data_for_json_view(context, data, 'volumes')


class BackupDataView(JSONView):
    def _get_data(self, context):
        data = BackupData().get()
        return _get_data_for_json_view(context, data, 'backups')


class SnapshotDataView(JSONView):
    def _get_data(self, context):
        data = SnapshotData().get()
        return _get_data_for_json_view(context, data, 'snapshots')


class ServiceDataView(JSONView):
    def _get_data(self, context):
        data = ServiceData().get()
        return _get_data_for_json_view(context, data, 'services')


class VolumeTypeDataView(JSONView):
    def _get_data(self, context):
        data = VolTypeData().get()
        return _get_data_for_json_view(context, data, 'volume_types')


class TransferDataView(JSONView):
    def _get_data(self, context):
        data = TransferData().get()
        return _get_data_for_json_view(context, data, 'transfers')
