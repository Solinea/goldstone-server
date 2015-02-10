"""Nova test views."""
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

# TODO replace pytz and calendar with arrow
import json
from django.http import HttpResponse
import pytz
import calendar
import logging
import pandas as pd

from django.test import SimpleTestCase
from django.utils.unittest.case import skip
from goldstone.apps.nova.views import SpawnsView
from .models import SpawnData
from datetime import datetime
from mock import patch


logger = logging.getLogger(__name__)


class NovaSpawnsViewTest(SimpleTestCase):

    # view requires a start_ts, end_ts, and interval string
    valid_start = str(calendar.timegm(
        datetime(2014, 3, 12, 0, 0, 0, tzinfo=pytz.utc).utctimetuple()))
    valid_end = str(calendar.timegm(
        datetime.now(tz=pytz.utc).utctimetuple()))
    valid_interval = '3600s'
    invalid_start = '999999999999'
    invalid_end = '999999999999'
    invalid_interval = 'abc'

    def test_with_explicit_render(self):
        url = '/nova/hypervisor/spawns?start=' + self.valid_start + \
            "&end=" + self.valid_end + \
            "&interval=" + self.valid_interval + \
            "&render=true"
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'spawns.html')

    def test_with_implicit_render(self):
        url = '/nova/hypervisor/spawns?start=' + self.valid_start + \
            "&end=" + self.valid_end + \
            "&interval=" + self.valid_interval
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'spawns.html')

    def _test_no_render_success(self, url):
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

    def _test_no_render_bad_request(self, url):
        response = self.client.get(url)
        self.assertEqual(response.status_code, 400)

    def test_no_render(self):
        url = "/nova/hypervisor/spawns?start=" + self.valid_start + \
            "&end=" + self.valid_end + \
            "&interval=" + self.valid_interval + \
            "&render=false"
        self._test_no_render_success(url)

    def test_no_start(self):
        url = "/nova/hypervisor/spawns?end=" + self.valid_end + \
            "&interval=" + self.valid_interval + \
            "&render=false"
        self._test_no_render_success(url)

    def test_no_end(self):
        url = "/nova/hypervisor/spawns?start=" + self.valid_start + \
            "&interval=" + self.valid_interval + \
            "&render=false"
        self._test_no_render_success(url)

    def test_no_interval(self):
        url = "/nova/hypervisor/spawns?start=" + self.valid_start + \
            "&end=" + self.valid_end + \
            "&render=false"
        self._test_no_render_success(url)

    def test_invalid_start(self):
        url = "/nova/hypervisor/spawns?start=" + self.invalid_start + \
            "&end=" + self.valid_end + \
            "&interval=" + self.valid_interval + \
            "&render=false"
        self._test_no_render_bad_request(url)

    def test_invalid_finish(self):
        url = "/nova/hypervisor/spawns?start=" + self.valid_start + \
            "&end=" + self.invalid_end + \
            "&interval=" + self.valid_interval + \
            "&render=false"
        self._test_no_render_bad_request(url)

    def test_invalid_interval(self):
        url = "/nova/hypervisor/spawns?start=" + self.valid_start + \
            "&end=" + self.valid_end + \
            "&interval=" + self.invalid_interval + \
            "&render=false"
        self._test_no_render_bad_request(url)

    def test_invalid_render(self):
        url = "/nova/hypervisor/spawns?start=" + self.valid_start + \
            "&end=" + self.valid_end + \
            "&interval=" + self.valid_interval + \
            "&render=xyz"
        self._test_no_render_bad_request(url)

    @patch.object(SpawnData, 'get_spawn_success')
    @patch.object(SpawnData, 'get_spawn_failure')
    @patch('goldstone.apps.nova.views._validate')
    def test_handle_request(self, val, gsf, gss):
        """
        ensure that the spawn data format is correct for all cases
        """
        test_df = pd.read_json(json.dumps([
            {u'key_as_string': u'2015-02-05T19:50:00.000Z',
             u'key': 1423165800000, u'doc_count': 1}
        ]), orient='records')
        val.return_value = {
            'start_dt': arrow.utcnow().isoformat(),
            'end_dt': arrow.utcnow().isoformat(),
            'interval': '1m'}

        # no spawns
        gsf.return_value = pd.DataFrame()
        gss.return_value = pd.DataFrame()
        view = SpawnsView()
        response = view._handle_request(val)
        self.assertEqual(response, {})

        # 1 successful spawns, 2 failed
        gss.return_value = pd.read_json(json.dumps([
            {u'timestamp': 1423165800000, u'successes': 1}
        ]), orient='records')
        gsf.return_value = pd.read_json(json.dumps([
            {u'timestamp': 1423165800000, u'failures': 2}
        ]), orient='records')
        response = view._handle_request(val)
        self.assertEqual(response, {1423165800000: [1, 2]})

        # 0 successful spawns, 2 failed spawns
        gss.return_value = pd.DataFrame()
        response = view._handle_request(val)
        self.assertEqual(response, {1423165800000: [0, 2]})

        # 1 successful spawns, 0 failed spawns
        gss.return_value = pd.read_json(json.dumps([
            {u'timestamp': 1423165800000, u'successes': 1}
        ]), orient='records')
        gsf.return_value = pd.DataFrame()
        response = view._handle_request(val)
        self.assertEqual(response, {1423165800000: [1, 0]})


