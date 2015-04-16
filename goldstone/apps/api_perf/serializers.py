# Copyright 2015 Solinea, Inc.
#
# Licensed under the Solinea Software License Agreement (goldstone),
# Version 1.0 (the "License"); you may not use this file except in compliance
# with the License. You may obtain a copy of the License at:
#
# http://www.solinea.com/goldstone/LICENSE.pdf
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either expressed or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
from goldstone.apps.drfes.serializers import ReadOnlyElasticSerializer


class ApiPerfAggSerializer(ReadOnlyElasticSerializer):
    """Custom serializer to manipulate the aggregation that comes back from ES.
    """

    DATEHIST_AGG_NAME = 'per_interval'
    STATS_AGG_NAME = 'stats'
    RANGE_AGG_NAME = 'response_status'

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
        # let's clean up the inner buckets
        data = [{bucket.key: {
            'count': bucket.doc_count,
            self.RANGE_AGG_NAME: self._process_range(
                bucket[self.RANGE_AGG_NAME]),
            self.STATS_AGG_NAME: bucket[self.STATS_AGG_NAME]}}
            for bucket in datehist_agg_base.buckets]

        return {self.DATEHIST_AGG_NAME: data}

    @staticmethod
    def _process_range(range):
        """Reformat the range buckets."""
        return [{key: value['doc_count']}
                for key, value in range['buckets'].items()]
