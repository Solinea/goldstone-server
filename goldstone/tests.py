"""Goldstone tests."""
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
from datetime import datetime, timedelta
from django.test import TestCase, SimpleTestCase
from django.conf import settings
from elasticsearch import ConnectionError, TransportError, Elasticsearch
import gzip
import os
import json
import logging

# This is needed here for mock to work.
from keystoneclient.v2_0.client import Client       # pylint: disable=W0611
from keystoneclient.exceptions import ClientException
from mock import patch, PropertyMock
from requests.models import Response

from goldstone.models import ESData, es_conn
from goldstone.apps.core.models import Node
from goldstone.apps.core.tasks import create_daily_index
from goldstone.utils import stored_api_call, get_keystone_client, \
    _construct_api_rec, GoldstoneAuthError

logger = logging.getLogger(__name__)


class PrimeData(TestCase):
    """This should run before all SimpleTestCase methods."""

    conn = Elasticsearch(settings.ES_SERVER)

    # Clean up existing indices.
    conn.indices.delete("_all")

    # load index templates before any indices are created
    for template_name, template_f in [
        ('logstash',
         gzip.open(os.path.join(os.path.dirname(__file__),
                                "apps", "..", "..", "test_data",
                                "logstash_template.json.gz"))),
        ('goldstone',
         gzip.open(os.path.join(os.path.dirname(__file__),
                                "apps", "..", "..", "test_data",
                                "goldstone_template.json.gz"))),
        ('goldstone_agent',
         gzip.open(os.path.join(os.path.dirname(__file__),
                                "apps", "..", "..", "test_data",
                                "agent_template.json.gz"))),
        ('goldstone_model',
         gzip.open(os.path.join(os.path.dirname(__file__),
                                "apps", "..", "..", "test_data",
                                "model_template.json.gz")))
    ]:
        template_body = json.load(template_f)
        conn.indices.put_template(template_name, template_body)

    # create daily indices for those who use them
    create_daily_index(basename='logstash')
    create_daily_index(basename='goldstone')
    conn.indices.create('goldstone_agent')
    conn.indices.create('goldstone_model')

    # Index the test data to the appropriate indices.
    # pylint: disable=W0212
    for index, data_f in [
        (ESData()._get_latest_index('logstash'),
         gzip.open(os.path.join(os.path.dirname(__file__),
                                "apps", "..", "..", "test_data",
                                "logstash_data.json.gz"))),
        (ESData()._get_latest_index('goldstone'),
         gzip.open(os.path.join(os.path.dirname(__file__),
                                "apps", "..", "..", "test_data",
                                "goldstone_data.json.gz"))),
        ('goldstone_agent',
         gzip.open(os.path.join(os.path.dirname(__file__),
                                "apps", "..", "..", "test_data",
                                "agent_data.json.gz"))),
        ('goldstone_model',
         gzip.open(os.path.join(os.path.dirname(__file__),
                                "apps", "..", "..", "test_data",
                                "model_data.json.gz")))
    ]:
        data = json.load(data_f)

        for dataset in data:
            for event in dataset['hits']['hits']:
                conn.index(index, event['_type'], event['_source'])

        conn.indices.refresh([index])


class ESConnectionTests(SimpleTestCase):
    """Test the ES connection.
    """

    @patch.object(Elasticsearch, '__init__')
    def test_connection(self, mock_es):

        mock_es.return_value = None

        es_conn()
        self.assertEqual(mock_es.call_count, 1)
        mock_es.assert_called_with(settings.ES_SERVER,
                                   sniff_on_start=False,
                                   max_retries=1)

        mock_es.reset_mock()

        es_conn(server=[{'host': 'abc'}])
        self.assertEqual(mock_es.call_count, 1)
        mock_es.assert_called_with([{'host': 'abc'}],
                                   sniff_on_start=False,
                                   max_retries=1)


