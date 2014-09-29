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


__author__ = 'John Stanford'

from .models import *
from .serializers import *
import logging
from datetime import datetime, timedelta
from django.conf import settings
import pytz
from rest_framework import status
from rest_framework.response import Response
from goldstone.apps.core.views import NodeViewSet, EventViewSet

logger = logging.getLogger(__name__)


class LoggingNodeViewSet(NodeViewSet):
    queryset = LoggingNode.objects.all()
    serializer_class = LoggingNodeSerializer
    lookup_field = 'uuid'
    lookup_url_kwarg = 'uuid'
    ordering_fields = '__all__'
    ordering = 'last_seen'

    def _add_headers(self, response):
        end_time = datetime.now(tz=pytz.utc)
        start_time = end_time - timedelta(
            minutes=settings.LOGGING_NODE_LOGSTATS_LOOKBACK_MINUTES)

        response._headers['LogCountEnd'] = \
            ('LogCountEnd', end_time.isoformat())
        response._headers['LogCountStart'] = \
            ('LogCountStart', start_time.isoformat())
        return response

    def list(self, request, *args, **kwargs):
        response = super(LoggingNodeViewSet, self).list(
            request, *args, **kwargs)
        return self._add_headers(response)

    def retrieve(self, request, *args, **kwargs):
        response = super(LoggingNodeViewSet, self).retrieve(
            request, *args, **kwargs)
        return self._add_headers(response)

    def create(self, request, *args, **kwargs):
        return Response(status=status.HTTP_400_BAD_REQUEST,
                        data="Node creation not supported.")

    def update(self, request, *args, **kwargs):
        return Response(status=status.HTTP_400_BAD_REQUEST,
                        data="Direct update not supported.")

    def partial_update(self, request, *args, **kwargs):
        return Response(status=status.HTTP_400_BAD_REQUEST,
                        data="Direct partial update not supported.")

    def destroy(self, request, uuid=None, format=None):
        return Response(status=status.HTTP_400_BAD_REQUEST,
                        data="Destruction only supported for core nodes.")


class LoggingEventViewSet(EventViewSet):
    queryset = LoggingEvent.objects.all()
    serializer_class = LoggingEventSerializer
    lookup_field = 'uuid'
    lookup_url_kwarg = 'uuid'
    ordering_fields = '__all__'
    ordering = 'created'