# Copyright 2014 Solinea, Inc.
#
# Licensed under the Solinea Software License Agreement (goldstone),
# Version 1.0 (the "License"); you may not use this file except in compliance
# with the License. You may obtain a copy of the License at:
#
#     http://www.solinea.com/goldstone/LICENSE.pdf
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.


__author__ = 'John Stanford'

from .models import *
from .serializers import *
import logging
import arrow
from django.http import Http404, HttpResponseBadRequest, HttpResponseNotAllowed
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet, GenericViewSet, \
    ReadOnlyModelViewSet

logger = logging.getLogger(__name__)


class ElasticViewSetMixin(object):
    QUERY_OPS = ["match", "fuzzy", "wildcard", "match_phrase", "query_string"]
    FILTER_OPS = ["in", "prefix", "gte", "lte", "gt", "lt"]
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

            for k, v in params.items():
                if len(k.split("__")) > 1 and \
                        k.split("__")[1] in self.QUERY_OPS:
                    result['query_kwargs'][k] = v
                elif len(k.split("__")) > 1 and \
                        k.split("__")[1] in self.FILTER_OPS:
                    result['filter_kwargs'][k] = v
                elif k in self.MODIFIERS and v.lower == "true":
                    result['modifier'][k] = v
                elif k == "ordering":
                    mapping = self.model.get_mapping()
                    if v in mapping['properties'] and \
                            mapping['properties'][v]['type'] == 'string':
                        result['order_by'] = v + ".raw"
                    else:
                        result['order_by'] = v
                elif k not in ['page', 'page_size']:
                    result['filter_kwargs'][k] = v

            if len(result["query_kwargs"]) > 0:
                result["query_kwargs"] = dict(result["query_kwargs"].items() +
                                              result["modifier"].items())
                del result['modifier']
            return result
        except:
            logger.exception("Problem processing query params")
            return None

    def get_queryset(self):
        params = self._process_params(self.request.QUERY_PARAMS.dict())
        if self.model is not None:
            qs = self.model().search(). \
                query(**params['query_kwargs']). \
                filter(**params['filter_kwargs'])
            if 'order_by' in params:
                qs = qs.order_by(params['order_by'])
            return qs
        else:
            logger.error("No model set in ViewSet class")
            return None

    def get_object(self, queryset=None):
        q = self.get_queryset()
        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
        lookup = self.kwargs.get(lookup_url_kwarg, None)
        if lookup is not None:
            filter_kwargs = {self.lookup_field: lookup}
        q_result = q.filter(**filter_kwargs)[:1].execute()
        if q_result.count > 1:
            logger.warning("multiple objects with %s = %s, only returning "
                           "first one.", lookup_url_kwarg, lookup)
        if q_result.count > 0:
            obj = q_result.objects[0].get_object()
            return obj
        else:
            raise Http404


class ElasticViewSet(ElasticViewSetMixin, ModelViewSet):
    pass


class ReadOnlyElasticViewSet(ElasticViewSetMixin, ReadOnlyModelViewSet):
    pass


class NodeViewSet(ModelViewSet):
    queryset = Node.objects.all()
    serializer_class = NodeSerializer
    filter_fields = ('uuid',
                     'name',
                     'last_seen_method',
                     'admin_disabled')
    lookup_field = 'uuid'
    lookup_url_kwarg = 'uuid'
    ordering_fields = '__all__'
    ordering = 'updated'

    def create(self, request, *args, **kwargs):
        return Response(status=status.HTTP_400_BAD_REQUEST,
                        data="Node creation not supported.")

    def update(self, request, *args, **kwargs):
        return Response(status=status.HTTP_400_BAD_REQUEST,
                        data="Direct update not supported.")

    def partial_update(self, request, *args, **kwargs):
        return Response(status=status.HTTP_400_BAD_REQUEST,
                        data="Direct partial update not supported.")

    @action(methods=['PATCH'])
    def enable(self, request, uuid=None, format=None):
        node = self.get_object()
        if node is not None:
            node.admin_disabled = False
            node.save()
            serializer = NodeSerializer(node)
            return Response(serializer.data)
        else:
            raise Http404

    @action(methods=['PATCH'])
    def disable(self, request, uuid=None, format=None):
        node = self.get_object()
        if node is not None:
            node.admin_disabled = True
            node.save()
            serializer = NodeSerializer(node)
            return Response(serializer.data)
        else:
            raise Http404

    def destroy(self, request, uuid=None, format=None):
        node = self.get_object()
        if node.admin_disabled:
            node.delete()
        else:
            return Response(status=status.HTTP_400_BAD_REQUEST,
                            data="Must disable before deleting")
        return Response(status=status.HTTP_204_NO_CONTENT)


class EventViewSet(ElasticViewSet):
    model = EventType
    serializer_class = EventSerializer
    # filter_fields = ('uuid',
    #                  'name',
    #                  'last_seen_method',
    #                  'admin_disabled')
    lookup_field = '_id'
    lookup_url_kwarg = '_id'
    ordering = '-created'


class MetricViewSet(ReadOnlyElasticViewSet):
    model = MetricType
    serializer_class = MetricSerializer
    lookup_field = '_id'
    lookup_url_kwarg = '_id'
    ordering = '-timestamp'

    def retrieve(self, request, *args, **kwargs):
        return HttpResponseNotAllowed('')


class ReportViewSet(ReadOnlyElasticViewSet):
    model = ReportType
    serializer_class = ReportSerializer
    lookup_field = "_id"
    lookup_url_kwarg = '_id'
    ordering = '-timestamp'

    def retrieve(self, request, *args, **kwargs):
        return HttpResponseNotAllowed('')
