"""Core serializers."""
# Copyright 2015 Solinea, Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
from rest_framework import serializers
from goldstone.drfes.serializers import ReadOnlyElasticSerializer, \
    SimpleAggSerializer
from .models import PolyResource


class MetricDataSerializer(ReadOnlyElasticSerializer):
    """Serializer for agent metrics."""

    class Meta:
        exclude = ('@version', 'sort', 'tags', 'type')


class MetricAggSerializer(ReadOnlyElasticSerializer):
    """Serializer for agent metrics."""

    DATEHIST_AGG_NAME = 'per_interval'
    UNIT_AGG_NAME = 'units'
    STATS_AGG_NAME = 'stats'

    class Meta:
        exclude = ('@version', 'sort', 'tags', 'type')

    def to_representation(self, instance):
        """Create serialized representation of a single top-level aggregation.

        :param instance: the result from the Model.simple_agg call
        :return:
        """

        datehist_agg_base = getattr(instance, self.DATEHIST_AGG_NAME, None)
        assert datehist_agg_base is not None, (
            "DATEHIST_AGG_NAME must exist in the instance passed to %s."
            % self.__class__.__name__
        )

        unit_agg_base = getattr(instance, self.UNIT_AGG_NAME, None)
        assert unit_agg_base is not None, (
            "UNIT_AGG_NAME must exist in the instance passed to %s."
            % self.__class__.__name__
        )

        unit_data = [bucket.key for bucket in unit_agg_base.buckets]
        # let's clean up the inner buckets
        datehist_data = [{bucket.key: {
            'count': bucket.doc_count,
            self.STATS_AGG_NAME: bucket[self.STATS_AGG_NAME]}}
            for bucket in datehist_agg_base.buckets]

        return {self.UNIT_AGG_NAME: unit_data,
                self.DATEHIST_AGG_NAME: datehist_data}


class ReportDataSerializer(ReadOnlyElasticSerializer):
    """Serializer for agent metrics."""

    class Meta:
        exclude = ('@version', 'sort', 'tags', 'type')


class MetricNamesAggSerializer(SimpleAggSerializer):

    AGG_NAME = 'per_name'


class ReportNamesAggSerializer(SimpleAggSerializer):

    AGG_NAME = 'per_name'


class PolyResourceSerializer(serializers.ModelSerializer):
    """The PolyResource class serializer."""

    class Meta:             # pylint: disable=C1001,C0111,W0232
        model = PolyResource
        lookup_field = 'uuid'
        exclude = ['polymorphic_ctype']


class NavTreeSerializer(serializers.BaseSerializer):
    """The NavTree class serializer."""

    def to_representation(self, obj):
        return obj
