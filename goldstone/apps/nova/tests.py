from django.test import SimpleTestCase
from .tasks import time_nova_api
import logging

logger = logging.getLogger(__name__)


class TaskTests(SimpleTestCase):

    def test_time_nova_api(self):
        result = time_nova_api()
        self.assertIn('id', result)
        self.assertIn('record', result)

