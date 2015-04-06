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
import pandas

from django.test import SimpleTestCase
from goldstone.apps.nova.models import HypervisorStatsData, SpawnData, \
    ResourceData
from goldstone.models import ESData


class HypervisorStatsDataModel(SimpleTestCase):

    start = arrow.get(2014, 3, 12).datetime
    end = arrow.utcnow().datetime
    hsd = HypervisorStatsData()
    id_to_delete = None

    def setUp(self):
        """Done before every test."""

        rec = {"@timestamp": self.end.isoformat()}
        self.id_to_delete = self.hsd.post(rec)
        self.assertIsNotNone(self.id_to_delete)

    def tearDown(self):
        """Done after every test."""

        response = self.hsd.delete(self.id_to_delete)
        self.assertTrue(response)

    def test_get(self):
        recs = self.hsd.get(1)
        self.assertEqual(len(recs), 1)

    def test_get_range(self):
        recs = self.hsd.get_date_range(self.start, self.end)
        self.assertGreater(len(recs), 0)


class SpawnDataModel(SimpleTestCase):

    start = arrow.get(2014, 3, 12).datetime
    end = arrow.utcnow().datetime
    interval = '1h'
    spawn_data = SpawnData(start, end, interval)

    # pylint: disable=W0212

    def test_spawn_start_query(self):

        query = self.spawn_data._spawn_start_query()
        self.assertEqual(query['aggs'], ESData._agg_date_hist(self.interval))

    def test_spawn_finish_query(self):

        query = self.spawn_data._spawn_finish_query(True)

        self.assertDictEqual(
            query['aggs']['success_filter']['aggs'],
            ESData._agg_date_hist(self.interval))

        self.assertDictEqual(
            query['aggs']['success_filter']['filter'],
            ESData._agg_filter_term(
                "success", "true",
                "success_filter")['success_filter']['filter'])

        query = self.spawn_data._spawn_finish_query(False)
        self.assertDictEqual(
            query['aggs']['success_filter']['filter'],
            ESData._agg_filter_term(
                "success", "false",
                "success_filter")['success_filter']['filter'])


class ResourceDataTest(SimpleTestCase):

    start = arrow.get(2014, 3, 12).datetime
    end = arrow.utcnow().datetime
    interval = '3600s'

    def _test_claims(self, test_params, rd):
        """Evaluate the results."""

        for params in test_params:
            result = getattr(rd, params['function'])()
            self.assertIsInstance(result, pandas.core.frame.DataFrame)

    def test_virt_resource_data(self):
        vrd = ResourceData(self.start, self.end, self.interval)

        test_params = [
            {'type': 'nova_claims_summary_virt', 'resource': 'cpus',
             'function': 'get_virt_cpu'},
            {'type': 'nova_claims_summary_virt', 'resource': 'memory',
             'function': 'get_virt_mem'},
        ]

        self._test_claims(test_params, vrd)

    def test_phys_resource_data(self):
        prd = ResourceData(self.start, self.end, self.interval)

        test_params = [
            {'type': 'nova_claims_summary_phys', 'resource': 'cpus',
             'function': 'get_phys_cpu'},
            {'type': 'nova_claims_summary_phys', 'resource': 'memory',
             'function': 'get_phys_mem'},
            {'type': 'nova_claims_summary_phys', 'resource': 'disk',
             'function': 'get_phys_disk'},
        ]

        self._test_claims(test_params, prd)
