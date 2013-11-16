from django.test import TestCase
from proj.celery import app


class CeleryLeaseTest(TestCase):

    def setUp(self):
        pass

    def tearDown(self):
        pass

    def test_pull_notifications(self):
        self.fail()

    def test_pull_expirations(self):
        self.fail()
