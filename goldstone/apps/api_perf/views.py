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
from rest_framework.response import Response
from goldstone.apps.api_perf.models import ApiPerfData
from goldstone.views import validate
import logging

logger = logging.getLogger(__name__)


class ApiPerfAggView(DateHistogramAggView):
    """The get view for API perf aggregate data."""

    serializer_class = ApiPerfAggSerializer
    reserved_params = ['interval']
    RANGE_AGG_NAME = 'response_status'
    STATS_AGG_NAME = 'stats'

    class Meta:
        """Meta"""
        model = ApiPerfData

    def get(self, request):
        """Handle get request. Override default to add nested aggregations."""
        search = self._get_search(request)
        search.aggs[self.AGG_NAME]. \
            metric(self.STATS_AGG_NAME, self.Meta.model.stats_agg()). \
            bucket(self.RANGE_AGG_NAME, self.Meta.model.range_agg())
        serializer = self.serializer_class(search.execute().aggregations)
        return Response(serializer.data)
