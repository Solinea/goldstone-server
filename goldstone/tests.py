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

import arrow
from django.test import TestCase, SimpleTestCase
from django.conf import settings
from elasticsearch import Elasticsearch
import gzip
import os
import json
import sys

# This is needed here for mock to work.
from elasticsearch.client import IndicesClient
from elasticsearch_dsl.connections import connections, Connections
from keystoneclient.exceptions import ClientException
from mock import patch, PropertyMock
import mock

from goldstone.models import ESData, es_conn, daily_index, es_indices, \
    TopologyData
from goldstone.apps.core.models import Node
from goldstone.apps.core.tasks import create_daily_index
from goldstone.utils import get_keystone_client, GoldstoneAuthError
sys.path.append("..")   # For the tenant_init tests
from fabfile import tenant_init


class TenantInit(TestCase):
    """Test the fabfile's tenant_init task."""

    def test_happy(self):

        tenant_init()


class PrimeData(TestCase):
    """This should run before all SimpleTestCase methods."""

    conn = es_conn()

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

    @patch.object(connections, 'get_connection')
    @patch.object(connections, 'configure')
    def test_connection(self, mock_conf, mock_es):

        mock_es.return_value = None
        mock_conf.return_value = None

        es_conn()
        self.assertEqual(mock_es.call_count, 1)
        mock_conf.assert_called_with(default=settings.ES_SERVER,
                                     sniff_on_start=False,
                                     max_retries=1)

        mock_conf.reset_mock()
        mock_es.reset_mock()

        es_conn(server={'hosts': ['abc', 'def']})
        self.assertEqual(mock_es.call_count, 1)
        mock_conf.assert_called_with(default={'hosts': ['abc', 'def']},
                                     sniff_on_start=False,
                                     max_retries=1)

    def test_daily_index(self):

        date_str = arrow.utcnow().format('YYYY.MM.DD')
        self.assertEqual(daily_index("xyz-"), "xyz-" + date_str)

    @patch.object(Connections, 'get_connection')
    def test_es_indices(self, m_conn):
        """To avoid ES calls, we mock out the get_connection call, then set
        up additional mocks for the resulting ES connection.

        :param m_conn:
        :return:
        """
        m_es = mock.Mock(Elasticsearch, name='es')
        m_indices = mock.MagicMock(IndicesClient, name='indices')
        m_es.indices = m_indices
        m_es.indices.status.return_value = {
            'indices': {
                'index1': 'value1',
                'not_index1': 'value3'
            }
        }
        m_conn.return_value = m_es

        # test with no prefix provided
        self.assertEqual(es_indices(conn=es_conn()), "_all")

        # test with no params
        self.assertEqual(es_indices(), "_all")

        # test with no conn
        result = es_indices(prefix='index')
        self.assertTrue(m_es.indices.status.called)
        self.assertIn('index1', result)
        self.assertNotIn('not_index1', result)

        # test with prefix
        result = es_indices('index', es_conn())
        self.assertIn('index1', result)
        self.assertNotIn('not_index1', result)


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


class TopologyDataTest(SimpleTestCase):

    def test_sort_arg(self):
        with self.assertRaises(ValueError):
            TopologyData._sort_arg("key", "bad")
        self.assertEquals(TopologyData._sort_arg("key", "+"), "key")
        self.assertEquals(TopologyData._sort_arg("key", "asc"), "key")
        self.assertEquals(TopologyData._sort_arg("key", "-"), "-key")
        self.assertEquals(TopologyData._sort_arg("key", "desc"), "-key")
