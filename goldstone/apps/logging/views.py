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
from rest_framework.response import Response
from rest_framework.viewsets import ViewSet, GenericViewSet
from rest_framework import filters

__author__ = 'John Stanford'

from .models import *
from .serializers import *
import logging

logger = logging.getLogger(__name__)


class LoggingNodeViewSet(ViewSet):

    def get_filtered_list(self):
        """
        Optionally restricts the returned purchases to a given user,
        by filtering against a `username` query parameter in the URL.
        """
        nodes = LoggingNode.all()
        disabled_str = self.request.QUERY_PARAMS.get('disabled', None)
        if disabled_str is not None:
            disabled = None
            if disabled_str.lower() == 'false':
                disabled = False
            elif disabled_str.lower() == 'true':
                disabled = True
            logger.debug(
                "[get_filtered_list] got a disabled filter parameter = %s",
                str(disabled))
            nodes = [node for node in nodes if node.disabled is disabled]
        return nodes

    def list(self, request, format=None):
        logger.debug("[list] request params = %s",
                     json.dumps(request.QUERY_PARAMS))
        serializer = LoggingNodeSerializer(self.get_filtered_list(),
                                           many=True)
        return Response(serializer.data)

    def retrieve(self, request, pk, format=None):
        item = LoggingNode.get(pk)
        if item is not None:
            serializer = LoggingNodeSerializer(item)
            return Response(serializer.data)
        else:
            raise Http404

    def update(self, request, pk, format=None):
        """
        update a node record. all but the disabled value are silently ignored
        :param request:
        :param pk:
        :param format:
        :return: the new record
        """
        item = LoggingNode.get(pk)
        if item is not None:
            response = item.update(disabled=request.DATA['disabled'])
            serializer = LoggingNodeSerializer(response)
            return Response(serializer.data)
        else:
            raise Http404

    def destroy(self, request, pk, format=None):
        node = LoggingNode.get(pk)
        if node.disabled:
            node.delete()
        else:
            return Response(status=status.HTTP_400_BAD_REQUEST,
                            data="Must disable before deleting")
        return Response(status=status.HTTP_204_NO_CONTENT)
