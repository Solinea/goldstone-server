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
                     'last_seen',
                     'last_seen_method',
                     'admin_disabled')
    lookup_field = 'uuid'
    lookup_url_kwarg = 'uuid'
    ordering_fields = '__all__'
    ordering = 'last_seen'

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


# works, but no pagination
class EventViewSet(GenericViewSet):

    serializer_class = EventSerializer

    def list(self, request):
        '''
        the request accepts params 'end_ts' and 'lookback_mins'.  The value of
        'end_ts' is a unix timestamp (millisecond resolution) representing the
        upper bounds of the created field in the record.

        The lookback_mins field will be treated as an integer and subtracted
        from the value used for the upper bounds of created (end_ts or now).
        '''

        kw = dict()
        now = arrow.utcnow()
        end_ts = str(now.timestamp)
        qp = request.QUERY_PARAMS.dict()
        end = arrow.get(qp.get('end_ts', end_ts))
        kw['created__lte'] = end.isoformat()

        lookback_mins = int(qp.get(
            'lookback_mins', settings.EVENT_LOOKBACK_MINUTES)) * -1
        kw['created__gte'] = end.replace(minutes=lookback_mins).isoformat()

        events = Event.search(**kw)
        serializer = EventSerializer(events, many=True)
        return Response(serializer.data)

    def retrieve(self, request, pk='id'):
        event = Event.get(_id=pk)
        if event is None:
            return Response(status=status.HTTP_404_NOT_FOUND)

        serializer = EventSerializer(event, many=False)
        return Response(serializer.data)

    def destroy(self, request, pk='id'):
        event = Event.get(_id=pk)
        if event is None:
            return Response(status=status.HTTP_202_ACCEPTED)
        else:
            try:
                event.get_object().delete()
                return Response(status=status.HTTP_202_ACCEPTED)
            except:
                return Response(status=status.HTTP_502_BAD_GATEWAY)

    def create(self, request):
        serializer = EventSerializer(data=request.DATA, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
