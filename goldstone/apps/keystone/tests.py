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
from .tasks import time_keystone_api
import logging
from .views import AuthApiPerfView
from datetime import datetime
import calendar
import pytz
from mock import patch
from .models import ApiPerfData
from requests.models import Response

logger = logging.getLogger(__name__)


class TaskTests(SimpleTestCase):

    # the patch is specified with the package where the thing is looked up.
    # see http://www.voidspace.org.uk/python/mock/patch.html#id1.  Also
    # note that the decorators are applied from the bottom upwards. This is
    # the standard way that Python applies decorators. The order of the
    # created mocks passed into your test function matches this order.
    @patch('goldstone.apps.keystone.tasks._construct_api_rec')
    @patch('requests.post')
    @patch.object(ApiPerfData, 'post')
    def test_time_glance_api(self, db_post, os_post, construct_rec):
        fake_response = Response()
        fake_response.status_code = 200
        fake_response._content = '{"a":1,"b":2}'
        os_post.return_value = fake_response
        db_post.return_value = 'fake_id'
        construct_rec.return_value = {}
        result = time_keystone_api()
        self.assertTrue(os_post.called)
        self.assertTrue(db_post.called)
        db_post.assert_called_with(construct_rec.return_value)
        self.assertIn('id', result)
        self.assertEqual(result['id'], db_post.return_value)
        self.assertIn('record', result)
        self.assertEqual(result['record'], construct_rec.return_value)


class ViewTests(SimpleTestCase):

    start_dt = datetime.fromtimestamp(0, tz=pytz.utc)
    end_dt = datetime.utcnow()
    start_ts = calendar.timegm(start_dt.utctimetuple())
    end_ts = calendar.timegm(end_dt.utctimetuple())

    def test_get_data(self):
        import pandas as pd

        view = AuthApiPerfView()
        context = {
            'start_dt': self.start_dt,
            'end_dt': self.end_dt,
            'interval': '3600s'
        }

        # returns a pandas data frame
        result = view._get_data(context)        # pylint: disable=W0212
        self.assertIsInstance(result, pd.DataFrame)
        self.assertFalse(result.empty)

    def test_report_view(self):
        uri = '/keystone/report'
        response = self.client.get(uri)
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'keystone_report.html')

    def test_rendered_api_perf_view(self):
        uri = '/keystone/api_perf?start_time=' + \
              str(self.start_ts) + "&end_time=" + \
              str(self.end_ts) + "&interval=3600s"

        response = self.client.get(uri)
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'keystone_api_perf.html')

    def test_unrendered_api_perf_view(self):
        uri = '/keystone/api_perf?start_time=' + \
              str(self.start_ts) + "&end_time=" + \
              str(self.end_ts) + "&interval=3600s&render=false"

        response = self.client.get(uri)
        self.assertEqual(response.status_code, 200)


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
