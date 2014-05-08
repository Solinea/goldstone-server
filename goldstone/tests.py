# Copyright 2014 Solinea, Inc.
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
from goldstone.apps.core.tasks import create_daily_index
from goldstone.apps.keystone.tasks import discover_keystone_topology

__author__ = 'John Stanford'

from keystoneclient.exceptions import ClientException
from django.test import TestCase, SimpleTestCase
from django.conf import settings
from goldstone.models import GSConnection, ESData
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
    LOGSTASH_INDEX_NAME = 'logstash-test'

    DOCUMENT_TYPE = 'logs'
    conn = Elasticsearch(settings.ES_SERVER)
    template_f = gzip.open(os.path.join(os.path.dirname(__file__), "apps",
                                        "..", "..", "test_data",
                                        "template.json.gz"), 'rb')
    template = json.load(template_f)

    try:
        conn.indices.delete("_all")
    finally:
        {}

    conn.indices.create(LOGSTASH_INDEX_NAME, body=template)

    q = {"query": {"match_all": {}}}
    data_f = gzip.open(os.path.join(os.path.dirname(__file__), "apps", "..",
                                    "..", "test_data", "data.json.gz"))
    data = json.load(data_f)
    for dataset in data:
        for event in dataset['hits']['hits']:
            rv = conn.index(LOGSTASH_INDEX_NAME, event['_type'],
                            event['_source'])

    conn.indices.refresh([LOGSTASH_INDEX_NAME])

    create_daily_index()

    GOLDSTONE_INDEX_NAME = ESData()._get_latest_index('goldstone')
    data_f = gzip.open(os.path.join(os.path.dirname(__file__), "apps", "..",
                                    "..", "test_data",
                                    "goldstone_data.json.gz"))
    data = json.load(data_f)
    for dataset in data:
        for event in dataset['hits']['hits']:
            rv = conn.index(GOLDSTONE_INDEX_NAME, event['_type'],
                            event['_source'])

    conn.indices.refresh([GOLDSTONE_INDEX_NAME])


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
                          bad_endpoint, path)
        c.service_catalog.get_endpoints.side_effect = None
        c.service_catalog.get_endpoints.return_value = {
            endpoint: [{'publicURL': fake_response.url}]
        }
        fake_response.status_code = 404
        get.return_value = fake_response
        bad_path_call = stored_api_call(component, endpoint, bad_path)
        self.assertIn('reply', bad_path_call)
        self.assertIn('db_record', bad_path_call)
        self.assertEquals(bad_path_call['db_record']['response_status'], 404)
        fake_response.status_code = 200
        get.return_value = fake_response
        good_call = stored_api_call(component, endpoint, path)
        self.assertIn('reply', good_call)
        self.assertIn('db_record', good_call)
        self.assertEquals(good_call['db_record']['response_status'], 200)

    @patch('goldstone.tests.stored_api_call')
    def test_construct_api_rec(self, sac):
        component = 'abc'
        endpoint = 'compute'
        path = '/os-hypervisors'
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
        good_call = stored_api_call(component, endpoint, path)
        self.assertTrue(sac.called)
        self.assertIn('reply', good_call)
        reply = good_call['reply']

        rec = _construct_api_rec(reply, component, ts)
        self.assertIn('response_time', rec)
        td = reply.elapsed
        total_secs = (td.microseconds + (td.seconds + td.days * 24 * 3600) *
                      10**6) / 10**6
        self.assertEqual(rec['response_time'], total_secs)
        self.assertIn('response_status', rec)
        self.assertEqual(rec['response_status'], reply.status_code)
        self.assertIn('response_length', rec)
        self.assertEqual(rec['response_length'],
                         int(reply.headers['content-length']))
        self.assertIn('component', rec)
        self.assertEqual(rec['component'], component)
