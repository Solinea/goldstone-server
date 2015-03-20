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
from goldstone.apps.drfes.serializers import ReadOnlyElasticSerializer, \
    SimpleAggSerializer
from .models import PolyResource
import logging

logger = logging.getLogger(__name__)


class MetricDataSerializer(ReadOnlyElasticSerializer):
    """Serializer for agent metrics."""

    class Meta:
        exclude = ('@version','sort', 'tags', 'type')


class ReportDataSerializer(ReadOnlyElasticSerializer):
    """Serializer for agent metrics."""

    class Meta:
        exclude = ('@version','sort', 'tags', 'type')


class MetricNamesAggSerializer(SimpleAggSerializer):

    AGG_NAME = 'per_name'


class ReportNamesAggSerializer(SimpleAggSerializer):

    AGG_NAME = 'per_name'


#
# This is the beginning of the new polymorphic resource model support
#
class PolyResourceSerializer(serializers.ModelSerializer):

    class Meta:
        model = PolyResource
        lookup_field = 'id'
        exclude = ['polymorphic_ctype']
