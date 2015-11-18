"""Nova DRF serializers."""
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
from goldstone.drfes.serializers import ReadOnlyElasticSerializer


class SpawnsAggSerializer(ReadOnlyElasticSerializer):
    """A serializer to manipulate the aggregation that comes back from ES."""

    DATEHIST_AGG_NAME = 'per_interval'
    SUCCESS_AGG_NAME = 'success'

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
        data = [{bucket.key: {
            'count': bucket.doc_count,
            self.SUCCESS_AGG_NAME: self._process_success(
                bucket[self.SUCCESS_AGG_NAME])}} for bucket in
                datehist_agg_base.buckets]

        return {self.DATEHIST_AGG_NAME: data}

    @staticmethod
    def _process_success(agg):
        """Reformat the agg buckets."""

        return [{bucket['key']: bucket['doc_count']}
                for bucket in agg['buckets']]
