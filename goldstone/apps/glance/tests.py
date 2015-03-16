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

from django.http import HttpResponse
from django.test import SimpleTestCase
from mock import patch
import requests
from requests import Response

from .tasks import time_image_list_api


class TaskTests(SimpleTestCase):

    @patch('goldstone.apps.glance.tasks.time_api_call')
    @patch('goldstone.apps.glance.tasks.stack_api_request_base')
    def test_time_image_list_api(self, m_base, m_time_api_call):
        from django.conf import settings
        from goldstone.tenants.models import Tenant, Cloud

        # Set up the Cloud table for get_cloud, which is called by the celery
        # task.
        Tenant.objects.all().delete()
        tenant = Tenant.objects.create(name="Good", owner="Bar")
        Cloud.objects.create(tenant_name=settings.CLOUD_TENANT_NAME,
                             username=settings.CLOUD_USERNAME,
                             password=settings.CLOUD_PASSWORD,
                             auth_url=settings.CLOUD_AUTH_URL,
                             tenant=tenant)

        response = Response()
        response._content = '{"images": [{"id": 1}]}'   # pylint: disable=W0212
        response.status_code = requests.codes.ok
        m_base.return_value = {'url': 'http://url', 'headers': {}}
        m_time_api_call.return_value = {'created': True, 'response': response}
        result = time_image_list_api()

        self.assertEqual(m_time_api_call.call_count, 1)
        self.assertEqual(result, m_time_api_call.return_value)


class ViewTests(SimpleTestCase):
    """Test the report view."""

    def test_report_view(self):
        """Test /glance/report."""

        URI = '/glance/report'

        response = self.client.get(URI)
        self.assertEqual(response.status_code, 200)   # pylint: disable=E1101
        self.assertTemplateUsed(response, 'glance_report.html')


class DataViewTests(SimpleTestCase):
    """Test the data view."""

    def _evaluate(self, response):
        """Check the response."""

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
