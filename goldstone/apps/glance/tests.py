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
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either expressed or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import arrow

import json
import logging

from django.http import HttpResponse
from django.test import SimpleTestCase
from mock import patch

from requests.models import Response
from goldstone.models import ApiPerfData, daily_index, es_conn

from .tasks import time_glance_api
from .views import ApiPerfView

logger = logging.getLogger(__name__)


class TaskTests(SimpleTestCase):

    # the patch is specified with the package where the thing is looked up.
    # see http://www.voidspace.org.uk/python/mock/patch.html#id1.  Also
    # note that the decorators are applied from the bottom upwards. This is
    # the standard way that Python applies decorators. The order of the
    # created mocks passed into your test function matches this order.
    @patch('goldstone.apps.glance.tasks.stored_api_call')
    @patch.object(ApiPerfData, 'save')
    def test_time_glance_api(self, save, api):

        fake_response = Response()
        fake_response.status_code = 200
        fake_response._content = '{"a":1,"b":2}'   # pylint: disable=W0212
        api.return_value = {'db_record': 'fake_record', 'reply': fake_response}
        save.return_value = True

        result = time_glance_api()
        self.assertTrue(api.called)
        api.assert_called_with("glance", "image", "/v2/images")
        save.assert_called_with()
        self.assertTrue('created', result)
        self.assertEqual(result, save.return_value)


class ViewTests(SimpleTestCase):

    start = arrow.get(0)

    def test_get_data(self):

        # setup
        self.conn = es_conn()
        stats = [ApiPerfData(response_status=status,
                             created=arrow.utcnow().datetime,
                             component='glance',
                             uri='http://test',
                             response_length=999,
                             response_time=999)
                 for status in range(100,601,100)]

        for stat in stats:
            created = stat.save()
            self.assertTrue(created)

        self.conn.indices.refresh(daily_index(ApiPerfData._INDEX_PREFIX))

        perfview = ApiPerfView()

        context = {'start_dt': self.start.isoformat(),
                   'end_dt': arrow.utcnow().isoformat(),
                   'interval': '3600s'
                   }

        result = perfview._get_data(context)           # pylint: disable=W0212
        self.assertIsInstance(result, list)
        self.assertNotEqual(len(result), 0)

        # teardown
        result = ApiPerfData.search().execute()
        for hit in result.hits:
            hit.delete()

        self.conn.indices.refresh(daily_index(ApiPerfData._INDEX_PREFIX))


    def test_report_view(self):

        uri = '/glance/report'
        response = self.client.get(uri)
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'glance_report.html')

    def test_api_perf_view(self):

        # TODO let's consider adding a component param to a top level view
        uri = '/glance/api_perf?start_time=' + \
              str(self.start.timestamp) + "&end_time=" + \
              str(arrow.utcnow().timestamp) + "&interval=3600s"

        response = self.client.get(uri)
        self.assertEqual(response.status_code, 200)


class DataViewTests(SimpleTestCase):

    def _evaluate(self, response):

        self.assertIsInstance(response, HttpResponse)
        self.assertIsNotNone(response.content)

        try:
            result = json.loads(response.content)
        except Exception:        # pylint: disable=W0703
            self.fail("Could not convert content to JSON, content was %s" %
                      response.content)
        else:
            self.assertIsInstance(result, list)
            self.assertGreaterEqual(len(result), 1)
            self.assertIsInstance(result[0], list)

    def test_get_images(self):
        self._evaluate(self.client.get("/glance/images"))
