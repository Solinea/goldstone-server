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
from django.http import Http404
from elasticsearch import ElasticsearchException
from rest_framework import status


__author__ = 'John Stanford'

from .serializers import *
import logging
from rest_framework.response import Response
from goldstone.apps.core.views import NodeViewSet

logger = logging.getLogger(__name__)


class LoggingNodeViewSet(NodeViewSet):
    serializer_class = LoggingNodeSerializer
    lookup_field = '_id'
    lookup_url_kwarg = '_id'
    ordering = '-updated'
    model = Node

    def _set_time_range(self, params_dict):
        if 'end_time' in params_dict:
            self._end_time = arrow.get(params_dict['end_time'])
        else:
            self._end_time = arrow.utcnow()

        if 'start_time' in params_dict:
            self._start_time = arrow.get(
                params_dict['start_time'])
        else:
            self._start_time = self._end_time.replace(
                minutes=(-1 * settings.LOGGING_NODE_LOGSTATS_LOOKBACK_MINUTES))

    def _add_headers(self, response):
        response._headers['LogCountEnd'] = \
            ('LogCountEnd', self._end_time.isoformat())
        response._headers['LogCountStart'] = \
            ('LogCountStart', self._start_time.isoformat())
        return response

    def list(self, request, *args, **kwargs):
        try:
            self._set_time_range(request.QUERY_PARAMS.dict())
            instance = self.get_queryset()
            page = self.paginate_queryset(instance)
            if page is not None:
                serializer = self.get_pagination_serializer(page)
            else:
                serializer = self.get_serializer(instance, many=True)

            serializer.context['start_time'] = self._start_time
            serializer.context['end_time'] = self._end_time
            serializer.many = True
            return self._add_headers(Response(serializer.data))
        except ElasticsearchException as e:
            return Response(data="Could not connect to the ElasticSearch"
                                 " backend",
                            status=status.HTTP_504_GATEWAY_TIMEOUT)

    def retrieve(self, request, *args, **kwargs):
        try:
            self._set_time_range(request.QUERY_PARAMS.dict())
            serializer = self.serializer_class(
                self.get_object(),
                context={'start_time': self._start_time,
                         'end_time': self._end_time})
            return self._add_headers(Response(serializer.data))

        except ElasticsearchException as e:
            return Response(
                content="Could not connect to the ElasticSearch backend",
                status=status.HTTP_504_GATEWAY_TIMEOUT,
                content_type='application/json')
