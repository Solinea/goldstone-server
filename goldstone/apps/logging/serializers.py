"""Logging serializers."""
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
from goldstone.apps.core.serializers import NodeSerializer


class LoggingNodeSerializer(NodeSerializer):

    def to_representation(self, obj):
        from goldstone.apps.logging.models import LoggingNodeStats

        result = super(LoggingNodeSerializer, self).to_representation(obj)

        lns = LoggingNodeStats(
            self.context['start_time'],
            self.context['end_time']).for_node(obj.name)

        result['info_count'] = lns.get('info', 0)
        result['audit_count'] = lns.get('audit', 0)
        result['warning_count'] = lns.get('warning', 0)
        result['error_count'] = lns.get('error', 0)
        result['debug_count'] = lns.get('debug', 0)

        return result
