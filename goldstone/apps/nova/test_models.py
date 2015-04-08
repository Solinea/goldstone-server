"""Nova models for testing."""
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
import arrow
from copy import deepcopy

from django.test import SimpleTestCase
from goldstone.apps.nova.models import SpawnsData


class SpawnsDataModelTests(SimpleTestCase):
    """Test cases for nova spawns model."""
    start = arrow.get(0)
    end = arrow.utcnow()
    interval = '1h'

    QUERY_BASE = {'bool': {
        'must': [{'range': {
            '@timestamp': {'gte': start.isoformat(),
                           'lte': end.isoformat()}}}]}}

    DATEHIST_AGG = {'date_histogram': {'field': '@timestamp',
                                       'interval': '1h',
                                       'min_doc_count': 0,
                                       'extended_bounds': {
                                           'max': end.isoformat(),
                                           'min': start.isoformat()}}}

    TIMESTAMP_SORT = [{'@timestamp': {'order': 'desc'}}]

    def test_datehist_agg(self):
        """_datehist_agg should return an A with proper values."""

        result = SpawnsData._datehist_agg( self.interval, self.start, self.end)
        self.assertDictEqual(result.to_dict(), self.DATEHIST_AGG)

    def test_spawn_finish_query(self):
        """_spawn_finish_query should return a Search with proper values."""

        expected_aggs = {'per_interval': self.DATEHIST_AGG}
        expected_aggs['per_interval']['aggs'] = {
            'per_success': {
                'terms': {'size': 0, 'field': 'success', 'min_doc_count': 0}}
        }

        expected_query = deepcopy(self.QUERY_BASE)
        expected_query['bool']['must'].append({'term': {'event': 'finish'}})

        result = SpawnsData._spawn_finish_query(self.start, self.end,
                                                self.interval)

        self.assertDictEqual(result.to_dict()['aggs'], expected_aggs)
        self.assertDictEqual(result.to_dict()['query'], expected_query)
        self.assertListEqual(result.to_dict()['sort'], self.TIMESTAMP_SORT)
