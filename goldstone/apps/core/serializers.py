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
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
import arrow
from rest_framework import serializers
from .models import Node, Event, Metric, Report
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


class NodeSerializer(serializers.ModelSerializer):

    class Meta:
        model = Node
        lookup_field = 'id'


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

        if type(field_value) is list:
            new_val = []
            for item in field_value:
                try:
                    new_val.append(json.loads(item))
                except Exception:
                    new_val.append(item)
            return new_val
        else:
            return field_value

    def to_representation(self, instance):

        return {
            'timestamp': instance.timestamp,
            'name': instance.name,
            'node': instance.node,
            'value': self._transform_value(instance.value)
        }
