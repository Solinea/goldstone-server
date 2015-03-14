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

from django.http import Http404, HttpResponseNotAllowed
import elasticutils
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet, ReadOnlyModelViewSet

from .models import Event, Metric, Report
from .serializers import EventSerializer, MetricSerializer, \
    ReportSerializer

logger = logging.getLogger(__name__)


class ElasticViewSetMixin(object):
    QUERY_OPS = ["match", "fuzzy", "wildcard", "match_phrase", "query_string",
                 "gte", "lte", "gt", "lt"]
    FILTER_OPS = ["in", "prefix"]
    MODIFIERS = ["should", "must", "must_not"]
    ordering = None

    def _process_params(self, params):
        result = {
            "query_kwargs": {},
            "filter_kwargs": {},
            "modifier": {"must": True}
        }

        try:
            if self.ordering is not None:
                result['order_by'] = self.ordering

            for key, value in params.items():
                if len(key.split("__")) > 1 and \
                        key.split("__")[1] in self.QUERY_OPS:
                    result['query_kwargs'][key] = value
                elif len(key.split("__")) > 1 and \
                        key.split("__")[1] in self.FILTER_OPS:
                    result['filter_kwargs'][key] = value
                elif key in self.MODIFIERS and value.lower() == "true":
                    result['modifier'] = {key: value}
                elif key == "ordering":
                    field = value

                    try:
                        mapping = self.model.get_mapping()
                        # handle descending specification
                        if value.startswith("-"):
                            field = value[1:]
                        if field in mapping['properties'] and \
                                mapping['properties'][field]['type'] == \
                                'string':
                            result['order_by'] = value + ".raw"
                        else:
                            result['order_by'] = value
                    except AttributeError:
                        # handle case where there is no model backing the view
                        result['order_by'] = value

                elif key not in ['page', 'page_size']:
                    result['filter_kwargs'][key] = value

            if len(result["query_kwargs"]) > 0:
                result["query_kwargs"] = dict(result["query_kwargs"].items() +
                                              result["modifier"].items())
                del result['modifier']

            return result

        except Exception:         # pylint: disable=W0703
            logger.exception("Problem processing query params")
            return None

    def get_queryset(self):

        params = self._process_params(self.request.QUERY_PARAMS.dict())

        if self.model is not None:
            queryset = self.model.es_objects. \
                query(**params['query_kwargs']). \
                filter(**params['filter_kwargs'])
            if 'order_by' in params:
                queryset = queryset.order_by(params['order_by'])
            return queryset
        else:
            logger.error("No model set in ViewSet class")
            return None

    def get_object(self):

        queryset = self.get_queryset()

        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
        lookup = self.kwargs.get(lookup_url_kwarg, None)

        if lookup is not None:
            filter_kwargs = {self.lookup_field: lookup}

        queryset_result = queryset.filter(**filter_kwargs)[:1].execute()

        if queryset_result.count > 1:
            logger.warning("multiple objects with %s = %s, only returning "
                           "first one.", lookup_url_kwarg, lookup)

        if queryset_result.count > 0:
            return queryset_result.objects[0].get_object()
        else:
            raise Http404


class ElasticViewSet(ElasticViewSetMixin, ModelViewSet):
    pass


class ReadOnlyElasticViewSet(ElasticViewSetMixin, ReadOnlyModelViewSet):
    pass


class EventViewSet(ElasticViewSet):

    model = Event
    serializer_class = EventSerializer
    lookup_field = '_id'
    lookup_url_kwarg = '_id'
    ordering = '-created'


class MetricViewSet(ReadOnlyElasticViewSet):

    model = Metric
    serializer_class = MetricSerializer
    lookup_field = '_id'
    lookup_url_kwarg = '_id'
    ordering = '-timestamp'

    def retrieve(self, request, *args, **kwargs):
        return HttpResponseNotAllowed('')


class ReportViewSet(ReadOnlyElasticViewSet):

    model = Report
    serializer_class = ReportSerializer
    lookup_field = "_id"
    lookup_url_kwarg = '_id'
    ordering = '-timestamp'

    def retrieve(self, request, *args, **kwargs):
        return HttpResponseNotAllowed('')


class ReportListView(ElasticViewSetMixin, APIView):

    def get(self, request, *args, **kwargs):
        """Return a list of reports in the system."""
        from django.conf import settings

        try:
            params = self._process_params(request.QUERY_PARAMS.dict())

            query = elasticutils.S().es(urls=settings.ES_URLS,
                                        timeout=2,
                                        max_retries=1,
                                        sniff_on_start=False)
            query = query. \
                indexes('goldstone_agent'). \
                doctypes('core_report'). \
                query(name__prefix='os.service', must_not=True). \
                query(**params['query_kwargs']). \
                filter(**params['filter_kwargs'])

            if 'order_by' in params:
                query = query.order_by(params['order_by'])

            # add the term facet clause
            query = query.facet("name", filtered=True, size=100)
            result = query.execute().facets
            result = result['name'].terms

            return Response([entry['term'] for entry in result],
                            status=status.HTTP_200_OK)

        except AttributeError:
            return Response([], status=status.HTTP_200_OK)
