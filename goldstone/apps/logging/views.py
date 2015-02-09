"""Logging app views."""
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
from django.conf import settings
import arrow
from .serializers import LoggingNodeSerializer
import logging
from rest_framework.response import Response
from goldstone.apps.core.views import NodeViewSet

logger = logging.getLogger(__name__)


class LoggingNodeViewSet(NodeViewSet):

    serializer_class = LoggingNodeSerializer

    @staticmethod
    def get_request_time_range(params_dict):

        end_time = \
            arrow.get(params_dict['end_time']) if 'end_time' in params_dict \
            else arrow.utcnow()

        start_time = \
            arrow.get(params_dict['start_time']) \
            if 'start_time' in params_dict \
            else end_time.replace(
                minutes=(-1 * settings.LOGGING_NODE_LOGSTATS_LOOKBACK_MINUTES))

        return {'start_time': start_time, 'end_time': end_time}

    @staticmethod
    def _add_headers(response, time_range):
        """Add time logging to a response's header."""

        # pylint: disable=W0212
        response._headers['LogCountEnd'] = \
            ('LogCountEnd', time_range['end_time'].isoformat())
        response._headers['LogCountStart'] = \
            ('LogCountStart', time_range['start_time'].isoformat())

        return response

    def list(self, request, *args, **kwargs):

        time_range = self.get_request_time_range(request.QUERY_PARAMS.dict())
        instance = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(instance)

        serializer = self.get_pagination_serializer(page) if page is not None \
            else self.get_serializer(instance, many=True)

        serializer.context['start_time'] = time_range['start_time']
        serializer.context['end_time'] = time_range['end_time']

        return self._add_headers(Response(serializer.data), time_range)

    def retrieve(self, request, *args, **kwargs):

        time_range = self.get_request_time_range(request.QUERY_PARAMS.dict())

        serializer = self.serializer_class(
            self.get_object(),
            context={'start_time': time_range['start_time'],
                     'end_time': time_range['end_time']})

        return self._add_headers(Response(serializer.data), time_range)
