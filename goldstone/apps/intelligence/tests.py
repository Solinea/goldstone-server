"""Intelligence unit tests.
TODO (JS) This is mostly an integration test.  We should tease out the unit
TODO (JS) test and migrate the other stuff to a better home.
"""
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


class IntelViewTest(SimpleTestCase):
    """Lease list view tests"""

    def test_search_template(self):

        response = self.client.get('/intelligence/search')
        self.assertEqual(response.status_code, 200)    # pylint: disable=E1101
        self.assertTemplateUsed(response, 'search.html')
