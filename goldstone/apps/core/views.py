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
from django.http import Http404
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet, GenericViewSet

logger = logging.getLogger(__name__)


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


class ESModelViewSet(ModelViewSet):
    """
    subclasses should set queryset and serializer class appropriately
    """
    order_by_field = "-created"
    lookup_field = "_id"
    queryset = EventType().search().query().order_by(order_by_field)
    serializer_class = None


class EventViewSet(ModelViewSet):
    queryset = EventType().search().query().order_by('-created')
    serializer_class = EventSerializer
    lookup_field = "_id"

    def list(self, request, *args, **kwargs):
        # adding support filter params
        params = request.QUERY_PARAMS.dict()
        if params is not None:
            # don't use the page related params as filters
            if settings.REST_FRAMEWORK['PAGINATE_BY_PARAM'] in params:
                del params[settings.REST_FRAMEWORK['PAGINATE_BY_PARAM']]
            if 'page' in params:
                del params['page']

            self.queryset = EventType().search().query().filter(**params). \
                order_by('-created')
            return super(EventViewSet, self).list(request, *args, **kwargs)

    def get_object(self):
        q = self.queryset
        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
        lookup = self.kwargs.get(lookup_url_kwarg, None)
        if lookup is not None:
            filter_kwargs = {self.lookup_field: lookup}
        q_result = q.filter(**filter_kwargs)[:1].execute()
        if q_result.count == 1:
            obj = q_result.objects[0].get_object()
            return obj
        else:
            raise Http404


class MetricViewSet(ModelViewSet):
    queryset = MetricType().search().query().order_by('-timestamp')
    # queryset = MetricType().search().query()
    serializer_class = MetricSerializer
    lookup_field = "_id"

    def list(self, request, *args, **kwargs):
        # adding support filter params
        params = request.QUERY_PARAMS.dict()
        if params != {}:
            # don't use the page related params as filters
            if settings.REST_FRAMEWORK['PAGINATE_BY_PARAM'] in params:
                del params[settings.REST_FRAMEWORK['PAGINATE_BY_PARAM']]
            if 'page' in params:
                del params['page']

            self.queryset = MetricType().search().query().filter(**params). \
                order_by('-timestamp')

        return super(MetricViewSet, self).list(request, *args, **kwargs)

    def get_object(self):
        q = self.queryset
        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
        lookup = self.kwargs.get(lookup_url_kwarg, None)
        if lookup is not None:
            filter_kwargs = {self.lookup_field: lookup}
        q_result = q.filter(**filter_kwargs)[:1].execute()
        if q_result.count == 1:
            obj = q_result.objects[0].get_object()
            return obj
        else:
            raise Http404


class ReportViewSet(ModelViewSet):
    queryset = ReportType().search().query().order_by('-timestamp')
    # queryset = MetricType().search().query()
    serializer_class = ReportSerializer
    lookup_field = "_id"

    def list(self, request, *args, **kwargs):
        # adding support filter params
        params = request.QUERY_PARAMS.dict()
        if params != {}:
            # don't use the page related params as filters
            if settings.REST_FRAMEWORK['PAGINATE_BY_PARAM'] in params:
                del params[settings.REST_FRAMEWORK['PAGINATE_BY_PARAM']]
            if 'page' in params:
                del params['page']

            self.queryset = ReportType().search().query().filter(**params). \
                order_by('-timestamp')

        return super(ReportViewSet, self).list(request, *args, **kwargs)

    def get_object(self):
        q = self.queryset
        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
        lookup = self.kwargs.get(lookup_url_kwarg, None)
        if lookup is not None:
            filter_kwargs = {self.lookup_field: lookup}
        q_result = q.filter(**filter_kwargs)[:1].execute()
        if q_result.count == 1:
            obj = q_result.objects[0].get_object()
            return obj
        else:
            raise Http404