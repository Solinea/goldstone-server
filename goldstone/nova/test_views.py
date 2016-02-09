"""Nova view unit tests."""
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
import json
import urllib

import arrow

from django.contrib.auth import get_user_model
from django.http import HttpResponse
from django.test import SimpleTestCase
from django.utils.unittest import skip
from rest_framework.test import APISimpleTestCase

from goldstone.test_utils import create_and_login, AUTHORIZATION_PAYLOAD


class BaseTest(APISimpleTestCase):
    """A base class that provides common attributes and utility methods."""

    # Define commonly used date/time and interval values.
    end = arrow.utcnow()
    start = end.replace(weeks=-1)
    valid_end = end.isoformat().replace('+', '%2b')
    valid_start = end.isoformat().replace('+', '%2b')
    valid_interval = '3600s'
    invalid_start = 'abc'
    invalid_end = 'abc'
    invalid_interval = 'abc'

    def setUp(self):
        """Run before every test."""
        get_user_model().objects.all().delete()
        self.token = create_and_login()

    def _assert_success(self, url):
        """Do a request that should succeed."""

        response = self.client.get(
            url,
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % self.token)

        self.assertEqual(response.status_code, 200)   # pylint: disable=E1101

    def _assert_bad_request(self, url, code=400):
        """Do a request that should fail."""

        response = self.client.get(
            url,
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % self.token)

        self.assertEqual(response.status_code, code)  # pylint: disable=E1101


class DataViewTests(SimpleTestCase):
    """Test the non-hypervisor nova/ URLs."""

    def setUp(self):
        """Run before every test."""

        get_user_model().objects.all().delete()
        self.token = create_and_login()

    def _evaluate(self, response):
        """Evalute test results."""

        self.assertIsInstance(response, HttpResponse)
        self.assertIsNotNone(response.content)
        j = json.loads(response.content)
        self.assertIsInstance(j, list)

    # Disabling pylint's docstring check, because the remaining methods are
    # cookie-cutter.
    # pylint: disable=C0111

    def test_get_agents(self):
        self._evaluate(self.client.get(
            "/nova/agents/",
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % self.token))

    def test_get_aggregates(self):
        self._evaluate(self.client.get(
            "/nova/aggregates/",
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % self.token))

    def test_get_avail_zones(self):
        self._evaluate(self.client.get(
            "/nova/availability_zones/",
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % self.token))

    def test_get_cloudpipes(self):
        self._evaluate(self.client.get(
            "/nova/cloudpipes/",
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % self.token))

    def test_get_flavors(self):
        self._evaluate(self.client.get(
            "/nova/flavors/",
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % self.token))

    def test_get_floating_ip_pools(self):
        self._evaluate(self.client.get(
            "/nova/floating_ip_pools/",
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % self.token))

    def test_get_hosts(self):
        self._evaluate(self.client.get(
            "/nova/hosts/",
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % self.token))

    def test_get_hypervisors(self):
        self._evaluate(self.client.get(
            "/nova/hypervisors/",
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % self.token))

    def test_get_networks(self):
        self._evaluate(self.client.get(
            "/nova/networks/",
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % self.token))

    def test_get_sec_groups(self):
        self._evaluate(self.client.get(
            "/nova/security_groups/",
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % self.token))

    def test_get_servers(self):
        self._evaluate(self.client.get(
            "/nova/servers/",
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % self.token))

    def test_get_services(self):
        self._evaluate(self.client.get(
            "/nova/services/",
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % self.token))
