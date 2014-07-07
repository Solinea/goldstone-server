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
from rest_framework.response import Response
from rest_framework.viewsets import ViewSet

__author__ = 'John Stanford'

from .models import *
from .serializers import *
import logging

logger = logging.getLogger(__name__)


class WhiteListNodeViewSet(ViewSet):

    def list(self, request, format=None):
        members = WhiteListNode.all()
        serializer = WhiteListNodeSerializer(members, many=True)
        return Response(serializer.data)

    def retrieve(self, request, name, format=None):
        item = WhiteListNode.get(name)
        if item is not None:
            serializer = WhiteListNodeSerializer(item)
            return Response(serializer.data)
        else:
            raise Http404


class BlackListNodeViewSet(ViewSet):

    def list(self, request, format=None):
        members = BlackListNode.all()
        serializer = BlackListNodeSerializer(members, many=True)
        return Response(serializer.data)

    def retrieve(self, request, name, format=None):
        item = BlackListNode.get(name)
        if item is not None:
            serializer = BlackListNodeSerializer(item)
            return Response(serializer.data)
        else:
            raise Http404
