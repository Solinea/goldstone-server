"""Glance unit tests."""
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
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
import calendar
from datetime import datetime
import json
import logging

from django.http import HttpResponse
from django.test import SimpleTestCase
from mock import patch
import pytz
import pandas as pd
from requests.models import Response

from .models import GlanceApiPerfData
from .tasks import time_glance_api
from .views import ImageApiPerfView

logger = logging.getLogger(__name__)


class TaskTests(SimpleTestCase):

    # the patch is specified with the package where the thing is looked up.
    # see http://www.voidspace.org.uk/python/mock/patch.html#id1.  Also
    # note that the decorators are applied from the bottom upwards. This is
    # the standard way that Python applies decorators. The order of the
    # created mocks passed into your test function matches this order.
    @patch('goldstone.apps.glance.tasks.stored_api_call')
    @patch.object(GlanceApiPerfData, 'post')
    def test_time_glance_api(self, post, api):

        fake_response = Response()
        fake_response.status_code = 200
        fake_response._content = '{"a":1,"b":2}'   # pylint: disable=W0212
        api.return_value = {'db_record': 'fake_record', 'reply': fake_response}
        post.return_value = 'fake_id'

        result = time_glance_api()
        self.assertTrue(api.called)
        api.assert_called_with("glance", "image", "/v2/images")
        self.assertTrue(post.called)
        post.assert_called_with(api.return_value['db_record'])
        self.assertIn('id', result)
        self.assertEqual(result['id'], post.return_value)
        self.assertIn('record', result)
        self.assertEqual(result['record'], api.return_value['db_record'])


class ViewTests(SimpleTestCase):

    start_dt = datetime.fromtimestamp(0, tz=pytz.utc)
    end_dt = datetime.utcnow()
    start_ts = calendar.timegm(start_dt.utctimetuple())
    end_ts = calendar.timegm(end_dt.utctimetuple())

    def test_get_data(self):

        perfview = ImageApiPerfView()

        context = {'start_dt': self.start_dt,
                   'end_dt': self.end_dt,
                   'interval': '3600s'
                   }

        # returns a pandas data frame
        result = perfview._get_data(context)           # pylint: disable=W0212
        self.assertIsInstance(result, pd.DataFrame)
        self.assertFalse(result.empty)

    def test_report_view(self):

        uri = '/glance/report'
        response = self.client.get(uri)
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'glance_report.html')

    def test_rendered_api_perf_view(self):

        uri = '/glance/api_perf?start_time=' + \
              str(self.start_ts) + "&end_time=" + \
              str(self.end_ts) + "&interval=3600s"

        response = self.client.get(uri)
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'glance_api_perf.html')

    def test_unrendered_api_perf_view(self):

        uri = '/glance/api_perf?start_time=' + \
              str(self.start_ts) + "&end_time=" + \
              str(self.end_ts) + "&interval=3600s&render=false"

        response = self.client.get(uri)
        self.assertEqual(response.status_code, 200)


class DataViewTests(SimpleTestCase):

    def _evaluate(self, response):

        self.assertIsInstance(response, HttpResponse)
        self.assertIsNotNone(response.content)

        try:
            result = json.loads(response.content)
        except Exception:
            self.fail("Could not convert content to JSON, content was %s" %
                      response.content)
        else:
            self.assertIsInstance(result, list)
            self.assertGreaterEqual(len(result), 1)
            self.assertIsInstance(result[0], list)

    def test_get_images(self):
        self._evaluate(self.client.get("/glance/images"))
