# Copyright 2014 Solinea, Inc.
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

from django.test import SimpleTestCase
from .tasks import time_nova_api
import logging
from mock import patch
from .models import NovaApiPerfData
from requests.models import Response

logger = logging.getLogger(__name__)


class TaskTests(SimpleTestCase):
    # the patch is specified with the package where the thing is looked up.
    # see http://www.voidspace.org.uk/python/mock/patch.html#id1.  Also
    # note that the decorators are applied from the bottom upwards. This is
    # the standard way that Python applies decorators. The order of the
    # created mocks passed into your test function matches this order.
    @patch('goldstone.apps.nova.tasks.stored_api_call')
    @patch.object(NovaApiPerfData, 'post')
    def test_time_glance_api(self, post, api):
        fake_response = Response()
        fake_response.status_code = 200
        fake_response._content = '{"a":1,"b":2}'
        api.return_value = {'db_record': 'fake_record',
                            'reply': fake_response}
        post.return_value = 'fake_id'
        result = time_nova_api()
        self.assertTrue(api.called)
        api.assert_called_with('nova', 'compute', '/os-hypervisors')
        self.assertTrue(post.called)
        post.assert_called_with(api.return_value['db_record'])
        self.assertIn('id', result)
        self.assertEqual(result['id'], post.return_value)
        self.assertIn('record', result)
        self.assertEqual(result['record'], api.return_value['db_record'])
