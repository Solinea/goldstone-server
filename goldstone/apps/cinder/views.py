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
