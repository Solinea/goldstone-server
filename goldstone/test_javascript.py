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

__author__ = 'John Stanford'

from djangojs.runners import JsTestCase, JsTemplateTestCase
from djangojs.runners import QUnitSuite


class GoldstoneBaseQUnitTests(QUnitSuite, JsTemplateTestCase):
    template_name = 'qunit_base_tests.html'
    js_files = 'js/tests/base_tests.js'
    django_js = True
    url_name = 'goldstone_base_qunit_view'


class GoldstoneBase2QUnitTests(QUnitSuite, JsTestCase):
    template_name = 'qunit_base_tests.html'
    js_files = 'js/tests/base_tests.js'
    django_js = True
    url_name = 'goldstone_base_qunit_view'
