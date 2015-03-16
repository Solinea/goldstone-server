"""Core serializers."""
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

from rest_framework import serializers
from .models import Metric, Report, PolyResource
import logging

logger = logging.getLogger(__name__)


class MetricSerializer(serializers.ModelSerializer):

    class Meta:
        model = Metric
        exclude = ['id']

    def to_representation(self, instance):
        return {
            'timestamp': instance.timestamp,
            'name': instance.name,
            'node': instance.node,
            'value': instance.value
        }


class ReportSerializer(serializers.ModelSerializer):

    class Meta:
        model = Report
        exclude = ['id']

    @staticmethod
    def _transform_value(field_value):
        """
        Values for reports can a list of simple types or objects.  Try to
        load them as objects first, then fall back to dumping their values
        into a list.
        """
        import json

        if isinstance(field_value, list):
            new_val = []
            for item in field_value:
                try:
                    new_val.append(json.loads(item))
                except Exception:          # pylint: disable=W0703
                    new_val.append(item)
            return new_val
        else:
            return field_value

    def to_representation(self, instance):

        return {'timestamp': instance.timestamp,
                'name': instance.name,
                'node': instance.node,
                'value': self._transform_value(instance.value)
                }


#
# This is the beginning of the new polymorphic resource model support
#
class PolyResourceSerializer(serializers.ModelSerializer):

    class Meta:
        model = PolyResource
        lookup_field = 'id'
        exclude = ['polymorphic_ctype']