class NovaApiPerfViewTest(SimpleTestCase):
    # view requires a start_ts, end_ts, and interval string
    valid_start = str(calendar.timegm(
        datetime(2014, 3, 12, 0, 0, 0, tzinfo=pytz.utc).utctimetuple()))
    valid_end = str(calendar.timegm(
        datetime.now(tz=pytz.utc).utctimetuple()))
    valid_interval = '3600s'
    invalid_start = '999999999999'
    invalid_end = '999999999999'
    invalid_interval = 'abc'

    def test_with_explicit_render(self):
        url = '/nova/api_perf?start=' + self.valid_start + \
            "&end=" + self.valid_end + \
            "&interval=" + self.valid_interval + \
            "&render=true"
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'nova_api_perf.html')

    def test_with_implicit_render(self):
        url = '/nova/api_perf?start=' + self.valid_start + \
            "&end=" + self.valid_end + \
            "&interval=" + self.valid_interval
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'nova_api_perf.html')

    def _test_no_render_success(self, url):
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

    def _test_no_render_bad_request(self, url):
        response = self.client.get(url)
        self.assertEqual(response.status_code, 400)

    def test_no_render(self):
        url = "/nova/api_perf?start=" + self.valid_start + \
            "&end=" + self.valid_end + \
            "&interval=" + self.valid_interval + \
            "&render=false"
        self._test_no_render_success(url)

    def test_no_start(self):
        url = "/nova/api_perf?end=" + self.valid_end + \
            "&interval=" + self.valid_interval + \
            "&render=false"
        self._test_no_render_success(url)

    def test_no_end(self):
        url = "/nova/api_perf?start=" + self.valid_start + \
            "&interval=" + self.valid_interval + \
            "&render=false"
        self._test_no_render_success(url)

    def test_no_interval(self):
        url = "/nova/api_perf?start=" + self.valid_start + \
            "&end=" + self.valid_end + \
            "&render=false"
        self._test_no_render_success(url)

    def test_invalid_start(self):
        url = "/nova/api_perf?start=" + self.invalid_start + \
            "&end=" + self.valid_end + \
            "&interval=" + self.valid_interval + \
            "&render=false"
        self._test_no_render_bad_request(url)

    def test_invalid_finish(self):
        url = "/nova/api_perf?start=" + self.valid_start + \
            "&end=" + self.invalid_end + \
            "&interval=" + self.valid_interval + \
            "&render=false"
        self._test_no_render_bad_request(url)

    def test_invalid_interval(self):
        url = "/nova/api_perf?start=" + self.valid_start + \
            "&end=" + self.valid_end + \
            "&interval=" + self.invalid_interval + \
            "&render=false"
        self._test_no_render_bad_request(url)

    def test_invalid_render(self):
        url = "/nova/api_perf?start=" + self.valid_start + \
            "&end=" + self.valid_end + \
            "&interval=" + self.valid_interval + \
            "&render=xyz"
        self._test_no_render_bad_request(url)


class LatestStatsViewTest(SimpleTestCase):

    def test_no_render(self):
        uri = '/nova/hypervisor/latest-stats?render=false'
        response = self.client.get(uri)
        self.assertEqual(response.status_code, 200)
        logger.debug("[test_no_render] response = %s",
                     response.content)
        self.assertNotEqual(json.loads(response.content), [])

    def test_with_render(self):
        uri = '/nova/hypervisor/latest-stats?render=true'
        response = self.client.get(uri)
        self.assertEqual(response.status_code, 200)
        logger.debug("[test_with_render] response = %s",
                     response.content)

    def test_default_render(self):
        uri = '/nova/hypervisor/latest-stats'
        response = self.client.get(uri)
        self.assertEqual(response.status_code, 200)
        logger.debug("[test_default_render] response = %s",
                     response.content)


class ResourceViewTest(SimpleTestCase):
    # view requires a start_ts, end_ts, and interval string
    valid_start = str(calendar.timegm(
        datetime(2014, 3, 12, 0, 0, 0, tzinfo=pytz.utc).utctimetuple()))
    valid_end = str(calendar.timegm(
        datetime.now(tz=pytz.utc).utctimetuple()))
    valid_interval = '3600s'
    invalid_start = '999999999999'
    invalid_end = '999999999999'
    invalid_interval = 'abc'

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
        self.assertNotEqual(response.content, None)
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
