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

from rest_framework.renderers import JSONRenderer
from rest_framework.viewsets import ReadOnlyModelViewSet

from goldstone.views import TopLevelView
from goldstone.views import ApiPerfView as GoldstoneApiPerfView
from .models import ApiPerfData, ServicesData, VolumesData, BackupsData, \
    SnapshotsData, VolTypesData, TransfersData

logger = logging.getLogger(__name__)


class ReportView(TopLevelView):
    """Cinder report view."""

    template_name = 'cinder_report.html'


class ApiPerfView(GoldstoneApiPerfView):
    """Cinder api_perf view."""

    my_template_name = 'cinder_api_perf.html'

    def _get_data(self, context):
        return ApiPerfData().get(context['start_dt'],
                                 context['end_dt'],
                                 context['interval'])


class JsonReadOnlyViewSet(ReadOnlyModelViewSet):
    """A ViewSet that renders a JSON response for "list" actions; i.e., GET
    requests for a collection of objects.

    Implementing views on new data sources is achieved by providing a
    new entry in the URLconf, and adding an entry to a dict.

    """

    # We render only to JSON format.
    renderer_classes = (JSONRenderer, )

    # The URLs that are implemented by this class.
    #
    # key: The base part of the URL that got here.
    # value: (model, key, zone_key).
    #
    # To add a new API endpoint:
    # 1. Add a router.register for it in urls.py. The first URL segment must be
    #    returned from the regex in the regex variable "base".
    # 2. Add an entry to this table.
    URLS = {"backups": (BackupsData, 'backups', 'availability_zone'),
            "services": (ServicesData, 'services', 'zone'),
            "snapshots": (SnapshotsData, 'snapshots', None),
            "transfers": (TransfersData, 'transfers', None),
            "volumes": (VolumesData, 'volumes', 'availability_zone'),
            "volume_types": (VolTypesData, 'volume_types', None),
            }

    def _get_objects(self, request_zone, request_region, base):
        """Return a collection of objects.

        :param request_zone: The request's "zone", if present.
        :type request_zone: str or None
        :param request_region: The request's "region", if present.
        :type request_region: str or None
        :param base: The first segment of the URL that got here
        :type base: str

        """

        # Get the model, key, and zone_key for this URL.
        model, key, zone_key = self.URLS.get(base, (None, None, None))

        try:
            data = model().get()

            result = []

            for item in data:
                region = item['_source']['region']

                if request_region is None or request_region == region:
                    timestamp = item['_source']['@timestamp']

                    new_list = []

                    for rec in item['_source'][key]:
                        if request_zone is None or zone_key is None or \
                                request_zone == rec[zone_key]:
                            rec['region'] = region
                            rec['@timestamp'] = timestamp
                            new_list.append(rec)

                    result.append(new_list)

            return result

        except TypeError:
            return [[]]

    def list(self, request, *args, **kwargs):
        """Implement the GET request for a collection.

        :keyword base: The first segment of the URL that got here.
        :type base: str

        """
        from elasticsearch import ElasticsearchException
        from rest_framework.response import Response
        from rest_framework import status

        # Extract a zone or region provided in the request, if
        # present. And remember the base segment of the URL that got
        # here.
        import pdb; pdb.set_trace()
        request_zone = self.request.data.get('zone')
        request_region = self.request.data.get('region')
        base = self.kwargs['base']

        # Now fetch the data to be returned, and return it as JSON.
        try:
            return Response(self._get_objects(request_zone,
                                              request_region,
                                              base))
        except ElasticsearchException:
            return Response("Could not connect to the search backend",
                            status=status.HTTP_504_GATEWAY_TIMEOUT)

    def retrieve(self, request, *args, **kwargs):
        """We do not implement single-object GET."""
        from django.http import HttpResponseNotAllowed

        return HttpResponseNotAllowed('')
