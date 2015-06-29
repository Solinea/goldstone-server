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

        # These metadata fields will be added to the return value.
        METADATA = ["doc_type", "id", "index"]

        # When we look for a resource graph node's id, we look for these keys.
        # (Interface has port_id and net_id, but no id.)
        NODE_ID_KEYS = ["id", "port_id", "net_id"]

        # The "_name" and "_type" fields we'll add to the return value.
        INSTANCE_GRAPH_IDS = ["instance", "tenant", "user"]

        # The string used when a resource isn't found in the instance graph.
        NOT_FOUND = "Unknown"

        # Get the standard to_dict() result...
        result = super(EventSerializer, self).to_representation(instance)

        # Add non-None/blank metadata fields and values to it.
        for field in METADATA:
            if instance.meta.get(field):
                result[field] = instance.meta[field]

        # Add the resource type, and the resource name if we can find them. For
        # every root type...
        for id_root in INSTANCE_GRAPH_IDS:
            # Make the source _id key, and the destination _name and _type
            # keys. And initialize the destination keys to, "not found."
            source_key = id_root + "_id"
            resource_type = id_root + "_type"
            resource_name = id_root + "_name"
            result[resource_type] = NOT_FOUND
            result[resource_name] = NOT_FOUND

            # Some ids contain dashes while others do not. We're unsure when
            # the dashes are embedded or stripped, so we'll 'normalize' the ids
            # here by removing the dashes.
            target_value = instance.traits.get(source_key).replace('-', '')

            if target_value:
                # For every node in the resource graph...
                for node in resource.instances.graph.nodes():
                    # Look for an id match.
                    id_values = \
                        [node.attributes[x].replace('-', '')
                         for x in NODE_ID_KEYS if node.attributes.get(x)]

                    if target_value in id_values:
                        # We found this instance! Plug in the resource type and
                        # name, and return.
                        result[resource_type] = \
                            node.resourcetype.display_attributes()["name"]
                        result[resource_name] = node.attributes.get("name",
                                                                    NOT_FOUND)
                        break
                else:
                    # We didn't find this instance in the resource graph.
                    logger.warning("Didn't find %s[%s] in the resource graph",
                                   instance,
                                   source_key)
            else:
                # This instance doesn't have an instance_id.graph.
                logger.warning("Didn't find the %s key in %s",
                               source_key,
                               instance)

        return result


class EventAggSerializer(ReadOnlyElasticSerializer):
    """Custom serializer for the aggregation that's returned from
    Elasticsearch.

    Copied from LogEventAggSerializer, because LEAS is scheduled for deletion.

    """

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
