"""Goldstone tests."""
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
from django.conf import settings
from django.contrib.auth import get_user_model
from django.test import SimpleTestCase
from elasticsearch import Elasticsearch
import os
import sys

# This is needed here for mock to work.
from elasticsearch.client import IndicesClient
from elasticsearch_dsl.connections import connections, Connections
from mock import patch
import mock

from goldstone.models import es_conn, daily_index, es_indices, TopologyData
from goldstone.tenants.models import Tenant
from goldstone.test_utils import Setup

sys.path.append("..")      # For importing from fabfile.
from installer_fabfile import tenant_init


class TenantInit(Setup):
    """Test the fabfile's tenant_init function.

    We call it with the settings file being used by the unittest testrunner.

    """

    settings = os.environ["DJANGO_SETTINGS_MODULE"].split('.')[2]
    DEFAULT_TENANT = 'default'
    DEFAULT_TENANT_OWNER = 'None'
    DEFAULT_ADMIN = 'gsadmin'
    DEFAULT_ADMIN_PASSWORD = 'goldstone'

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

        tenant_init(self.DEFAULT_TENANT, self.DEFAULT_TENANT_OWNER,
                    self.DEFAULT_ADMIN, self.DEFAULT_ADMIN_PASSWORD,
                    settings=self.settings)
        self._evaluate(self.DEFAULT_TENANT, self.DEFAULT_TENANT_OWNER,
                       self.DEFAULT_ADMIN)

    def test_tenant_exists(self):
        "Tenant already exists."""

        Tenant.objects.create(name=self.DEFAULT_TENANT,
                              owner=self.DEFAULT_TENANT_OWNER)
        self.test_happy()

    def test_admin_exists(self):
        """Admin account already exists, but isn't a tenant_admin or
        default_tenant_admin."""

        get_user_model().objects.create_user(
            username=self.DEFAULT_ADMIN,
            password=self.DEFAULT_ADMIN_PASSWORD)
        self.test_happy()

    def test_arguments(self):
        "Caller supplies arguments."""

        tenant_init("Traci", "Jordan", "john", "Michelle",
                    settings=self.settings)

        self._evaluate("Traci", "Jordan", "john")

    def test_arguments_exists(self):
        """Caller supplies arguments, tenant and admin already exist, use
        positional parameter passing."""

        Tenant.objects.create(name="bob", owner="bahb")
        get_user_model().objects.create_user(username="bahhb", password='b')

        tenant_init("bob", "bahb", "bahhb", "baab", settings=self.settings)
        self._evaluate("bob", "bahb", "bahhb")


class ESConnectionTests(SimpleTestCase):
    """Test the ES connection."""

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
        up additional mocks for the resulting ES connection."""

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


class TopologyDataTest(SimpleTestCase):

    def test_sort_arg(self):

        # pylint: disable=W0212
        with self.assertRaises(ValueError):
            TopologyData._sort_arg("key", "bad")

        self.assertEquals(TopologyData._sort_arg("key", "+"), "key")
        self.assertEquals(TopologyData._sort_arg("key", "asc"), "key")
        self.assertEquals(TopologyData._sort_arg("key", "-"), "-key")
        self.assertEquals(TopologyData._sort_arg("key", "desc"), "-key")
