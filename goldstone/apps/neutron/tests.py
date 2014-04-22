from django.test import SimpleTestCase
from .tasks import time_neutron_api
import logging

logger = logging.getLogger(__name__)


class TaskTests(SimpleTestCase):

    def test_time_neutron_api(self):
        result = time_neutron_api()
        self.assertIn('id', result)
        self.assertIn('record', result)

