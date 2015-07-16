"""Api_perf views."""
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
from goldstone.api_perf.models import ApiPerfData
from goldstone.api_perf.serializers import ApiPerfAggSerializer
from goldstone.drfes.views import DateHistogramAggView


# TODO: Scheduled for deletion.

class ApiPerfAggView(DateHistogramAggView):
    """Aggregated API performance data."""

    serializer_class = ApiPerfAggSerializer
    reserved_params = ['interval']
    RANGE_AGG_NAME = 'response_status'
    STATS_AGG_NAME = 'stats'

    class Meta:          # pylint: disable=C0111,W0232,C1001
        model = ApiPerfData

    # Our API documentation extracts this docstring, hence the use of markup.
    def get(self, request):
        """Return aggregated API performance data.

        This overrides the Elasticsearch defaults to add nested aggregations.

        ---

        parameters:
           - name: component
             description: The OpenStack service to query.
             enum: [nova, neutron, keystone, glance, cinder]
             paramType: query
           - name: interval
             description: The desired time interval, as n(s|m|h|w). E.g., 1d or
                          3m.
             required: true
             paramType: query
           - name: "@timestamp__range"
             description: The time range, as {'xxx':nnn}. Xxx is gte, gt,
                          lte, or lt.  Nnn is an epoch number.  E.g.,
                          {'gte':1430164651890}. You can also use AND, e.g.,
                          {'gte':1430164651890, 'lt':1455160000000}
             paramType: query

        """

        search = self._get_search(request)
        search.aggs[self.AGG_NAME]. \
            metric(self.STATS_AGG_NAME, self.Meta.model.stats_agg()). \
            bucket(self.RANGE_AGG_NAME, self.Meta.model.range_agg())

        serializer = self.serializer_class(search.execute().aggregations)
        return Response(serializer.data)
