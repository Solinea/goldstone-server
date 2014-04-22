from django.test import SimpleTestCase
from .tasks import time_glance_api
from .views import ImageApiPerfView
import logging
from datetime import datetime
import pytz
import calendar
import pandas as pd

logger = logging.getLogger(__name__)


class TaskTests(SimpleTestCase):

    def test_time_glance_api(self):
        result = time_glance_api()
        self.assertIn('id', result)
        self.assertIn('record', result)


class ViewTests(SimpleTestCase):
    start_dt = datetime.fromtimestamp(0, tz=pytz.utc)
    end_dt = datetime.utcnow()
    start_ts = calendar.timegm(start_dt.utctimetuple())
    end_ts = calendar.timegm(end_dt.utctimetuple())

    def test_get_data(self):
        v = ImageApiPerfView()
        context = {
            'start_dt': self.start_dt,
            'end_dt': self.end_dt,
            'interval': '3600s'
        }
        # returns a pandas data frame
        d = v._get_data(context)
        self.assertIsInstance(d, pd.DataFrame)
        self.assertEqual(d.empty, False)

    def test_report_view(self):
        uri = '/glance/report'
        response = self.client.get(uri)
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'glance_report.html')

    def test_rendered_api_perf_view(self):
        uri = '/glance/image_api_perf?start_time=' + \
              str(self.start_ts) + "&end_time=" + \
              str(self.end_ts) + "&interval=3600s"

        response = self.client.get(uri)
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'image_api_perf.html')

    def test_unrendered_api_perf_view(self):
        uri = '/glance/image_api_perf?start_time=' + \
              str(self.start_ts) + "&end_time=" + \
              str(self.end_ts) + "&interval=3600s&render=false"

        response = self.client.get(uri)
        self.assertEqual(response.status_code, 200)
