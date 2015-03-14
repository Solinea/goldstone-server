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
from rest_framework.fields import BooleanField
import logging

from rest_framework import serializers
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView

from goldstone.apps.core.serializers import IntervalField, \
    ArrowCompatibleField, CSVField
from goldstone.apps.drfes.views import ElasticListAPIView
from goldstone.apps.logging.models import LogData
from rest_framework.response import Response
from goldstone.apps.logging.serializers import LogDataSerializer, \
    LogAggSerializer

logger = logging.getLogger(__name__)


class LogDataView(ElasticListAPIView):
    """A view that handles requests for Logstash data."""

    # TODO fix permission_classes to restrict
    permission_classes = (AllowAny,)
    serializer_class = LogDataSerializer

    class Meta:
        model = LogData


class LogAggView(APIView):
    """A view that handles requests for Logstash aggregations."""

    # TODO fix permission_classes to restrict
    permission_classes = (AllowAny,)
    serializer_class = LogAggSerializer

    class Meta:
        model = LogData
        reserved_params = ['interval', 'per_host']

    def _get_data(self):
        return LogData.ranged_log_agg(**self.validated_params)

    def get(self, request, *args, **kwargs):
        """Return a response to a GET request."""
        params = self.ParamValidator(data=request.query_params)
        params.is_valid(raise_exception=True)
        self.validated_params = params.to_internal_value(request.query_params)

        data = self._get_data()
        serializer = self.serializer_class(data)
        return Response(serializer.data)
