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
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

__author__ = 'John Stanford'

from .models import *
from .serializers import *
import logging

logger = logging.getLogger(__name__)


class LoggingNodeViewSet(ModelViewSet):
    queryset = LoggingNode.objects.all()
    serializer_class = LoggingNodeSerializer
    filter_fields = ('uuid', 'name', 'method', 'disabled')
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
            node.disabled = False
            node.save()
            serializer = LoggingNodeSerializer(node)
            return Response(serializer.data)
        else:
            raise Http404

    @action(methods=['PATCH'])
    def disable(self, request, uuid=None, format=None):
        node = self.get_object()
        if node is not None:
            node.disabled = True
            node.save()
            serializer = LoggingNodeSerializer(node)
            return Response(serializer.data)
        else:
            raise Http404

    def destroy(self, request, uuid=None, format=None):
        node = self.get_object()
        if node.disabled:
            node.delete()
        else:
            return Response(status=status.HTTP_400_BAD_REQUEST,
                            data="Must disable before deleting")
        return Response(status=status.HTTP_204_NO_CONTENT)
