from django.core.urlresolvers import resolve 
from django.test import TestCase
from lease.views import home_page

class LeaseTest(TestCase):

    def setup():
        pass

    def teardown():
        pass

    def test_root_url_resolves_to_home_page_view(self):
        found = resolve('/lease')
        self.assertEqual(found.func, home_page)
