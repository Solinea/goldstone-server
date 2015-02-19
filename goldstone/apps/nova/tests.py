"""Nova unit tests."""
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
import logging
from mock import patch
import requests
from requests import Response
from goldstone.apps.nova.tasks import time_hypervisor_list_api, \
    time_hypervisor_show_api
from goldstone.models import ApiPerfData

logger = logging.getLogger(__name__)


class TaskTests(SimpleTestCase):

    @patch('goldstone.apps.nova.tasks.time_api_call')
    @patch('goldstone.apps.nova.tasks.openstack_api_request_base')
    def test_time_hypervisor_list_api(self, m_base, m_time_api_call):

        response = Response()
        response._content = '{"hypervisors": [{"id": 1}]}'
        response.status_code = requests.codes.ok
        m_base.return_value = {'url': 'http://url', 'headers': {}}
        m_time_api_call.return_value = {'created': True,
                                        'response': response}
        result = time_hypervisor_list_api()
        self.assertEqual(m_time_api_call.call_count, 2)
        self.assertEqual(result,
                         [m_time_api_call.return_value,
                          m_time_api_call.return_value])


    @patch('goldstone.apps.nova.tasks.time_api_call')
    @patch.object(ApiPerfData, 'save')
    def test_time_hypervisor_show_api(self, m_save, m_time_api_call):

        response = Response()
        response._content = '{"hypervisors": [{"id": 1}]}'
        response.status_code = requests.codes.ok
        m_save.return_value = True
        m_time_api_call.return_value = {'created': True,
                                        'response': response}
        result = time_hypervisor_show_api('http://url', {})
        self.assertTrue(m_time_api_call.called)
        self.assertEqual(result, m_time_api_call.return_value)