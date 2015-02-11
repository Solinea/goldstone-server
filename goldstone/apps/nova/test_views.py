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

# TODO replace pytz and calendar with arrow
import json
from django.http import HttpResponse
import pytz
import calendar
import logging

from django.test import SimpleTestCase
from django.utils.unittest.case import skip
from datetime import datetime


logger = logging.getLogger(__name__)


class BaseTest(SimpleTestCase):
    """A base class that provides common attributes and utility methods."""

    # Define commonly used date/time and interval values.
    valid_start = str(calendar.timegm(
        datetime(2014, 3, 12, 0, 0, 0, tzinfo=pytz.utc).utctimetuple()))
    valid_end = str(calendar.timegm(
        datetime.now(tz=pytz.utc).utctimetuple()))
    valid_interval = '3600s'
    invalid_start = '999999999999'
    invalid_end = '999999999999'
    invalid_interval = 'abc'

    def _assert_success(self, url):
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

    def _assert_bad_request(self, url):
        response = self.client.get(url)
        self.assertEqual(response.status_code, 400)


class SpawnsApiPerfViewsTest(BaseTest):
    """Test /nova/hypervisor/spawns and /nova/api_perf views."""

    # The test URL bases.
    URLS_START = ["/nova/hypervisor/spawns?start=", "/nova/api_perf?start="]
    URLS_END = ["/nova/hypervisor/spawns?end=", "/nova/api_perf?end="]

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


class LatestStatsViewTest(SimpleTestCase):

    def test_good_request(self):

        uri = '/nova/hypervisor/latest-stats'

        response = self.client.get(uri)

        self.assertEqual(response.status_code, 200)
        self.assertNotEqual(json.loads(response.content), [])


class ResourceViewTest(BaseTest):

    # TODO fix or remove this test
    @skip('TODO')
    def test_get_hypervisor_cpu(self):
        end = datetime.now(tz=pytz.utc)
        start = datetime(2014, 3, 12, 0, 0, 0, tzinfo=pytz.utc)
        end_ts = calendar.timegm(end.utctimetuple())
        start_ts = calendar.timegm(start.utctimetuple())

        uri = '/intelligence/compute/cpu_stats?start_time=' + \
              str(start_ts) + "&end_time=" + str(end_ts) + "&interval=3600s"

        response = self.client.get(uri)
        logger.debug("[test_get_cpu_stats_view] uri = %s", uri)
        self.assertEqual(response.status_code, 200)
        self.assertNotEqual(json.loads(response.content), [])
        logger.debug("[test_get_cpu_stats_view] response = %s",
                     json.loads(response.content))

    # TODO fix or remove this test
    @skip('TODO')
    def test_get_hypervisor_mem(self):
        end = datetime.now(tz=pytz.utc)
        start = datetime(2014, 3, 12, 0, 0, 0, tzinfo=pytz.utc)
        end_ts = calendar.timegm(end.utctimetuple())
        start_ts = calendar.timegm(start.utctimetuple())

        uri = '/intelligence/compute/mem_stats?start_time=' + \
              str(start_ts) + "&end_time=" + str(end_ts) + "&interval=3600s"

        response = self.client.get(uri)
        logger.debug("[test_get_mem_stats_view] uri = %s", uri)
        self.assertEqual(response.status_code, 200)
        self.assertNotEqual(json.loads(response.content), [])
        logger.debug("[test_get_mem_stats_view] response = %s",
                     json.loads(response.content))

    # TODO fix or remove this test
    @skip('TODO')
    def test_get_hypervisor_disk(self):
        end = datetime.now(tz=pytz.utc)
        start = datetime(2014, 3, 12, 0, 0, 0, tzinfo=pytz.utc)
        end_ts = calendar.timegm(end.utctimetuple())
        start_ts = calendar.timegm(start.utctimetuple())

        uri = '/intelligence/compute/phys_disk_stats?start_time=' + \
              str(start_ts) + "&end_time=" + str(end_ts) + "&interval=3600s"

        response = self.client.get(uri)
        logger.debug("[test_get_phys_disk_stats_view] uri = %s", uri)
        self.assertEqual(response.status_code, 200)
        self.assertNotEqual(json.loads(response.content), [])
        logger.debug("[test_get_phys_disk_stats_view] response = %s",
                     json.loads(response.content))


class DataViewTests(SimpleTestCase):

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
        self._evaluate(self.client.get("/nova/agents"))

    def test_get_aggregates(self):
        self._evaluate(self.client.get("/nova/aggregates"))

    def test_get_avail_zones(self):
        self._evaluate(self.client.get("/nova/availability_zones"))

    def test_get_cloudpipes(self):
        self._evaluate(self.client.get("/nova/cloudpipes"))

    def test_get_flavors(self):
        self._evaluate(self.client.get("/nova/flavors"))

    def test_get_floating_ip_pools(self):
        self._evaluate(self.client.get("/nova/floating_ip_pools"))

    def test_get_hosts(self):
        self._evaluate(self.client.get("/nova/hosts"))

    def test_get_hypervisors(self):
        self._evaluate(self.client.get("/nova/hypervisors"))

    def test_get_networks(self):
        self._evaluate(self.client.get("/nova/networks"))

    def test_get_sec_groups(self):
        self._evaluate(self.client.get("/nova/security_groups"))

    def test_get_servers(self):
        self._evaluate(self.client.get("/nova/servers"))

    def test_get_services(self):
        self._evaluate(self.client.get("/nova/services"))
