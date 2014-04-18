# vim: tabstop=4 shiftwidth=4 softtabstop=4

#
# Copyright 2013 Solinea, Inc.
#

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
