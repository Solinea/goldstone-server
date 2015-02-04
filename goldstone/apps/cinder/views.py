"""Cinder views."""
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
import logging

from goldstone.views import *
from .models import *

logger = logging.getLogger(__name__)


class ReportView(TopLevelView):
    template_name = 'cinder_report.html'


class ApiPerfView(ApiPerfView):
    my_template_name = 'cinder_api_perf.html'

    def _get_data(self, context):
        return ApiPerfData().get(context['start_dt'],
                                 context['end_dt'],
                                 context['interval'])


class JsonListView(ListAPIView):
    """A base view that renders a JSON response for "list" actions; i.e.,
    GET requests for a collection of objects.

    This is subclassed.

    """

    # We render only to JSON format.
    renderer_classes = (JSONRenderer)

    # These are overridden by the subclass.
    zone_key = None
    key = None
    model = None

    def _get_data(self, request_zone, request_region):
        """Return the data to be returned in the response.

        :param request_zone: The "zone" provided in the request, if present.
        :type request_zone: str or None
        :param request_rgion: The "region" provided in the request, if present.
        :type request_region: str or None

        """

        try:
            self.data = self.model().get()

            result = []

            for item in data:
                region = item['_source']['region']

                if request_region is None or request_region == region:
                    ts = item['_source']['@timestamp']

                    new_list = []

                    for rec in item['_source'][key]:
                        if request_zone is None or self.zone_key is None or \
                                request_zone == rec[self.zone_key]:
                            rec['region'] = region
                            rec['@timestamp'] = ts
                            new_list.append(rec)

                    result.append(new_list)

            return result

        except TypeError:
            return [[]]

    def get(self, request, *args, **kwargs):
        """Implement the GET request."""

        # Extract a zone or region provided in the request, if present.
        request_zone = self.request.GET.get('zone')
        request_region = self.request.GET.get('region')

        # Now fetch the data to be returned, convert it to JSON, and return it.
        try:
            content = self._get_data(request_zone, request_region)
            content = json.dumps(content)
            return HttpResponse(content=content,
                                content_type='application/json')
        except ElasticsearchException:
            return HttpResponse(content="Could not connect to the "
                                        "search backend",
                                status=status.HTTP_504_GATEWAY_TIMEOUT)


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
