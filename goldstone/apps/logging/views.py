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


__author__ = 'John Stanford'

from .models import *
from .serializers import *
import logging
from rest_framework import status
from rest_framework.response import Response
from goldstone.apps.core.views import NodeViewSet

logger = logging.getLogger(__name__)


class LoggingNodeViewSet(NodeViewSet):
    serializer_class = LoggingNodeSerializer
    lookup_field = '_id'
    lookup_url_kwarg = '_id'
    ordering = '-updated'

    end_time = arrow.utcnow()
    start_time = end_time.replace(
        minutes=(-1 * settings.LOGGING_NODE_LOGSTATS_LOOKBACK_MINUTES))

    def _add_headers(self, response):
        response._headers['LogCountEnd'] = \
            ('LogCountEnd', self.end_time.isoformat())
        response._headers['LogCountStart'] = \
            ('LogCountStart', self.start_time.isoformat())
        return response

    def retrieve(self, request, *args, **kwargs):
        """
        Get the node first, then use the node name to get the logging stats.
        Our get_object should return the converged data
        """
        node = self.get_object()
        if node is not None:
            lns = LoggingNodeStats(
                self.start_time, self.end_time).for_node(node.name)
            logger.debug("now to sew this monster together...")
            node.info_count = lns.get('info', 0)
            node.audit_count = lns.get('audit', 0)
            node.warning_count = lns.get('warning', 0)
            node.error_count = lns.get('error', 0)
            node.debug_count = lns.get('debug', 0)
            serializer = LoggingNodeSerializer(node)
            return self._add_headers(Response(serializer.data))
        else:
            raise Http404
