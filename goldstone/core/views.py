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
from goldstone.apps.drfes.serializers import DateHistogramAggSerializer
from goldstone.apps.drfes.views import ElasticListAPIView, SimpleAggView, \
    DateHistogramAggView

from .models import MetricData, ReportData
from .serializers import MetricDataSerializer, ReportDataSerializer, \
    MetricNamesAggSerializer, ReportNamesAggSerializer


class MetricDataListView(ElasticListAPIView):
    """A view that handles requests for events from Logstash data."""

    serializer_class = MetricDataSerializer

    class Meta:
        model = MetricData


class ReportDataListView(ElasticListAPIView):
    """A view that handles requests for events from Logstash data."""

    serializer_class = ReportDataSerializer

    class Meta:
        model = ReportData


class ReportNamesAggView(SimpleAggView):
    """A view that handles requests for Report name aggregations.

    Currently it support a top-level report name aggregation only.  The
    scope can be limited to a specific host, time range, etc. by using
    query params such has host=xyz or @timestamp__range={'gt': 0}"""

    serializer_class = ReportNamesAggSerializer
    AGG_FIELD = 'name'
    AGG_NAME = 'per_name'

    class Meta:
        model = ReportData

    def get_queryset(self):
        from elasticsearch_dsl.query import Q, Prefix

        queryset = super(ReportNamesAggView, self).get_queryset()
        return queryset.query(~Q(Prefix(name='os.service')))


class MetricNamesAggView(SimpleAggView):
    """A view that handles requests for Report name aggregations.

    Currently it support a top-level report name aggregation only.  The
    scope can be limited to a specific host, time range, etc. by using
    query params such has host=xyz or @timestamp__range={'gt': 0}"""

    serializer_class = MetricNamesAggSerializer
    AGG_FIELD = 'name'
    AGG_NAME = 'per_name'

    class Meta:
        model = MetricData


class MetricAggView(DateHistogramAggView):
    """A view that handles requests for Metric aggregations."""

    class Meta:
        """Meta"""
        model = MetricData

