"""DRFES serialiers."""
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
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either expressed or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
from rest_framework.serializers import Serializer


class ReadOnlyElasticSerializer(Serializer):
    """Basic serializer for an ES object.

    Uses the to_dict() method and removed fields listed in the exclude Meta
    field.
    """

    class Meta:
        exclude = ()

    def create(self, validated_data):
        """Don't call create.  Here to satisfy abstract definition."""
        raise NotImplementedError('Not used.')

    def update(self, instance, validated_data):
        """Don't call update.  Here to satisfy abstract definition."""
        raise NotImplementedError('Not used.')

    def to_representation(self, instance):
        """Convert a record to a representation suitable for rendering.

        :type instance: Result
        :param instance: An instance from an ES search response
        :rtype: dict
        :return: the response minus exclusions as a dict
        """

        obj = instance.to_dict()

        for excl in self.Meta.exclude:
            try:
                del obj[excl]
            except KeyError:
                # dynamic docs may not have all fields.
                pass

        return obj


class SimpleAggSerializer(ReadOnlyElasticSerializer):
    """Custom serializer to manipulate the aggregation that comes back from ES.
    """

    AGG_NAME = None

    def to_representation(self, instance):
        """Create serialized representation of a single top-level aggregation.

        :param instance: the result from the Model.simple_agg call
        :return:
        """
        assert self.AGG_NAME is not None, (
            "'%s' should set the `AGG_NAME` attribute."
            % self.__class__.__name__
        )

        agg_base = getattr(instance, self.AGG_NAME, None)
        assert agg_base is not None, (
            "AGG_NAME must exist in the instance passed to %s."
            % self.__class__.__name__
        )

        data = [{bucket.key: bucket.doc_count} for bucket in agg_base.buckets]

        return {self.AGG_NAME: data}


class DateHistogramAggSerializer(ReadOnlyElasticSerializer):
    """Custom serializer to manipulate the aggregation that comes back from ES.
    """

    AGG_NAME = 'per_interval'

    def to_representation(self, instance):
        """Create serialized representation of a single top-level aggregation.

        :param instance: the result from the Model.simple_agg call
        :return:
        """
        assert self.AGG_NAME is not None, (
            "'%s' should set the `AGG_NAME` attribute."
            % self.__class__.__name__
        )

        agg_base = getattr(instance, self.AGG_NAME, None)
        assert agg_base is not None, (
            "AGG_NAME must exist in the instance passed to %s."
            % self.__class__.__name__
        )

        # let's clean up the inner buckets
        data = [{bucket.key: bucket.doc_count} for bucket in agg_base.buckets]

        return {self.AGG_NAME: data}
