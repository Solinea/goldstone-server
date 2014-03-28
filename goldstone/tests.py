__author__ = 'stanford'

from django.test import TestCase
from django.conf import settings
from .models import GSConnection


class GSConnectionModel(TestCase):
    def test_connection(self):
        conn1 = GSConnection().conn
        conn2 = GSConnection(settings.ES_SERVER).conn
        q = {"query": {"match_all": {}}}
        r1 = conn1.search(body=q)
        self.assertIsNotNone(r1)
        r2 = conn2.search(body=q)
        self.assertIsNotNone(r2)
