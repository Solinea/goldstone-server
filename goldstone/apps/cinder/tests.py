from django.test import SimpleTestCase
from .tasks import time_cinder_api
import logging

logger = logging.getLogger(__name__)


class TaskTests(SimpleTestCase):

    def test_time_cinder_api(self):
        result = time_cinder_api()
        self.assertIn('id', result)
        self.assertIn('record', result)