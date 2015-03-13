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
import arrow
from rest_framework import serializers, fields
from .models import Event, Metric, Report, PolyResource
import logging

logger = logging.getLogger(__name__)


class EventSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    event_type = serializers.CharField(max_length=64)
    source_id = serializers.CharField(max_length=36,
                                      required=False,
                                      default="")
    source_name = serializers.CharField(max_length=64,
                                        required=False,
                                        default="")
    message = serializers.CharField(max_length=1024)
    created = serializers.DateTimeField(required=False)

    class Meta:
        model = Event
        lookup_field = '_id'

    def to_representation(self, instance):
        return {
            'id': instance.id,
            'event_type': instance.event_type,
            'source_id': instance.source_id,
            'source_name': instance.source_name,
            'message': instance.message,
            'created': arrow.get(instance.created).isoformat()
        }

    def create(self, validated_data):
        event = Event(**validated_data)
        event.save()
        return event

    def update(self, instance, validated_data):
        instance.event_type = validated_data.get('event_type',
                                                 instance.event_type)
        instance.message = validated_data.get('message', instance.message)
        instance.source_id = validated_data.get('source_id',
                                                instance.source_id)
        instance.source_name = validated_data.get('source_name',
                                                  instance.source_name)
        instance.created = validated_data.get('created', instance.created)
        instance.save()
        return instance


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


#
# More specific serializers types for our API
#

class ArrowCompatibleField(serializers.CharField):
    """Field that holds Arrow friendly datetime expressions"""

    def to_internal_value(self, data):
        """Return an arrow date or raise a ValidationError"""

        try:
            return arrow.get(data)
        except Exception:
            raise serializers.ValidationError(
                'The input format was not recognized.')

    def to_representation(self, value):
        """Return an isoformat representation of the arrow date"""

        return value.isoformat()


class IntervalField(serializers.CharField):
    """Field that holds ES friendly interval expressions"""

    def to_internal_value(self, data):
        """Return validated data or raise a ValidationError"""
        try:
            if data[-1] not in ['s', 'm', 'h', 'd']:
                raise ValueError

            float(data[:-1])
            return data
        except Exception:
            raise serializers.ValidationError(
                'Interval should be a number followed by one of '
                '[s, m, h, d].')


class CSVField(serializers.CharField):
    """Ensures that the form of a field is suitable to be represented as a list

    Valid form is anything that can be deserialized to a JSON list or a single
    token that will be put inside a list for internal representation.
    """

    def to_internal_value(self, data):
        """Return a list object or raise a ValidationError"""
        import json

        try:
            return data.split(',')
        except Exception:
            raise serializers.ValidationError(
                'The input format was not recognized.')
