"""Api_perf views."""
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
import calendar
from datetime import datetime
from urlparse import urlparse
from django.http import HttpResponseBadRequest, HttpResponse
from rest_framework.views import APIView
from goldstone.apps.api_perf.models import ApiPerfData
from goldstone.apps.api_perf.utils import stack_api_request_base
from goldstone.views import TopLevelView, validate
import logging
import arrow

logger = logging.getLogger(__name__)


class ReportView(TopLevelView):
    template_name = 'api_perf_report.html'


class ApiPerfView(APIView):
    """The base class for all app "ApiPerfView" views."""

    def _get_data(self, context):
        import arrow
        return ApiPerfData.get_stats(arrow.get(context['start_dt']),
                                     arrow.get(context['end_dt']),
                                     context['interval'],
                                     context['component'],
                                     context['uri'])

    def get(self, request, *args, **kwargs):
        """Return a response to a GET request."""

        import json

        # Fetch and enhance this request's context.
        context = {
            # Use "now" if not provided. Validate() will calculate the start
            # and interval. Arguments missing from the request are set to None.

            # TODO convert this calendar stuff to arrow
            'end':
            request.query_params.get(
                'end',
                str(calendar.timegm(datetime.utcnow().timetuple()))),
            'start': request.query_params.get('start'),
            'interval': request.query_params.get('interval'),
            'component': request.query_params.get('component'),
            }

        # TODO user DRF validation instead of custom.
        context = validate(['start', 'end', 'interval'], context)

        if isinstance(context, HttpResponseBadRequest):
            # validation error
            return context

        # TODO this is a flagrant violation of modularity.
        # It was done
        # during the rework of api_perf, and supports the celery task calls.
        # We should continue to enhance the API parameter handling to
        # generalize the API performance interface, and allow the client to
        # provide information to make this block unnecessary.

        if 'uri' not in context:
            if context['component'] == 'cinder':
                context['uri'] = urlparse(stack_api_request_base(
                    "volumev2", "/os-services")['url']).path
            elif context['component'] == 'glance':
                context['uri'] = urlparse(stack_api_request_base(
                    "image", "/v2/images")['url']).path
            elif context['component'] == 'keystone':
                context['uri'] = "/v2.0/tokens"
            elif context['component'] == 'neutron':
                context['uri'] = urlparse(stack_api_request_base(
                    "network", "v2.0/agents")['url']).path
            elif context['component'] == 'nova':
                context['uri'] = urlparse(stack_api_request_base(
                    "compute", "/os-hypervisors")['url']).path
            else:
                context['uri'] = None

        logger.debug("[get] start_dt = %s", context['start_dt'])
        data = self._get_data(context)

        # Good policy, but don't think it is required for this specific
        # dataset
        if not data.empty:
            data = data.fillna(0)

        # Record output may be a bit bulkier, but easier to process by D3. Keys
        # appear to be in alphabetical order, so we could use orient=values to
        # trim it down, or pass it in a binary format if things get really
        # messy.
        response = list(data.to_json(orient='records'))

        # We already have the response in the desired format. So, we return a
        # Django response instead of a DRF response.
        return HttpResponse(response, content_type="application/json")
