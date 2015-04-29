"""Api_perf tests."""
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
import arrow
from django.test import SimpleTestCase
from django.utils.unittest.case import skip
from elasticsearch_dsl import Search

from goldstone.api_perf.views import ApiPerfAggView
from goldstone.models import daily_index, es_conn
from .models import ApiPerfData


class ApiPerfTests(SimpleTestCase):

    def setUp(self):
        """Run before every test."""
        from django.contrib.auth import get_user_model
        from goldstone.test_utils import create_and_login

        # let's make sure we've configured a default connection
        self.conn = es_conn()

        get_user_model().objects.all().delete()
        self.token = create_and_login()

    @skip('needs rewrite after pandas extraction')
    def test_stats_search(self):

        range_begin = arrow.utcnow()

        stats = [ApiPerfData(response_status=status,
                             creation_time=arrow.utcnow().datetime,
                             component='test',
                             uri='/test',
                             response_length=999,
                             response_time=999)
                 for status in range(100, 601, 100)]

        for stat in stats:
            created = stat.save()
            self.assertTrue(created)

        # force flush
        # pylint: disable=W0212
        self.conn.indices.refresh(daily_index(ApiPerfData.INDEX_PREFIX))

        result = ApiPerfData._stats_search(range_begin,
                                           arrow.utcnow(),
                                           '1m',
                                           'test')
        self.assertIsInstance(result, Search)

    @skip('needs rewrite after pandas extraction')
    def test_get_stats(self):

        range_begin = arrow.utcnow()

        stats = [ApiPerfData(response_status=status,
                             creation_time=arrow.utcnow().datetime,
                             component='test',
                             uri='/test',
                             response_length=999,
                             response_time=999)
                 for status in range(100, 601, 100)]

        for stat in stats:
            created = stat.save()
            self.assertTrue(created)

        # force flush
        # pylint: disable=W0212
        self.conn.indices.refresh(daily_index(ApiPerfData.INDEX_PREFIX))

        result = ApiPerfData.get_stats(range_begin,
                                       arrow.utcnow(),
                                       '1m',
                                       'test')

        self.assertIsInstance(result, DataFrame)
        self.assertEqual(len(result), 1)
        self.assertEqual(result.iloc[0]['2xx'], 1)
        self.assertEqual(result.iloc[0]['3xx'], 1)
        self.assertEqual(result.iloc[0]['4xx'], 1)
        self.assertEqual(result.iloc[0]['5xx'], 1)

    @skip('needs rewrite after pandas extraction')
    def test_api_perf_view(self):
        from goldstone.test_utils import AUTHORIZATION_PAYLOAD

        start = arrow.utcnow().replace(minutes=-1)

        uri = '/api_perf/stats' + \
              '?start_time=' + str(start.timestamp) + \
              '&end_time=' + str(arrow.utcnow().timestamp) + \
              '&interval=3600s' + \
              '&component=test' + \
              '&uri=/test'

        response = self.client.get(
            uri,
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % self.token)

        self.assertEqual(response.status_code, 200)  # pylint: disable=E1101

    @skip('needs rewrite after pandas extraction')
    def test_api_perf_view_get_data(self):

        # setup
        start = arrow.utcnow().replace(minutes=-1)
        stats = [ApiPerfData(response_status=status,
                             creation_time=arrow.utcnow().datetime,
                             component='test',
                             uri='/test',
                             response_length=999,
                             response_time=999)
                 for status in range(100, 601, 100)]

        for stat in stats:
            self.assertTrue(stat.save())

        # pylint: disable=W0212
        self.conn.indices.refresh(daily_index(ApiPerfData.INDEX_PREFIX))

        perfview = ApiPerfAggView()

        context = {'start_dt': start.isoformat(),
                   'end_dt': arrow.utcnow().isoformat(),
                   'interval': '1s',
                   'component': 'test',
                   'uri': '/test'
                   }

        result = perfview._get_data(context)           # pylint: disable=W0212
        self.assertIsInstance(result, DataFrame)
        self.assertNotEqual(len(result), 0)
