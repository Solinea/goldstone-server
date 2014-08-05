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

from rest_framework import serializers
from goldstone.apps.core.serializers import NodeSerializer
from .models import LoggingNode


class LoggingNodeSerializer(NodeSerializer):
    error_count = serializers.IntegerField(read_only=True)
    warning_count = serializers.IntegerField(read_only=True)
    info_count = serializers.IntegerField(read_only=True)
    audit_count = serializers.IntegerField(read_only=True)
    debug_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = LoggingNode
        lookup_field = 'uuid'
        exclude = ['id']
