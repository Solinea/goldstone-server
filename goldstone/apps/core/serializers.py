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


import arrow
from rest_framework import serializers, pagination
from .models import Node, Event
import uuid


class NodeSerializer(serializers.ModelSerializer):
    uuid = serializers.CharField(read_only=True)
    name = serializers.CharField(read_only=True)
    created = serializers.DateTimeField(read_only=True)
    updated = serializers.DateTimeField(read_only=True)
    last_seen = serializers.CharField(read_only=True)
    last_seen_method = serializers.CharField(read_only=True)
    admin_disabled = serializers.CharField(read_only=True)

    class Meta:
        model = Node
        lookup_field = 'uuid'
        exclude = ['id']


class EventSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    event_type = serializers.CharField(max_length=64)
    source_id = serializers.CharField(max_length=36)
    message = serializers.CharField(max_length=1024)
    created = serializers.CharField(max_length=64)
    updated = serializers.CharField(max_length=64)

    def restore_object(self, attrs, instance=None):
        """
        Given a dictionary of deserialized field values, either update
        an existing model instance, or create a new model instance.
        """
        if instance is not None:
            instance.id = attrs.get(instance.id)
            instance.event_type = attrs.get('event_type', instance.event_type)
            instance.source_id = attrs.get('source_id', instance.source_id)
            instance.message = attrs.get('message', instance.message)
            instance.updated = attrs.get('updated', instance.updated)
            return instance

        return Event(**attrs)

    def validate(self, attrs):
        """
        Stop shenanigans.
        """
        created = None
        updated = None
        if 'id' in attrs:
            raise serializers.ValidationError("user provided id not allowed")
        if 'updated' in attrs:
            # must be a valid date
            try:
                updated = arrow.get(attrs['updated'])
                attrs['updated'] = updated.isoformat()
            except:
                raise serializers.ValidationError(
                    "updated field must be able to be transformed into a date."
                    "try using an isoformat date or a unix timestamp")

        if 'created' in attrs:
            # must be a valid date
            try:
                created = arrow.get(attrs['created'])
                attrs['created'] = created.isoformat()
            except:
                raise serializers.ValidationError(
                    "created field must be able to be transformed into a date."
                    "try using an isoformat date or a unix timestamp")

        if updated is not None and created is not None:
            if updated < created:
                raise serializers.ValidationError(
                    "updates must be at or after creation")
        if 'source_id' in attrs:
            try:
                uuid.UUID(attrs['source_id'])
            except ValueError:
                raise serializers.ValidationError(
                    'source_id must be a valid UUID')
        return attrs
