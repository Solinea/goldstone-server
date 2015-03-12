"""Cinder tests."""
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
from django.test import SimpleTestCase
from mock import patch

from goldstone.apps.cinder.tasks import time_service_list
from goldstone.test_utils import create_and_login, AUTHORIZATION_PAYLOAD


class TaskTests(SimpleTestCase):
    """Test cinder tasks."""

    @patch('goldstone.apps.cinder.tasks.time_api_call')
    @patch('goldstone.apps.cinder.tasks.stack_api_request_base')
    def test_time_image_list_api(self, m_base, m_time_api_call):
        from django.conf import settings
        from goldstone.tenants.models import Tenant, Cloud
        import requests
        from requests import Response

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
        response._content = '{"services": [{"id": 1}]}'
        response.status_code = requests.codes.ok
        m_base.return_value = {'url': 'http://url', 'headers': {}}
        m_time_api_call.return_value = {'created': True,
                                        'response': response}
        result = time_service_list()
        self.assertEqual(m_time_api_call.call_count, 1)
        self.assertEqual(result, m_time_api_call.return_value)


class ViewTests(SimpleTestCase):
    """Test api_perf."""

    def test_report_view(self):
        uri = '/cinder/report'
        response = self.client.get(uri)
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'cinder_report.html')


class DataViewTests(SimpleTestCase):
    """Test a grabbag of cinder API endpoints."""

    def setUp(self):
        """Run before every test."""
        from django.contrib.auth import get_user_model

        get_user_model().objects.all().delete()
        self.token = create_and_login()

    def _evaluate(self, response):
        """Check a test's results."""
        import json
        from django.http import HttpResponse

        self.assertIsInstance(response, HttpResponse)
        self.assertNotEqual(response.content, None)

        try:
            results = json.loads(response.content)
        except Exception:          # pylint: disable=W0703
            self.fail("Could not convert content to JSON, content was %s" %
                      response.content)
        else:
            self.assertIsInstance(results, list)
            self.assertGreaterEqual(len(results), 1)
            self.assertIsInstance(results[0], list)

    def test_get_volumes(self):

        self._evaluate(self.client.get(
            "/cinder/volumes",
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % self.token))

    def test_get_backups(self):

        self._evaluate(self.client.get(
            "/cinder/backups",
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % self.token))

    def test_get_snapshots(self):

        self._evaluate(self.client.get(
            "/cinder/snapshots",
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % self.token))

    def test_get_services(self):

        self._evaluate(self.client.get(
            "/cinder/services",
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % self.token))

    def test_get_volume_types(self):

        self._evaluate(self.client.get(
            "/cinder/volume_types",
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % self.token))

    def test_get_transfers(self):

        self._evaluate(self.client.get(
            "/cinder/transfers",
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % self.token))