class UtilsTests(SimpleTestCase):

    @patch('keystoneclient.v2_0.client.Client')
    def test_get_keystone_client(self, client):

        client.side_effect = ClientException
        self.assertRaises(ClientException,
                          get_keystone_client, user='abc')
        self.assertRaises(ClientException,
                          get_keystone_client, passwd='abc')
        self.assertRaises(ClientException,
                          get_keystone_client, tenant='no-tenant')
        self.assertRaises(ClientException,
                          get_keystone_client,
                          auth_url='http://www.solinea.com')

        client.side_effect = None
        client.auth_token = None
        type(client.return_value).auth_token = \
            PropertyMock(return_value=None)
        self.assertRaises(GoldstoneAuthError, get_keystone_client)

        type(client.return_value).auth_token = \
            PropertyMock(return_value='mocked_token')
        reply = get_keystone_client()
        self.assertIn('client', reply)
        self.assertIn('hex_token', reply)

    @patch('requests.get')
    @patch('keystoneclient.v2_0.client.Client')
    @patch('goldstone.utils.get_keystone_client')
    def test_stored_api_call(self, client, c, get):
        component = 'nova'
        endpoint = 'compute'
        bad_endpoint = 'xyz'
        path = '/os-hypervisors'
        bad_path = '/xyz'
        timeout = settings.API_PERF_QUERY_TIMEOUT

        # hairy.  need to mock the Client.service_catalog.get_endpoints() call
        # two ways.  1) raise an exception, 2) return a url
        fake_response = Response()
        fake_response.status_code = 200
        fake_response.url = "http://mock.url"
        fake_response._content = '{"a":1,"b":2}'       # pylint: disable=W0212
        fake_response.headers = {'content-length': 1024}
        fake_response.elapsed = timedelta(days=1)
        c.service_catalog.get_endpoints.side_effect = ClientException
        client.return_value = {'client': c, 'hex_token': 'mock_token'}
        self.assertRaises(LookupError, stored_api_call, component,
                          bad_endpoint, path, timeout=timeout)

        c.service_catalog.get_endpoints.side_effect = None
        c.service_catalog.get_endpoints.return_value = {
            endpoint: [{'publicURL': fake_response.url}]
        }
        fake_response.status_code = 404
        get.return_value = fake_response
        bad_path_call = stored_api_call(component, endpoint, bad_path,
                                        timeout=timeout)
        self.assertIn('reply', bad_path_call)
        self.assertIn('db_record', bad_path_call)
        self.assertEquals(bad_path_call['db_record']['response_status'], 404)

        fake_response.status_code = 200
        get.return_value = fake_response
        good_call = stored_api_call(component, endpoint, path, timeout=timeout)
        self.assertIn('reply', good_call)
        self.assertIn('db_record', good_call)
        self.assertEquals(good_call['db_record']['response_status'], 200)

    @patch('goldstone.tests.stored_api_call')
    def test_construct_api_rec(self, sac):

        component = 'abc'
        endpoint = 'compute'
        path = '/os-hypervisors'
        timeout = settings.API_PERF_QUERY_TIMEOUT
        now = datetime.utcnow()

        fake_response = Response()
        fake_response.status_code = 200
        fake_response.url = "http://mock.url"
        fake_response._content = '{"a":1,"b":2}'        # pylint: disable=W0212
        fake_response.headers = {'content-length': 1024}
        fake_response.elapsed = timedelta(days=1)
        sac.return_value = {'reply': fake_response}
        good_call = stored_api_call(component, endpoint, path, timeout=timeout)
        self.assertTrue(sac.called)
        self.assertIn('reply', good_call)

        reply = good_call['reply']
        rec = _construct_api_rec(reply, component, now, timeout, path)
        self.assertIn('response_time', rec)

        elapsed = reply.elapsed
        secs = elapsed.seconds + elapsed.days * 24 * 3600
        microsecs = float(elapsed.microseconds) / 10**6
        millisecs = int(round((secs + microsecs) * 1000))

        self.assertEqual(rec['response_time'], millisecs)
        self.assertIn('response_status', rec)
        self.assertEqual(rec['response_status'], reply.status_code)
        self.assertIn('response_length', rec)
        self.assertEqual(rec['response_length'],
                         int(reply.headers['content-length']))
        self.assertIn('component', rec)
        self.assertEqual(rec['component'], component)


class ReportTemplateViewTest(SimpleTestCase):
    node1 = Node(name="test_node_123")

    def setUp(self):
        Node.objects.all().delete()

    def tearDown(self):
        Node.objects.all().delete()

    def test_good_request(self):

        self.node1.save()
        url = '/report/node/' + self.node1.name

        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'node_report.html')

    def test_bad_get_request(self):
        url = '/report/node/missing_node'
        response = self.client.get(url)
        self.assertEqual(response.status_code, 404)

    def test_post_request(self):
        url = '/report/node/missing_node'
        response = self.client.post(url, data={})
        self.assertEqual(response.status_code, 405)

    def test_put_request(self):
        url = '/report/node/missing_node'
        response = self.client.put(url, data={})
        self.assertEqual(response.status_code, 405)

    def test_delete_request(self):
        url = '/report/node/missing_node'
        response = self.client.delete(url)
        self.assertEqual(response.status_code, 405)
