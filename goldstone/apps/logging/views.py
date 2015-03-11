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
from rest_framework.generics import ListAPIView
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView

from goldstone.apps.core.serializers import IntervalField, \
    ArrowCompatibleField, CSVField
from goldstone.apps.drfes.serializers import ReadOnlyElasticSerializer
from goldstone.apps.drfes.views import ElasticListAPIView
from goldstone.apps.logging.models import LogData
from .serializers import LoggingNodeSerializer
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

        time_range = self.get_request_time_range(request.query_params.dict())
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


class LogDataSerializer(ReadOnlyElasticSerializer):

    class Meta:
        exclude = ('@version', 'message', 'syslog_ts', 'received_at', 'sort',
                   'tags', 'syslog_facility_code', 'syslog_severity_code',
                   'syslog_pri', 'syslog5424_pri', 'syslog5424_host', 'type')


class LogAggSerializer(ReadOnlyElasticSerializer):
    """Custom serializer to manipulate the aggregation that comes back from ES.
    """

    def to_representation(self, instance):
        """Create serialized representation of aggregate log data.

        There will be a summary block that can be used for ranging, legends,
        etc., then the detailed aggregation data which will be a nested
        structure.  The number of layers will depend on whether the host
        aggregation was done.
        """

        timestamps = [i['key'] for i in instance.per_interval['buckets']]
        levels = [i['key'] for i in instance.per_level['buckets']]
        hosts = [i['key'] for i in instance.per_host['buckets']] \
            if hasattr(instance, 'per_host') else None

        # let's clean up the inner buckets
        data = []
        if hosts is None:
            for interval_bucket in instance.per_interval.buckets:
                key = interval_bucket.key
                values = [{item.key: item.doc_count}
                          for item in interval_bucket.per_level.buckets]
                data.append({key: values})

        else:
            for interval_bucket in instance.per_interval.buckets:
                interval_key = interval_bucket.key
                interval_values = []
                for host_bucket in interval_bucket.per_host.buckets:
                    key = host_bucket.key
                    values = [{item.key: item.doc_count}
                              for item in host_bucket.per_level.buckets]
                    interval_values.append({key: values})
                data.append({interval_key: interval_values})

        if hosts is not None:
            return {
                'timestamps': timestamps,
                'hosts': hosts,
                'levels': levels,
                'data': data
            }
        else:
            return {
                'timestamps': timestamps,
                'levels': levels,
                'data': data
            }


class LogDataView(ElasticListAPIView):
    """A view that handles requests for Logstash data."""

    permission_classes = (AllowAny,)
    serializer_class = LogDataSerializer

    class Meta:
        model = LogData


class LogAggView(APIView):
    """A view that handles requests for Logstash aggregations."""

    permission_classes = (AllowAny,)
    serializer_class = LogAggSerializer

    class ParamValidator(serializers.Serializer):
        """An inner class that validates and deserializes the request context.
        """
        start = ArrowCompatibleField(
            required=False,
            allow_blank=True)
        end = ArrowCompatibleField(
            required=False,
            allow_blank=True)
        interval = IntervalField(
            required=False,
            allow_blank=True)
        hosts = CSVField(
            required=False,
            allow_blank=True),
        per_host = BooleanField(
            default=True)

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
