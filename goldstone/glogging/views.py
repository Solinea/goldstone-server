"""Logging app views."""
# Copyright 2015 Solinea, Inc.
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
from goldstone.drfes.views import ElasticListAPIView
from goldstone.glogging.models import LogData, LogEvent
from goldstone.glogging.serializers import LogDataSerializer, \
    LogAggSerializer, LogEventAggSerializer
from rest_framework.response import Response


class LogDataView(ElasticListAPIView):
    """Return logging data.

    \n\nQuery string parameters:\n

    <b>name__prefix</b>: The desired service name prefix. E.g.,
                         nova.hypervisor.vcpus, nova.hypervisor.mem, etc.\n
    <b>@timestamp__range</b>: The time range, as xxx:nnn. Xxx is one of:
                              gte, gt, lte, or lt.  Nnn is an epoch number.
                              E.g., gte:1430164651890.\n\n

    """

    serializer_class = LogDataSerializer

    class Meta:       # pylint: disable=C1001,W0232
        """Meta"""
        model = LogData


class LogAggView(ElasticListAPIView):
    """Return a Logstash aggregation.

    \n\nQuery string parameters:\n

    <b>name__prefix</b>: The desired service name prefix. E.g.,
                         nova.hypervisor.vcpus, nova.hypervisor.mem, etc.\n
    <b>@timestamp__range</b>: The time range, as xxx:nnn. Xxx is one of:
                              gte, gt, lte, or lt.  Nnn is an epoch number.
                              E.g., gte:1430164651890.\n\n

    """

    serializer_class = LogAggSerializer
    reserved_params = ['interval', 'per_host']

    class Meta:     # pylint: disable=C1001,W0232
        """Meta"""
        model = LogData

    def get(self, request, *args, **kwargs):
        """Return a response to a GET request."""
        import ast

        base_queryset = self.filter_queryset(self.get_queryset())
        interval = self.request.query_params.get('interval', '1d')
        per_host = ast.literal_eval(
            self.request.query_params.get('per_host', 'True'))

        data = LogData.ranged_log_agg(base_queryset, interval, per_host)
        serializer = self.serializer_class(data)

        return Response(serializer.data)


class LogEventView(ElasticListAPIView):
    """Return events from Logstash data.

    \n\nQuery string parameters:\n

    <b>name__prefix</b>: The desired service name prefix. E.g.,
                         nova.hypervisor.vcpus, nova.hypervisor.mem, etc.\n
    <b>@timestamp__range</b>: The time range, as xxx:nnn. Xxx is one of:
                              gte, gt, lte, or lt.  Nnn is an epoch number.
                              E.g., gte:1430164651890.\n\n

    """

    serializer_class = LogDataSerializer

    class Meta:     # pylint: disable=C1001,W0232
        """Meta"""
        model = LogEvent


class LogEventAggView(ElasticListAPIView):
    """Return a Logstash aggregation.

    \n\nQuery string parameters:\n

    <b>name__prefix</b>: The desired service name prefix. E.g.,
                         nova.hypervisor.vcpus, nova.hypervisor.mem, etc.\n
    <b>@timestamp__range</b>: The time range, as xxx:nnn. Xxx is one of:
                              gte, gt, lte, or lt.  Nnn is an epoch number.
                              E.g., gte:1430164651890.\n\n

    """

    serializer_class = LogEventAggSerializer
    reserved_params = ['interval', 'per_host']

    class Meta:     # pylint: disable=C1001,W0232
        """Meta"""
        model = LogEvent

    def get(self, request, *args, **kwargs):
        """Return a response to a GET request."""
        import ast

        base_queryset = self.filter_queryset(self.get_queryset())
        interval = self.request.query_params.get('interval', '1d')
        per_host = ast.literal_eval(
            self.request.query_params.get('per_host', 'True'))

        data = LogEvent.ranged_event_agg(base_queryset, interval, per_host)
        serializer = self.serializer_class(data)

        return Response(serializer.data)
