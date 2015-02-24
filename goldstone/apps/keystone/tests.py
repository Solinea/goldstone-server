"""Keystone app unit tests."""
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
from django.http import HttpResponse
from django.test import SimpleTestCase
from .tasks import time_token_post_api
import logging
from mock import patch

logger = logging.getLogger(__name__)


class TaskTests(SimpleTestCase):

    @patch('goldstone.apps.keystone.tasks.time_api_call')
    def test_time_token_post_api(self, m_time_api_call):

        m_time_api_call.return_value = True
        result = time_token_post_api()
        self.assertTrue(m_time_api_call.called)
        self.assertEqual(result, m_time_api_call.return_value)


class ViewTests(SimpleTestCase):

    def test_report_view(self):
        uri = '/keystone/report'
        response = self.client.get(uri)
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'keystone_report.html')


class DataViewTests(SimpleTestCase):

    def _evaluate(self, response):
        import json

        self.assertIsInstance(response, HttpResponse)
        self.assertIsNotNone(response.content)

        try:
            j = json.loads(response.content)
        except Exception:      # pylint: disable=W0703
            self.fail("Could not convert content to JSON, content was %s",
                      response.content)
        else:
            self.assertIsInstance(j, list)
            self.assertGreaterEqual(len(j), 1)
            self.assertIsInstance(j[0], list)

    def test_get_endpoints(self):
        self._evaluate(self.client.get("/keystone/endpoints"))

    def test_get_roles(self):
        self._evaluate(self.client.get("/keystone/roles"))

    def test_get_services(self):
        self._evaluate(self.client.get("/keystone/services"))

    def test_get_tenants(self):
        self._evaluate(self.client.get("/keystone/tenants"))

    def test_get_users(self):
        self._evaluate(self.client.get("/keystone/users"))
