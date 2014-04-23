# Copyright 2014 Solinea, Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

__author__ = 'Ken Pepple'

from django.test.client import Client
from django.test.client import RequestFactory
from django.test import TestCase
from waffle import Switch


class CockpitViewTest(TestCase):
    """Lease list view tests"""

    def setUp(self):
        pass

    def tearDown(self):
        pass

    def test_cockpit_template(self):
        response = self.client.get('/cockpit')
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'cockpit.html')

    def test_leases_panel(self):
        switch, created = Switch.objects.get_or_create(name='gse',
                                                       active=False)
        self.assertNotEqual(switch, None)
        response = self.client.get('/cockpit')
        self.assertEqual(response.status_code, 200)
        self.assertNotContains(response, 'lease_panel')
        switch.active = True
        switch.save()
        response = self.client.get('/cockpit')
        self.assertEqual(response.status_code, 200)
        # TODO find a better way to tests dynamic loaded lease panel
        # self.assertContains(response, 'lease_panel')
