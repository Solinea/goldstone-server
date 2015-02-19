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
import calendar
import arrow
from datetime import timedelta
from django.test import SimpleTestCase
import logging
from mock import patch
from requests import Response
from goldstone.apps.api_perf.utils import time_api_call, \
    openstack_api_request_base, _construct_api_rec
from goldstone.models import ApiPerfData
from goldstone.utils import GoldstoneAuthError

logger = logging.getLogger(__name__)


class ViewTests(SimpleTestCase):

    def test_report_view(self):
        uri = '/api_perf/report'
        response = self.client.get(uri)
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'api_perf_report.html')


class UtilsTests(SimpleTestCase):

    @patch('goldstone.apps.api_perf.utils._construct_api_rec')
    @patch('requests.request')
    @patch.object(ApiPerfData, 'save')
    def test_time_api_call(self, m_save, m_request, m_construct_rec):
        fake_response = Response()
        fake_response.status_code = 200
        fake_response._content = '{"a":1,"b":2}'       # pylint: disable=W0212
        m_request.return_value = fake_response
        m_save.return_value = True
        m_construct_rec.return_value = {}
        result = time_api_call('test', 'get', 'http://test')
        self.assertTrue(m_request.called)
        self.assertTrue(m_save.called)
        self.assertTrue(m_construct_rec.called)

        # we should get a dict with created and response
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

        result = openstack_api_request_base("endpoint", "/path")
        self.assertIn('url', result)
        self.assertIn('x-auth-token', result['headers'])
        self.assertIn('content-type', result['headers'])
        self.assertEquals(result['headers']['x-auth-token'], 'token')
        self.assertEquals(result['url'], "http://endpoint/path")


    @patch('goldstone.utils.get_keystone_client')
    def test_openstack_api_request_base_exceptions(self, m_get):

        m_get.side_effect = GoldstoneAuthError
        self.assertRaises(GoldstoneAuthError, openstack_api_request_base,
                          "", "", "")

        m_get.side_effect = Exception
        self.assertRaises(LookupError, openstack_api_request_base,
                          "", "", "")

    def test_construct_api_rec_none(self):

        now = arrow.utcnow()
        rec = _construct_api_rec(None, "test", now, 1, "http://endpoint/path")
        self.assertIsInstance(rec, dict)
        self.assertEqual(rec['component'], 'test')
        self.assertEqual(rec['uri'], '/path')
        self.assertEqual(rec['created'], now)
        self.assertEqual(rec['response_time'], 1000)
        self.assertEqual(rec['response_status'], 504)
        self.assertEqual(rec['response_length'], 0)


    def test_construct_api_rec_some(self):

        now = arrow.utcnow()
        reply = Response()
        reply.status_code = 200
        reply.url = "http://endpoint/path"
        reply.headers = {'content-length': 1024}
        reply.elapsed = timedelta(seconds=2)

        rec = _construct_api_rec(reply, "test", now, 2, "http://endpoint/path")
        self.assertIsInstance(rec, dict)
        self.assertEqual(rec['component'], 'test')
        self.assertEqual(rec['uri'], '/path')
        self.assertEqual(rec['created'], now)
        self.assertEqual(rec['response_time'], 2000)
        self.assertEqual(rec['response_status'], 200)
        self.assertEqual(rec['response_length'], 1024)
