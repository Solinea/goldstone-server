"""Api_perf tests."""
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
from django.test import SimpleTestCase
from elasticsearch_dsl import Search, Q
from mock import patch
from pandas import DataFrame
from requests import Response
from uuid import uuid1

from goldstone.apps.api_perf.utils import time_api_call, stack_api_request_base
from goldstone.apps.api_perf.views import ApiPerfView
from goldstone.models import daily_index, es_conn
from goldstone.utils import GoldstoneAuthError
from .models import ApiPerfData


class ViewTests(SimpleTestCase):

    def test_report_view(self):

        uri = '/api_perf/report'
        response = self.client.get(uri)
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'api_perf_report.html')


class UtilsTests(SimpleTestCase):

    @patch('requests.request')
    @patch.object(ApiPerfData, 'save')
    def test_time_api_call_succeed(self, m_save, m_request):

        fake_response = Response()
        fake_response.status_code = 200
        fake_response._content = '{"a":1,"b":2}'       # pylint: disable=W0212
        m_request.return_value = fake_response
        result = time_api_call('test', 'GET', 'http://test')
        self.assertTrue(m_request.called)
        self.assertFalse(m_save.called)

        # we should get a None
        self.assertEqual(result, None)

    @patch('requests.request')
    @patch.object(ApiPerfData, 'save')
    def test_time_api_call_fail(self, m_save, m_request):

        m_request.return_value = None
        m_save.return_value = True
        result = time_api_call('test', 'GET', 'http://test')
        self.assertEqual(result,
                         {'created': m_save.return_value,
                          'response': m_request.return_value})

    @patch('keystoneclient.v2_0.client.Client')
    @patch('goldstone.utils.get_keystone_client')
    def test_openstack_api_request_base_success(self, m_get, m_client):

        m_client.service_catalog.get_endpoints.return_value = {
            'endpoint': [{'publicURL': "http://endpoint"}]
        }
        m_client.hex_token = 'token'
        m_get.return_value = {'client': m_client, 'hex_token': 'token'}

        # {'url': 'http://endpoint/path',
        #  'headers': {'content-type': 'application/json',
        #              'x-auth-token': 'token'}
        # }

        result = stack_api_request_base("endpoint", "/path")
        self.assertIn('url', result)
        self.assertIn('x-auth-token', result['headers'])
        self.assertIn('content-type', result['headers'])
        self.assertEquals(result['headers']['x-auth-token'], 'token')
        self.assertEquals(result['url'], "http://endpoint/path")

    @patch('goldstone.utils.get_keystone_client')
    def test_openstack_api_request_base_exceptions(self, m_get):

        m_get.side_effect = GoldstoneAuthError
        self.assertRaises(GoldstoneAuthError, stack_api_request_base,
                          "", "", "")

        m_get.side_effect = Exception
        self.assertRaises(LookupError, stack_api_request_base,
                          "", "", "")


class ApiPerfTests(SimpleTestCase):

    def setUp(self):
        """Run before every test."""
        from django.contrib.auth import get_user_model
        from goldstone.test_utils import create_and_login

        # let's make sure we've configured a default connection
        self.conn = es_conn()

        get_user_model().objects.all().delete()
        self.token = create_and_login()

    def tearDown(self):

        result = ApiPerfData.search().execute()

        for hit in result.hits:
            hit.delete()

        self.conn.indices.refresh(daily_index(ApiPerfData._INDEX_PREFIX))

    def test_persist_and_retrieve(self):

        uuid = uuid1()
        now = arrow.utcnow().datetime
        data = ApiPerfData(id=uuid,
                           response_status=1000,
                           creation_time=now,
                           component='test',
                           uri='/test',
                           response_length=999,
                           response_time=999)

        created = data.save()
        self.assertTrue(created)

        # the Date field loses timezone info on retrieval.  We can fork and
        # fix if it's still a problem when we ship.
        # filed https://github.com/elasticsearch/elasticsearch-dsl-py/issues/77
        # TODO ensure that tz support is in place before 3.0
        persisted = ApiPerfData.get(id=uuid)

        self.assertEqual(data.response_status, persisted.response_status)
        self.assertEqual(data.component, persisted.component)
        self.assertEqual(data.uri, persisted.uri)
        self.assertEqual(data.response_length, persisted.response_length)
        self.assertEqual(data.response_time, persisted.response_time)

        # TODO uncomment when bug fixed in es-dsl
        self.assertEqual(data.creation_time, persisted.creation_time)

        data2 = ApiPerfData(response_status=1000,
                            creation_time=now,
                            component='test',
                            uri='/test',
                            response_length=999,
                            response_time=999)

        created = data2.save()
        self.assertTrue(created)

        # force flush
        self.conn.indices.refresh(daily_index(ApiPerfData._INDEX_PREFIX))

        # test a search with no hits
        search = ApiPerfData.search()
        search = search.query(
            Q('match', response_status=1001))

        response = search.execute()
        self.assertEqual(len(response.hits), 0)

        # test a search with hits
        search = ApiPerfData.search()
        search = search.query(
            Q('match', response_status=1000) +
            Q('match', component='test') +
            Q('match', uri='/test') +
            Q('match', response_length=999) +
            Q('match', response_time=999))

        response = search.execute()
        self.assertEqual(len(response.hits), 2)

        # test delete
        for hit in response.hits:
            hit.delete()

        # force flush
        self.conn.indices.refresh(daily_index(ApiPerfData._INDEX_PREFIX))

        search = ApiPerfData.search()
        response = search.execute()
        self.assertEqual(len(response.hits), 0)

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
        self.conn.indices.refresh(daily_index(ApiPerfData._INDEX_PREFIX))

        result = ApiPerfData._stats_search(range_begin,
                                           arrow.utcnow(),
                                           '1m',
                                           'test')
        self.assertIsInstance(result, Search)

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
        self.conn.indices.refresh(daily_index(ApiPerfData._INDEX_PREFIX))

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
        self.assertEqual(response.status_code, 200)

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

        self.conn.indices.refresh(daily_index(ApiPerfData._INDEX_PREFIX))

        perfview = ApiPerfView()

        context = {'start_dt': start.isoformat(),
                   'end_dt': arrow.utcnow().isoformat(),
                   'interval': '1s',
                   'component': 'test',
                   'uri': '/test'
                   }

        result = perfview._get_data(context)           # pylint: disable=W0212
        self.assertIsInstance(result, DataFrame)
        self.assertNotEqual(len(result), 0)


class ViewTests(SimpleTestCase):

    def test_log_data_view(self):

        uri = '/core/logs'
        response = self.client.get(uri)
        self.assertEqual(response.status_code, 200)
