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
from .models import Node, Event, Metric, Report
import uuid


class NodeSerializer(serializers.ModelSerializer):
    uuid = serializers.CharField(read_only=True)
    name = serializers.CharField(read_only=True)
    created = serializers.DateTimeField(read_only=True)
    updated = serializers.DateTimeField(read_only=True)
    last_seen_method = serializers.CharField(read_only=True)
    admin_disabled = serializers.CharField(read_only=True)

    class Meta:
        model = Node
        lookup_field = 'uuid'
        exclude = ['id']


class EventSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    event_type = serializers.CharField(max_length=64)
    source_id = serializers.CharField(max_length=36, required=False)
    source_name = serializers.CharField(max_length=64, required=False)
    message = serializers.CharField(max_length=1024)
    created = serializers.DateTimeField(required=False)

    class Meta:
        model = Event


class MetricSerializer(serializers.ModelSerializer):
    timestamp = serializers.DateTimeField(read_only=True)
    name = serializers.CharField(read_only=True)
    metric_type = serializers.CharField(read_only=True)
    value = serializers.DecimalField(read_only=True)
    unit = serializers.CharField(read_only=True)
    node = serializers.CharField(read_only=True)

    class Meta:
        model = Metric
        exclude = ['id']


class ReportSerializer(serializers.ModelSerializer):
    timestamp = serializers.DateTimeField(read_only=True)
    name = serializers.CharField(read_only=True)
    value = serializers.CharField(read_only=True)
    node = serializers.CharField(read_only=True)

    class Meta:
        model = Report
        exclude = ['id']

    def transform_value(self, obj, field_value):
        import json
        if type(field_value) is list:
            new_val = []
            for item in field_value:
                try:
                    new_val.append(json.loads(item))
                except:
                    new_val.append(item)
            return new_val
        else:
            return field_value
