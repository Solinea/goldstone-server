"""DRFES views."""
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
import ast
from rest_framework.exceptions import ValidationError

from rest_framework.generics import ListAPIView
from rest_framework.response import Response
from goldstone.drfes.filters import ElasticFilter
from goldstone.drfes.pagination import ElasticPageNumberPagination
from goldstone.drfes.serializers import ReadOnlyElasticSerializer, \
    SimpleAggSerializer, DateHistogramAggSerializer


class ElasticListAPIView(ListAPIView):
    """A view that handles requests for ES search results."""

    serializer_class = ReadOnlyElasticSerializer
    pagination_class = ElasticPageNumberPagination
    filter_backends = (ElasticFilter, )
    reserved_params = ['page_size', 'page']

    class Meta:            # pylint: disable=C0111,C1001,W0232
        model = None

    def get_queryset(self):
        """Gets a search object from the model."""

        assert self.Meta.model is not None, (
            "'%s' should set the `Meta.model` attribute, "
            "or override the `get_queryset()` method."
            % self.__class__.__name__
        )
        return self.Meta.model.search()

    def get(self, request, *args, **kwargs):
        """Return a response to a GET request."""

        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)

        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class SimpleAggView(ElasticListAPIView):
    """A view that handles requests for terms aggregations.

    Currently it support a top-level report name aggregation only.  The
    scope can be limited to a specific host, time range, etc. by using
    query params such has host=xyz or @timestamp__range={'gt': 0}"""

    serializer_class = SimpleAggSerializer
    AGG_FIELD = None
    AGG_NAME = None

    class Meta:              # pylint: disable=C0111,C1001,W0232
        model = None

    def get(self, request, *args, **kwargs):
        """Return a response to a GET request."""

        assert self.AGG_FIELD is not None, (
            "'%s' should set the `AGG_FIELD` attribute."
            % self.__class__.__name__
        )
        assert self.AGG_NAME is not None, (
            "'%s' should set the `AGG_NAME` attribute."
            % self.__class__.__name__
        )

        base_queryset = self.filter_queryset(self.get_queryset())

        # add a top-level aggregation for the field
        search = base_queryset.params(search_type="count")
        search.aggs.bucket(self.AGG_NAME, "terms",
                           field=self.AGG_FIELD,
                           min_doc_count=1,
                           size=0)

        serializer = self.serializer_class(search.execute().aggregations)
        return Response(serializer.data)


class DateHistogramAggView(ElasticListAPIView):

    interval = None
    start = None
    end = None
    AGG_FIELD = '@timestamp'
    AGG_NAME = 'per_interval'
    reserved_params = ['interval']
    serializer_class = DateHistogramAggSerializer

    class Meta:              # pylint: disable=C0111,C1001,W0232
        model = None

    def get(self, request):
        """Handle get request."""

        search = self._get_search(request)
        serializer = self.serializer_class(search.execute().aggregations)
        return Response(serializer.data)

    def _get_search(self, request):
        """Return the search object prior to serialization.

        Can be used by subclasses that override get.

        """

        self._validate_params(request)

        base_queryset = self.filter_queryset(self.get_queryset())

        # we can also find the start/end from any range param provided.
        range_param = request.query_params.get(self.AGG_FIELD + "__range",
                                               None)

        bounds_min, bounds_max = (None, None) if range_param is None else \
            self._extract_time_range(range_param)

        return self.Meta.model.simple_datehistogram_agg(
            base_queryset,
            self.interval,
            field=self.AGG_FIELD,
            agg_name=self.AGG_NAME,
            min_doc_count=0,
            bounds_min=bounds_min,
            bounds_max=bounds_max)

    def _validate_params(self, request):

        self.interval = request.query_params.get('interval')

        if self.interval is None:
            raise ValidationError("Parameter 'interval' is required.")
        else:
            try:
                postfix = self.interval[-1]
                base = self.interval[0:-1]
                if postfix not in ['s', 'm', 'h', 'w', 'd']:
                    raise ValidationError("Parameter 'interval' must be a "
                                          "number with a postfix in ['s', 'm',"
                                          " 'h', 'w', 'd'].")
                if type(ast.literal_eval(base)) not in [int, float]:
                    raise ValidationError("Parameter 'interval' must be a "
                                          "number with a postfix in ['s', 'm',"
                                          " 'h', 'w', 'd'].")
            except Exception:
                raise ValidationError("Parameter 'interval' is malformed.")

    def _extract_time_range(self, range_spec):
        """Return the time range from the query parameter."""

        try:
            range_spec = ast.literal_eval(range_spec)
            range_min = None
            range_max = None
            if 'gte' in range_spec:
                range_min = range_spec['gte']
            if 'gt' in range_spec:
                range_min = range_spec['gt']
            if 'lte' in range_spec:
                range_max = range_spec['lte']
            if 'lt' in range_spec:
                range_max = range_spec['lt']
            return range_min, range_max
        except Exception:
            param = self.AGG_FIELD + "__range"
            raise ValidationError("Parameter '%s' is malformed." % param)
