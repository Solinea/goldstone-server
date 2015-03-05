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

import json
import logging

from django.http import HttpResponse
from django.test import SimpleTestCase
from mock import patch
import requests
from requests import Response

from .tasks import time_image_list_api


logger = logging.getLogger(__name__)


class TaskTests(SimpleTestCase):

    @patch('goldstone.apps.glance.tasks.time_api_call')
    @patch('goldstone.apps.glance.tasks.stack_api_request_base')
    def test_time_image_list_api(self, m_base, m_time_api_call):

        response = Response()
        response._content = '{"images": [{"id": 1}]}'
        response.status_code = requests.codes.ok
        m_base.return_value = {'url': 'http://url', 'headers': {}}
        m_time_api_call.return_value = {'created': True,
                                        'response': response}
        result = time_image_list_api()
        self.assertEqual(m_time_api_call.call_count, 1)
        self.assertEqual(result, m_time_api_call.return_value)


class ViewTests(SimpleTestCase):

    def test_report_view(self):

        uri = '/glance/report'
        response = self.client.get(uri)
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'glance_report.html')


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
        """GET to /images."""
        from django.contrib.auth import get_user_model
        from goldstone.test_utils import create_and_login, \
            AUTHORIZATION_PAYLOAD

        get_user_model().objects.all().delete()
        token = create_and_login()

        self._evaluate(
            self.client.get("/glance/images",
                            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token))
