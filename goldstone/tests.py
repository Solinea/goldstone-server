# Copyright 2014 Solinea, Inc.
#
# Licensed under the Solinea Software License Agreement (goldstone),
# Version 1.0 (the "License"); you may not use this file except in compliance
# with the License. You may obtain a copy of the License at:
#
#     http://www.solinea.com/goldstone/LICENSE.pdf
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
from goldstone.apps.core.models import NodeType, Node

__author__ = 'John Stanford'

from keystoneclient.exceptions import ClientException
from django.test import TestCase, SimpleTestCase
from django.conf import settings
from goldstone.models import GSConnection, ESData
from goldstone.apps.core.tasks import _create_daily_index
from goldstone.apps.keystone.tasks import discover_keystone_topology
from elasticsearch import *
import gzip
import os
import json
from goldstone.utils import stored_api_call, _get_keystone_client, \
    _construct_api_rec, GoldstoneAuthError
import logging
from datetime import datetime, timedelta
from mock import patch, PropertyMock, MagicMock, Mock
from requests.models import Response
from keystoneclient.v2_0.client import Client

logger = logging.getLogger(__name__)


class PrimeData(TestCase):
    # this should run before all SimpleTestCase methods.
    conn = Elasticsearch(settings.ES_SERVER)

    # clean up existing indices
    try:
        conn.indices.delete("_all")
    finally:
        {}

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
    _create_daily_index(basename='logstash')
    _create_daily_index(basename='goldstone')
    conn.indices.create('goldstone_agent')
    conn.indices.create('goldstone_model')

    # index the test data to the appropriate indices
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
                rv = conn.index(index, event['_type'], event['_source'])

        conn.indices.refresh([index])


class GSConnectionModel(SimpleTestCase):

    def test_connection(self):
        conn1 = GSConnection().conn
        conn2 = GSConnection(settings.ES_SERVER).conn
        q = {"query": {"match_all": {}}}
        r1 = conn1.search(body=q)
        self.assertIsNotNone(r1)
        r2 = conn2.search(body=q)
        self.assertIsNotNone(r2)


class UtilsTests(SimpleTestCase):

    @patch('keystoneclient.v2_0.client.Client')
    def test_get_keystone_client(self, kc):
        kc.side_effect = ClientException
        self.assertRaises(ClientException,
                          _get_keystone_client, user='abc')
        self.assertRaises(ClientException,
                          _get_keystone_client, passwd='abc')
        self.assertRaises(ClientException,
                          _get_keystone_client, tenant='no-tenant')
        self.assertRaises(ClientException,
                          _get_keystone_client,
                          auth_url='http://www.solinea.com')
        kc.side_effect = None
        kc.auth_token = None
        type(kc.return_value).auth_token = \
            PropertyMock(return_value=None)
        self.assertRaises(GoldstoneAuthError,
                          _get_keystone_client)
        type(kc.return_value).auth_token = \
            PropertyMock(return_value='mocked_token')
        reply = _get_keystone_client()
        self.assertIn('client', reply)
        self.assertIn('hex_token', reply)

    @patch('requests.get')
    @patch('keystoneclient.v2_0.client.Client')
    @patch('goldstone.utils._get_keystone_client')
    def test_stored_api_call(self, kc, c, get):
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
        fake_response._content = '{"a":1,"b":2}'
        fake_response.headers = {'content-length': 1024}
        fake_response.elapsed = timedelta(days=1)
        c.service_catalog.get_endpoints.side_effect = ClientException
        kc.return_value = {'client': c,
                           'hex_token': 'mock_token'}
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
        ts = datetime.utcnow()
        fake_response = Response()
        fake_response.status_code = 200
        fake_response.url = "http://mock.url"
        fake_response._content = '{"a":1,"b":2}'
        fake_response.headers = {'content-length': 1024}
        fake_response.elapsed = timedelta(days=1)
        sac.return_value = {
            'reply': fake_response
        }
        good_call = stored_api_call(component, endpoint, path, timeout=timeout)
        self.assertTrue(sac.called)
        self.assertIn('reply', good_call)
        reply = good_call['reply']

        rec = _construct_api_rec(reply, component, ts, timeout, path)
        self.assertIn('response_time', rec)
        td = reply.elapsed
        secs = td.seconds + td.days * 24 * 3600
        microsecs = float(td.microseconds) / 10**6
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
        es = Elasticsearch(settings.ES_SERVER)
        if es.indices.exists('goldstone_model'):
            es.indices.delete('goldstone_model')
        es.indices.create('goldstone_model')

    def tearDown(self):
        es = Elasticsearch(settings.ES_SERVER)
        if es.indices.exists('goldstone_model'):
            es.indices.delete('goldstone_model')
        es.indices.create('goldstone_model')

    def test_good_request(self):
        self.node1.save()
        NodeType.refresh_index()
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
