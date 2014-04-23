from django.test import SimpleTestCase
from .tasks import time_neutron_api
from .views import AgentListApiPerfView
import logging
from datetime import datetime
import calendar
import pytz
import pandas as pd
from mock import patch
from .models import ApiPerfData
from requests.models import Response

logger = logging.getLogger(__name__)


class TaskTests(SimpleTestCase):
    # the patch is specified with the package where the thing is looked up.
    # see http://www.voidspace.org.uk/python/mock/patch.html#id1.  Also
    # note that the decorators are applied from the bottom upwards. This is
    # the standard way that Python applies decorators. The order of the
    # created mocks passed into your test function matches this order.
    @patch('goldstone.apps.neutron.tasks.stored_api_call')
    @patch.object(ApiPerfData, 'post')
    def test_time_glance_api(self, post, api):
        fake_response = Response()
        fake_response.status_code = 200
        fake_response._content = '{"a":1,"b":2}'
        api.return_value = {'db_record': 'fake_record',
                            'reply': fake_response}
        post.return_value = 'fake_id'
        result = time_neutron_api()
        self.assertTrue(api.called)
        api.assert_called_with("neutron", "network", "/v2.0/agents")
        self.assertTrue(post.called)
        post.assert_called_with(api.return_value['db_record'])
        self.assertIn('id', result)
        self.assertEqual(result['id'], post.return_value)
        self.assertIn('record', result)
        self.assertEqual(result['record'], api.return_value['db_record'])


class ViewTests(SimpleTestCase):
    start_dt = datetime.fromtimestamp(0, tz=pytz.utc)
    end_dt = datetime.utcnow()
    start_ts = calendar.timegm(start_dt.utctimetuple())
    end_ts = calendar.timegm(end_dt.utctimetuple())

    def test_get_data(self):
        v = AgentListApiPerfView()
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
        uri = '/neutron/report'
        response = self.client.get(uri)
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'neutron_report.html')

    def test_rendered_api_perf_view(self):
        uri = '/neutron/agent_list_api_perf?start_time=' + \
              str(self.start_ts) + "&end_time=" + \
              str(self.end_ts) + "&interval=3600s"

        response = self.client.get(uri)
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'agent_list_api_perf.html')

    def test_unrendered_api_perf_view(self):
        uri = '/neutron/agent_list_api_perf?start_time=' + \
              str(self.start_ts) + "&end_time=" + \
              str(self.end_ts) + "&interval=3600s&render=false"

        response = self.client.get(uri)
        self.assertEqual(response.status_code, 200)
