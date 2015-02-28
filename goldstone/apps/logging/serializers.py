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
        """Enhance the serialized LoggingNode data with the log count stats"""

        from .utils import log_counts

        result = super(LoggingNodeSerializer, self).to_representation(obj)

        counts = log_counts(self.context['start_time'],
                            self.context['end_time'],
                            [obj.name])

        if len(counts) == 0:
            # no results for the node in question
            result['info_count'] = 0
            result['audit_count'] = 0
            result['warning_count'] = 0
            result['error_count'] = 0
            result['debug_count'] = 0
        else:
            # the first element should be our host
            result['info_count'] = counts[0][obj.name].get('info', 0)
            result['audit_count'] = counts[0][obj.name].get('audit', 0)
            result['warning_count'] = counts[0][obj.name].get('warning', 0)
            result['error_count'] = counts[0][obj.name].get('error', 0)
            result['debug_count'] = counts[0][obj.name].get('debug', 0)

        return result
