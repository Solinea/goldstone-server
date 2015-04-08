"""Nova view unit tests."""
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
import json

from django.contrib.auth import get_user_model
from django.http import HttpResponse
from django.test import SimpleTestCase
from django.utils.unittest.case import skip

from goldstone.test_utils import create_and_login, AUTHORIZATION_PAYLOAD


class BaseTest(SimpleTestCase):
    """A base class that provides common attributes and utility methods."""

    # Define commonly used date/time and interval values.
    end = arrow.utcnow()
    start = end.replace(weeks=-1)
    valid_end = str(end.timestamp)
    valid_start = str(start.timestamp)
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

        self.assertEqual(response.status_code, 200)

    def _assert_bad_request(self, url, code=400):
        """Do a request that should fail."""

        response = self.client.get(
            url,
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % self.token)

        self.assertEqual(response.status_code, code)


class SpawnsViewTests(BaseTest):
    """Test /nova/hypervisor/spawns and /nova/api_perf views."""

    # The test URL bases.
    URLS_START = ["/nova/hypervisor/spawns?start="]
    URLS_END = ["/nova/hypervisor/spawns?end="]

    @skip('needs refreshed or mocked ES data')
    def test_good_request(self):
        """Well formed call should succeed"""

        for entry in self.URLS_START:
            url = entry + self.valid_start + \
                "&end=" + self.valid_end + \
                "&interval=" + self.valid_interval
            self._assert_success(url)

    @skip('needs refreshed or mocked ES data')
    def test_no_end(self):
        """No end param is ok"""

        for entry in self.URLS_START:
            url = entry + self.valid_start + "&interval=" + self.valid_interval
            self._assert_success(url)

    def test_no_interval(self):
        """No interval param should return a 400"""

        for entry in self.URLS_START:
            url = entry + self.valid_start + "&end=" + self.valid_end
            self._assert_bad_request(url)

    def test_no_start(self):
        """No start param should return a 400"""

        for entry in self.URLS_END:
            url = entry + self.valid_end + "&interval=" + self.valid_interval
            self._assert_bad_request(url)

    def test_invalid_start(self):
        """Invalid start param should return a 400"""

        for entry in self.URLS_START:
            url = entry + self.invalid_start + \
                "&end=" + self.valid_end + \
                "&interval=" + self.valid_interval
            self._assert_bad_request(url)

    def test_invalid_finish(self):
        """Invalid end param should return a 400"""

        for entry in self.URLS_START:
            url = entry + self.valid_start + \
                "&end=" + self.invalid_end + \
                "&interval=" + self.valid_interval
            self._assert_bad_request(url)

    def test_invalid_interval(self):
        """Invalid interval param should return a 400"""
        for entry in self.URLS_START:
            url = entry + self.valid_start + \
                "&end=" + self.valid_end + \
                "&interval=" + self.invalid_interval
            self._assert_bad_request(url)


class DataViewTests(SimpleTestCase):

    def setUp(self):
        """Run before every test."""

        get_user_model().objects.all().delete()
        self.token = create_and_login()

    def _evaluate(self, response):

        self.assertIsInstance(response, HttpResponse)
        self.assertIsNotNone(response.content)

        try:
            j = json.loads(response.content)
        except Exception:             # pylint: disable=W0703
            self.fail("Could not convert content to JSON, content was %s" %
                      response.content)
        else:
            self.assertIsInstance(j, list)
            self.assertGreaterEqual(len(j), 1)
            self.assertIsInstance(j[0], list)

    def test_get_agents(self):
        self._evaluate(self.client.get(
            "/nova/agents",
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % self.token))

    def test_get_aggregates(self):
        self._evaluate(self.client.get(
            "/nova/aggregates",
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % self.token))

    def test_get_avail_zones(self):
        self._evaluate(self.client.get(
            "/nova/availability_zones",
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % self.token))

    def test_get_cloudpipes(self):
        self._evaluate(self.client.get(
            "/nova/cloudpipes",
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % self.token))

    def test_get_flavors(self):
        self._evaluate(self.client.get(
            "/nova/flavors",
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % self.token))

    def test_get_floating_ip_pools(self):
        self._evaluate(self.client.get(
            "/nova/floating_ip_pools",
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % self.token))

    def test_get_hosts(self):
        self._evaluate(self.client.get(
            "/nova/hosts",
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % self.token))

    def test_get_hypervisors(self):
        self._evaluate(self.client.get(
            "/nova/hypervisors",
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % self.token))

    def test_get_networks(self):
        self._evaluate(self.client.get(
            "/nova/networks",
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % self.token))

    def test_get_sec_groups(self):
        self._evaluate(self.client.get(
            "/nova/security_groups",
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % self.token))

    def test_get_servers(self):
        self._evaluate(self.client.get(
            "/nova/servers",
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % self.token))

    def test_get_services(self):
        self._evaluate(self.client.get(
            "/nova/services",
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % self.token))
