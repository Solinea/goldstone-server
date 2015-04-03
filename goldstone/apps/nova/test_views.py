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
import pandas as pd

from django.contrib.auth import get_user_model
from django.http import HttpResponse
from django.test import SimpleTestCase
from mock import patch
from rest_framework.test import APITestCase

from goldstone.test_utils import create_and_login, AUTHORIZATION_PAYLOAD
from .models import SpawnData


class BaseTest(SimpleTestCase):
    """A base class that provides common attributes and utility methods."""

    # Define commonly used date/time and interval values.
    valid_start = str(arrow.get(2014, 3, 12).timestamp)
    valid_end = str(arrow.utcnow().timestamp)
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

    def _assert_bad_request(self, url):
        """Do a request that should fail."""

        response = self.client.get(
            url,
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % self.token)

        self.assertEqual(response.status_code, 400)


class SpawnsApiPerfViewsTest(BaseTest):
    """Test /nova/hypervisor/spawns and /nova/api_perf views."""

    # The test URL bases.
    URLS_START = ["/nova/hypervisor/spawns?start="]
    URLS_END = ["/nova/hypervisor/spawns?end="]

    def test_good_request(self):

        for entry in self.URLS_START:
            url = entry + self.valid_start + \
                "&end=" + self.valid_end + \
                "&interval=" + self.valid_interval
            self._assert_success(url)

    def test_no_end(self):

        for entry in self.URLS_START:
            url = entry + self.valid_start + "&interval=" + self.valid_interval
            self._assert_success(url)

    def test_no_interval(self):

        for entry in self.URLS_START:
            url = entry + self.valid_start + "&end=" + self.valid_end
            self._assert_success(url)

    def test_no_start(self):

        for entry in self.URLS_END:
            url = entry + self.valid_end + "&interval=" + self.valid_interval
            self._assert_success(url)

    def test_invalid_start(self):

        for entry in self.URLS_START:
            url = entry + self.invalid_start + \
                "&end=" + self.valid_end + \
                "&interval=" + self.valid_interval
            self._assert_bad_request(url)

    def test_invalid_finish(self):

        for entry in self.URLS_START:
            url = entry + self.valid_start + \
                "&end=" + self.invalid_end + \
                "&interval=" + self.valid_interval
            self._assert_bad_request(url)

    def test_invalid_interval(self):

        for entry in self.URLS_START:
            url = entry + self.valid_start + \
                "&end=" + self.valid_end + \
                "&interval=" + self.invalid_interval
            self._assert_bad_request(url)


class SpawnsHandleRequest(APITestCase):

    def setUp(self):
        """Run before every test."""

        get_user_model().objects.all().delete()
        self.token = create_and_login()

    @patch.object(SpawnData, 'get_spawn_success')
    @patch.object(SpawnData, 'get_spawn_failure')
    @patch('goldstone.apps.nova.views.validate')
    def test_handle_request(self, val, gsf, gss):
        """Ensure that the spawn data format is correct for all cases.

        We do not use the reverse() function, because DRF ViewSets appear to
        not hook URLs up so that reverse() can find them.

        """

        # Set up validate() return value.
        val.return_value = {'start_dt': arrow.utcnow().isoformat(),
                            'end_dt': arrow.utcnow().isoformat(),
                            'interval': '1m'}

        # Set up the request URL and dummy query string values. The query
        # string doesn't matter, since validate() is mocked out.
        url = "/nova/hypervisor/spawns"
        data = {"foo": "bar"}

        # no spawns
        gsf.return_value = pd.DataFrame()
        gss.return_value = pd.DataFrame()

        response = self.client.get(
            url,
            data,
            format='json',
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % self.token)
        self.assertEqual(response.data, {})          # pylint: disable=E1101
        self.assertEqual(response.status_code, 200)

        # 1 successful spawns, 2 failed
        gss.return_value = pd.read_json(
            json.dumps([{u'timestamp': 1423165800000, u'successes': 1}]),
            orient='records')
        gsf.return_value = pd.read_json(
            json.dumps([{u'timestamp': 1423165800000, u'failures': 2}]),
            orient='records')

        response = self.client.get(
            url,
            data,
            format='json',
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % self.token)
        self.assertEqual(response.data,                # pylint: disable=E1101
                         {1423165800000: [1, 2]})
        self.assertEqual(response.status_code, 200)

        # 0 successful spawns, 2 failed spawns
        gss.return_value = pd.DataFrame()
        response = self.client.get(
            url,
            data,
            format='json',
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % self.token)
        self.assertEqual(response.data,                 # pylint: disable=E1101
                         {1423165800000: [0, 2]})
        self.assertEqual(response.status_code, 200)

        # 1 successful spawns, 0 failed spawns
        gss.return_value = \
            pd.read_json(json.dumps([{u'timestamp': 1423165800000,
                                      u'successes': 1}]),
                         orient='records')
        gsf.return_value = pd.DataFrame()

        response = self.client.get(
            url,
            data,
            format='json',
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % self.token)
        self.assertEqual(response.data,                 # pylint: disable=E1101
                         {1423165800000: [1, 0]})
        self.assertEqual(response.status_code, 200)


class LatestStatsViewTest(SimpleTestCase):

    def test_good_request(self):

        URI = '/nova/hypervisor/latest-stats'

        get_user_model().objects.all().delete()
        token = create_and_login()

        response = self.client.get(
            URI,
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        self.assertEqual(response.status_code, 200)
        self.assertNotEqual(json.loads(response.content), [])


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
