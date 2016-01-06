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

from rest_framework.response import Response
from goldstone.core.views import SavedSearchViewSet

from goldstone.drfes.views import ElasticListAPIView
from goldstone.glogging.models import LogData
from goldstone.glogging.serializers import LogDataSerializer, \
    LogAggSerializer


class LogDataView(ElasticListAPIView):
    """Return data for the /search endpoint.

    ---

    GET:
        parameters:
           - name: "@timestamp__range"
             description: The time range, as {'xxx':nnn}. Xxx is gte, gt, lte,
                          or lt.  Nnn is an epoch number.  E.g.,
                          {'gte':1430164651890}. You can also use AND, e.g.,
                          {'gte':1430164651890, 'lt':1455160000000}
             paramType: query
           - name: name__prefix
             description: The desired service name prefix. E.g.,
                          nova.hypervisor.vcpus, nova.hypervisor.mem, etc.\n
             paramType: query
           - name: _all__regexp
             description: A regular expression for which to search.  This is
                          lowercased before its use
             paramType: query

    """

    serializer_class = LogDataSerializer

    class Meta:       # pylint: disable=C1001,W0232
        """Meta"""
        model = LogData


class LogAggView(ElasticListAPIView):
    """Return data for the /summarize endpoint.

    ---

    GET:
        parameters:
           - name: "@timestamp__range"
             description: The time range, as {'xxx':nnn}. Xxx is gte, gt, lte,
                          or lt.  Nnn is an epoch number.  E.g.,
                          {'gte':1430164651890}. You can also use AND, e.g.,
                          {'gte':1430164651890, 'lt':1455160000000}
             paramType: query
           - name: name__prefix
             description: The desired service name prefix. E.g.,
                          nova.hypervisor.vcpus, nova.hypervisor.mem, etc.\n
             paramType: query

    """

    serializer_class = LogAggSerializer

    # Do not add these query parameters to the Elasticsearch query.
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
