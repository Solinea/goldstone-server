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
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
import logging
from elasticsearch_dsl.result import Response
from rest_framework.serializers import Serializer

logger = logging.getLogger(__name__)


class ElasticResponseSerializer(Serializer):
    """Serializes an ElasticSearch response, to a dict of result and
    aggregation data"""

    def to_representation(self, instance):
        """Return a record in a form that is suitable for rendering.

        :param instance: An instance from an ES search response
        :type instance: Result
        :return: the response minus exclusions as a dict
        :rtype: dict

        """

        assert(isinstance(instance, Response))
        rv = {
            'results': instance.hits.hits
        }
        if hasattr(instance, 'aggregations'):
            rv['aggregations'] = instance.aggregations.to_dict()

        return rv


class ReadOnlyElasticSerializer(Serializer):
    """Basic serializer for an ES object.

    Uses the to_dict() method and removed fields listed in the exclude Meta
    field.

    """

    class Meta:                  # pylint: disable=C0111,C1001,W0232
        exclude = ()

    def create(self, validated_data):
        """Don't call create."""

        raise NotImplementedError('Not used.')

    def update(self, instance, validated_data):
        """Don't call update."""

        raise NotImplementedError('Not used.')

    def to_representation(self, instance):
        """Return a record in a form that is suitable for rendering.

        :param instance: An instance from an ES search response
        :type instance: Result
        :return: the response minus exclusions as a dict
        :rtype: dict

        """

        obj = instance.to_dict()

        for excl in self.Meta.exclude:
            try:
                del obj[excl]
            except KeyError:
                # dynamic docs may not have all fields.
                pass

        return obj


class SimpleAggSerializer(ReadOnlyElasticSerializer):  # pylint: disable=W0223
    """A serializer to manipulate the aggregation that comes back from ES."""

    AGG_NAME = None

    def to_representation(self, instance):
        """Create serialized representation of a single top-level aggregation.

        :param instance: the result from the Model.simple_agg call

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
    """A serializer to manipulate the aggregation that comes back from ES."""
    # pylint: disable=W0223

    AGG_NAME = 'per_interval'

    def to_representation(self, instance):
        """Create serialized representation of a single top-level aggregation.

        :param instance: the result from the Model.simple_agg call

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
