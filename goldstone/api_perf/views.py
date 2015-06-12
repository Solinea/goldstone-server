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

        \n\nQuery string parameters:\n

        <b>start_time</b>: The desired start time, in UTC\n
        <b>end_time</b>: The desired end time, in UTC\n
        <b>interval</b>: The desired interval, as nnni. nnn is a number, i is
                         one of: smhwd.  E.g., 3600s.\n
        <b>@timestamp__range</b>: Another way to specify a time range. Value is
                                  xxx:nnn. Xxx is one of: gte, gt, lte, or lt.
                                  Nnn is an epoch number. E.g.,
                                  gte:1430164651890.\n
        <b>component</b>: The OpenStack service to query: nova, neutron,
                          keystone, glance, or cinder.

        """

        search = self._get_search(request)
        search.aggs[self.AGG_NAME]. \
            metric(self.STATS_AGG_NAME, self.Meta.model.stats_agg()). \
            bucket(self.RANGE_AGG_NAME, self.Meta.model.range_agg())

        serializer = self.serializer_class(search.execute().aggregations)
        return Response(serializer.data)
