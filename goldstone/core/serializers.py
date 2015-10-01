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
import logging
from rest_framework import serializers
from goldstone.drfes.serializers import ReadOnlyElasticSerializer, \
    SimpleAggSerializer
from .models import PolyResource

logger = logging.getLogger(__name__)

# pylint: disable=W0223

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


class NamesAggSerializer(SimpleAggSerializer):
    """Serializer for reporting name aggregations."""

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
    """Serializer for event data, for the "search" URL.

    This is subclassed by ApiPerfSerializer.

    """

    # These metadata fields will be added to the return value.
    METADATA = ["doc_type", "id", "index"]

    # When we look for a resource graph node's id, we look for these keys.
    # (Interface has port_id and net_id, but no id.)
    NODE_ID_KEYS = ["id", "port_id", "net_id"]

    # We add these "_name" and "_type" fields to the return value.
    # N.B. Tenant is the old name for project, but is being used for now.
    INSTANCE_GRAPH_IDS = ["instance", "tenant", "user"]

    def to_representation(self, instance):
        """Return instance's values suitable for rendering.

        Two additions are made to the normal instance values.

        1) The returned value includes fields from the instance's metadata.

           The instance.to_dict() return value doesn't include instance
           metadata. We could subclass the to_dict() method in the EventData()
           class, which would require that we track updates to the
           elasticsearch_dsl.utils module where it's defined. Or, we could
           override to_representation() and add the metadata to the return
           result. We chose the latter.

        2) Adds "_name" and "_type" key:value pairs for "instance", "user", and
           "tenant". The values come from the resource types and instances
           graphs.

        :type instance: Result
        :param instance: One instance from an Elasticsearch search response
        :rtype: dict
        :return: The response minus exclusions, plus some additional values

        """
        from goldstone.core import resource

        # The string used when a resource isn't found in the instance graph.
        NOT_FOUND = "Unknown"

        # Get the standard to_dict() result...
        result = super(EventSerializer, self).to_representation(instance)

        # Add non-None/blank metadata fields and values to it.
        for field in self.METADATA:
            if instance.meta.get(field):
                result[field] = instance.meta[field]

        # If the instance has a "traits" dict... (Aka, if it's an event...)
        if "traits" in instance:
            # Add the resource type, and the resource name if we can find them.
            # For every root type...
            for id_root in self.INSTANCE_GRAPH_IDS:
                # Make the source _id key, and the destination _name and _type
                # keys. And initialize the destination keys to, "not found."
                source_key = id_root + "_id"
                resource_type = id_root + "_type"
                resource_name = id_root + "_name"
                result[resource_type] = NOT_FOUND
                result[resource_name] = NOT_FOUND

                target_value = instance.traits.get(source_key)

                # If the target value is a non-empty string...
                if isinstance(target_value, basestring) and target_value != '':
                    # Some ids contain dashes while others do not. We're unsure
                    # when and where the dashes are embedded or stripped, so
                    # we'll 'normalize' the ids here by removing the dashes.
                    target_value = target_value.replace('-', '')

                    # For every node in the resource graph...
                    for node in resource.instances.graph.nodes():
                        # Look for a match against values in id-like fields. We
                        # filter out non-stering id-values because those will
                        # be add-ons. (Add-on ids (i.e., pks) are integers.)
                        id_values = \
                            [node.attributes[x].replace('-', '')
                             for x in self.NODE_ID_KEYS
                             if isinstance(node.attributes.get(x), basestring)]

                        if target_value in id_values:
                            # We found this instance! Plug in the resource type
                            # and name, and return.
                            result[resource_type] = \
                                node.resourcetype.display_attributes()["name"]
                            result[resource_name] = \
                                node.attributes.get("name", NOT_FOUND)
                            break
                    else:
                        # We didn't find this instance in the resource graph.
                        logger.warning("%s[%s] isn't in the resource graph",
                                       instance,
                                       source_key)

        return result


class ApiPerfSerializer(EventSerializer):
    """Serializer for API performance data, for the "search" URL."""

    # These metadata fields will be added to the return value.
    METADATA = ["doc_type", "id"]

    class Meta:                  # pylint: disable=C0111,C1001,W0232
        # Don't return these keys.
        exclude = ("creation_time", "received_at", "method",
                   "@version", "protocol")


class EventSummarizeSerializer(ReadOnlyElasticSerializer):
    """Serializer for event aggregation data, for the "summarize" URL."""

    def to_representation(self, instance):
        """Create serialized representation of aggregate log data.

        There will be a summary block that can be used for ranging, legends,
        etc., then the detailed aggregation data which will be a nested
        structure.  The number of layers will depend on whether the host
        aggregation was done.

        """

        timestamps = [i['key'] for i in instance.per_interval['buckets']]

        event_types = [i['key'] for i in instance.per_type['buckets']] \
            if hasattr(instance, 'per_type') else None

        # let's clean up the inner buckets
        data = []

        # If the caller wants event type detail, compile it. Otherwise, just
        # give a total count per timestamp.
        for interval_bucket in instance.per_interval.buckets:
            key = interval_bucket.key
            if event_types:
                value = [{item.key: item.doc_count}
                         for item in interval_bucket.per_type.buckets]
            else:
                value = sum(item.doc_count
                            for item in instance.per_interval.buckets)
            data.append({key: value})

        # We return event types iff the caller asked for them.
        results = {'timestamps': timestamps, 'data': data}

        if event_types:
            results['types'] = event_types

        return results


class ApiPerfSummarizeSerializer(ReadOnlyElasticSerializer):
    """Serializer for API performance aggregation data, for the "summarize"
    URL."""

    DATEHIST_AGG_NAME = 'per_interval'
    STATS_AGG_NAME = 'stats'
    RANGE_AGG_NAME = 'response_status'

    def to_representation(self, instance):
        """Create serialized representation of a single top-level aggregation.

        :param instance: the result from the Model.simple_agg call

        """

        datehist_agg_base = getattr(instance, self.DATEHIST_AGG_NAME, None)

        assert datehist_agg_base is not None, (
            "DATEHIST_AGG_NAME must exist in the instance passed to %s."
            % self.__class__.__name__
        )

        # let's clean up the inner buckets
        data = [{bucket.key: {'count': bucket.doc_count,
                              self.RANGE_AGG_NAME:
                              self._process_range(bucket[self.RANGE_AGG_NAME]),
                              self.STATS_AGG_NAME:
                              bucket[self.STATS_AGG_NAME]}}
                for bucket in datehist_agg_base.buckets]

        return {self.DATEHIST_AGG_NAME: data}

    @staticmethod
    def _process_range(process_range):
        """Reformat the range buckets."""

        return [{key: value['doc_count']}
                for key, value in process_range['buckets'].items()]
