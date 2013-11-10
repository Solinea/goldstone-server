from django.core.urlresolvers import resolve 
from django.test import TestCase
from .views import home

class LeaseTest(TestCase):

    def setUp(self):
        pass

    def tearDown(self):
        pass

    def test_root_url_resolves_to_home_page_view(self):
        found = resolve('/')
        self.assertEqual(found.func, home)
