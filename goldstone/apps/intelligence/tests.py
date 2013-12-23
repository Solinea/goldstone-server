# vim: tabstop=4 shiftwidth=4 softtabstop=4

#
# Copyright 2013 Solinea, Inc.
#

from django.test.client import Client
from django.test.client import RequestFactory
from django.test import TestCase

from .views import IntelSearchView, IntelErrorsView


class IntelViewTest(TestCase):
    """Lease list view tests"""

    def setUp(self):
        pass

    def tearDown(self):
        pass

    def test_search_template(self):
        response = self.client.get('/intelligence/search')
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'search.html')
        # TODO add test to verify window popped up.  may need selenium?

    def test_errors_template(self):
        response = self.client.get('/intelligence/errors')
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'errors.html')
        # TODO add test to verify window popped up.  may need selenium?
