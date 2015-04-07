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
from django.conf import settings
from django.contrib.auth import get_user_model
from django.test import TestCase, SimpleTestCase
from elasticsearch import Elasticsearch
import gzip
import os
import json
import sys

# This is needed here for mock to work.
from elasticsearch.client import IndicesClient
from elasticsearch_dsl.connections import connections, Connections
from mock import patch
import mock

from goldstone.core.models import Host
from goldstone.core.tasks import create_daily_index
from goldstone.models import ESData, es_conn, daily_index, es_indices, \
    TopologyData
from goldstone.tenants.models import Tenant
from goldstone.test_utils import Setup

sys.path.append("..")      # For importing from fabfile.
from fabfile import _tenant_init, DEFAULT_TENANT, DEFAULT_TENANT_OWNER, \
    DEFAULT_ADMIN, DEFAULT_ADMIN_PASSWORD


class TenantInit(Setup):
    """Test the fabfile's _tenant_init function.

    We call it with the settings file being used by the unittest testrunner.

    """

    settings = os.environ["DJANGO_SETTINGS_MODULE"].split('.')[2]

    def _evaluate(self, tenant, tenant_owner, admin):
        """Evaluate the test results."""

        # Test that the tenant exists.
        self.assertEqual(Tenant.objects.count(), 1)
        tenant = Tenant.objects.get(name=tenant)
        self.assertEqual(tenant.owner, tenant_owner)
        self.assertEqual(tenant.owner_contact, '')

        # Test that the user exists.
        self.assertEqual(get_user_model().objects.count(), 1)
        user = get_user_model().objects.get(username=admin)
        self.assertEqual(user.tenant, tenant)
        self.assertTrue(user.tenant_admin)
        self.assertTrue(user.default_tenant_admin)

    def test_happy(self):
        "Create tenant and tenant_admin."""

        _tenant_init(settings=self.settings)
        self._evaluate(DEFAULT_TENANT, DEFAULT_TENANT_OWNER, DEFAULT_ADMIN)

    def test_tenant_exists(self):
        "Tenant already exists."""

        Tenant.objects.create(name=DEFAULT_TENANT, owner=DEFAULT_TENANT_OWNER)
        self.test_happy()

    def test_admin_exists(self):
        """Admin account already exists, but isn't a tenant_admin or
        default_tenant_admin."""

        get_user_model().objects.create_user(username=DEFAULT_ADMIN,
                                             password=DEFAULT_ADMIN_PASSWORD)
        self.test_happy()

    def test_arguments(self):
        "Caller supplies arguments."""

        _tenant_init(tenant="Traci",
                     tenant_owner="Jordan",
                     admin="john",
                     password="Michelle",
                     settings=self.settings)

        self._evaluate("Traci", "Jordan", "john")

    def test_arguments_exists(self):
        """Caller supplies arguments, tenant and admin already exist, use
        positional parameter passing, and don't supply an admin password."""

        Tenant.objects.create(name="bob", owner="bahb")
        get_user_model().objects.create_user(username="bahhb", password='b')

        _tenant_init("bob", "bahb", "bahhb", settings=self.settings)
        self._evaluate("bob", "bahb", "bahhb")


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


class ReportTemplateViewTest(SimpleTestCase):

    node1 = Host(name="test_node_123")

    def setUp(self):
        """Run before every test."""

        Host.objects.all().delete()

    def test_good_request(self):

        self.node1.save()
        url = '/report/node/' + self.node1.name

        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)   # pylint: disable=E1101
        self.assertTemplateUsed(response, 'node_report.html')

    def test_bad_get_request(self):
        url = '/report/node/missing_node'
        response = self.client.get(url)
        self.assertEqual(response.status_code, 404)  # pylint: disable=E1101

    def test_post_request(self):
        url = '/report/node/missing_node'
        response = self.client.post(url, data={})
        self.assertEqual(response.status_code, 405)  # pylint: disable=E1101

    def test_put_request(self):
        url = '/report/node/missing_node'
        response = self.client.put(url, data={})
        self.assertEqual(response.status_code, 405)  # pylint: disable=E1101

    def test_delete_request(self):
        url = '/report/node/missing_node'
        response = self.client.delete(url)
        self.assertEqual(response.status_code, 405)  # pylint: disable=E1101


class TopologyDataTest(SimpleTestCase):

    def test_sort_arg(self):

        # pylint: disable=W0212
        with self.assertRaises(ValueError):
            TopologyData._sort_arg("key", "bad")

        self.assertEquals(TopologyData._sort_arg("key", "+"), "key")
        self.assertEquals(TopologyData._sort_arg("key", "asc"), "key")
        self.assertEquals(TopologyData._sort_arg("key", "-"), "-key")
        self.assertEquals(TopologyData._sort_arg("key", "desc"), "-key")
