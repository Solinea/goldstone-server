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

    class Meta:          # pylint: disable=C0111,W0232,C1001
        exclude = ('@version', 'sort', 'tags', 'type')


class MetricAggSerializer(ReadOnlyElasticSerializer):
    """Serializer for agent metrics."""

    DATEHIST_AGG_NAME = 'per_interval'
    UNIT_AGG_NAME = 'units'
    STATS_AGG_NAME = 'stats'

    class Meta:          # pylint: disable=C0111,W0232,C1001
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

    class Meta:          # pylint: disable=C0111,W0232,C1001
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


class PassthruSerializer(serializers.Serializer):
    """A serializer for DRF views where no work is needed."""

    def to_representation(self, instance):
        """Return an already-serialized object."""

        return instance


class EventSerializer(ReadOnlyElasticSerializer):
    """Serializer for event data that's stored in ElasticSearch."""

    class Meta:        # pylint: disable=C1001,W0232
        """Exclude several uninteresting fields."""

        exclude = ('@version', 'message', 'syslog_ts', 'received_at', 'sort',
                   'tags', 'syslog_facility_code', 'syslog_severity_code',
                   'syslog_pri', 'syslog5424_pri', 'syslog5424_host')

    def to_representation(self, instance):
        """Return instance's values suitable for rendering.

        The returned value includes fields that are in the instance's metadata.

        The instance.to_dict() return value doesn't include instance metadata.
        We could subclass the to_dict() method in the EventData() class, which
        would require that we track updates to the elasticsearch_dsl.utils
        module where it's defined. Or, we could override to_representation()
        and add the metadata to the return result. We chose the latter.

        :type instance: Result
        :param instance: One instance from an Elasticsearch search response
        :rtype: dict
        :return: The response minus exclusions, plus some metadata values

        """

        # These metadata fields will be added to the return value.
        METADATA = ["doc_type", "id", "index"]

        # Get the standard to_dict() result...
        result = super(EventSerializer, self).to_representation(instance)

        # ...now add non-None/bank metadata fields and values to it.
        for field in METADATA:
            if instance.meta.get(field):
                result[field] = instance.meta[field]

        return result
