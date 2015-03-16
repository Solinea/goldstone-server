"""Core views."""
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
import logging

from rest_framework.permissions import AllowAny
from goldstone.apps.drfes.views import ElasticListAPIView

from .models import MetricData, ReportData
from .serializers import MetricDataSerializer, ReportDataSerializer

logger = logging.getLogger(__name__)


class MetricDataListView(ElasticListAPIView):
    """A view that handles requests for events from Logstash data."""

    serializer_class = MetricDataSerializer
    permission_classes = (AllowAny,)

    class Meta:
        model = MetricData


class ReportDataListView(ElasticListAPIView):
    """A view that handles requests for events from Logstash data."""

    serializer_class = ReportDataSerializer
    permission_classes = (AllowAny,)

    class Meta:
        model = ReportData


# class ReportListView(ElasticViewSetMixin, APIView):
#
#     def get(self, request, *args, **kwargs):
#         """Return a list of reports in the system."""
#         from django.conf import settings
#
#         try:
#             params = self._process_params(request.QUERY_PARAMS.dict())
#
#             query = elasticutils.S().es(urls=settings.ES_URLS,
#                                         timeout=2,
#                                         max_retries=1,
#                                         sniff_on_start=False)
#             query = query. \
#                 indexes('goldstone_agent'). \
#                 doctypes('core_report'). \
#                 query(name__prefix='os.service', must_not=True). \
#                 query(**params['query_kwargs']). \
#                 filter(**params['filter_kwargs'])
#
#             if 'order_by' in params:
#                 query = query.order_by(params['order_by'])
#
#             # add the term facet clause
#             query = query.facet("name", filtered=True, size=100)
#             result = query.execute().facets
#             result = result['name'].terms
#
#             return Response([entry['term'] for entry in result],
#                             status=status.HTTP_200_OK)
#
#         except AttributeError:
#             return Response([], status=status.HTTP_200_OK)
