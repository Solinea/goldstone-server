# vim: tabstop=4 shiftwidth=4 softtabstop=4

#
# Copyright 2014 Solinea, Inc.
#

from django.test import TestCase
from django.utils.unittest.case import skip
from .views import *
from datetime import datetime
import pytz


logger = logging.getLogger(__name__)


class NovaSpawnsViewTest(TestCase):
    # view accepts a start_ts, end_ts, and interval string
    valid_start = str(calendar.timegm(
        datetime(2014, 3, 12, 0, 0, 0, tzinfo=pytz.utc).utctimetuple()))
    valid_end = str(calendar.timegm(
        datetime.now(tz=pytz.utc).utctimetuple()))
    valid_interval = '1h'
    invalid_start = '999999999999'
    invalid_end = '999999999999'
    invalid_interval = 'abc'

    @skip("Not implemented yet")
    def test_with_explicit_render(self):
        logger.info('[test_with_explicit_render] start = %s', self.valid_start)
        logger.info('[test_with_explicit_render] end = %s', self.valid_end)
        logger.info('[test_with_explicit_render] interval = %s',
                    self.valid_interval)

        url = '/nova/hypervisor/spawns?start=' + self.valid_start + \
            "&end=" + self.valid_end + \
            "&interval=" + self.valid_interval + \
            "&render=true"
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'spawns.html')

    @skip("Not implemented yet")
    def test_with_implicit_render(self):
        logger.info('[test_with_implicit_render] start = %s', self.valid_start)
        logger.info('[test_with_implicit_render] end = %s', self.valid_end)
        logger.info('[test_with_implicit_render] interval = %s',
                    self.valid_interval)
        url = '/nova/hypervisor/spawns?start=' + self.valid_start + \
            "&end=" + self.valid_end + \
            "&interval=" + self.valid_interval
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'search.html')

    def _test_no_render_success(self, url):
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        keys = json.loads(response.content).keys()
        self.assertIn('failures', keys)
        self.assertIn('successes', keys)

    def _test_no_render_bad_request(self, url):
        response = self.client.get(url)
        self.assertEqual(response.status_code, 400)

    def test_no_render(self):
        logger.info('[test_no_render] start = %s', self.valid_start)
        logger.info('[test_no_render] end = %s', self.valid_end)
        logger.info('[test_no_render] interval = %s',
                    self.valid_interval)
        url = "/nova/hypervisor/spawns?start=" + self.valid_start + \
            "&end=" + self.valid_end + \
            "&interval=" + self.valid_interval + \
            "&render=false"
        self._test_no_render_success(url)

    def test_no_start(self):
        logger.info('[test_no_start] end = %s', self.valid_end)
        logger.info('[test_no_start] interval = %s',
                    self.valid_interval)
        url = "/nova/hypervisor/spawns?end=" + self.valid_end + \
            "&interval=" + self.valid_interval + \
            "&render=false"
        self._test_no_render_bad_request(url)

    def test_no_end(self):
        logger.info('[test_no_end] start = %s', self.valid_start)
        logger.info('[test_no_end] interval = %s',
                    self.valid_interval)
        url = "/nova/hypervisor/spawns?start=" + self.valid_start + \
            "&interval=" + self.valid_interval + \
            "&render=false"
        self._test_no_render_bad_request(url)

    def test_no_interval(self):
        logger.info('[test_no_interval] start = %s', self.valid_start)
        logger.info('[test_no_interval] end = %s', self.valid_end)
        url = "/nova/hypervisor/spawns?start=" + self.valid_start + \
            "&end=" + self.valid_end + \
            "&render=false"
        self._test_no_render_bad_request(url)

    def test_invalid_start(self):
        logger.info('[test_invalid_start] start = %s', self.invalid_start)
        logger.info('[test_invalid_start] end = %s', self.valid_end)
        logger.info('[test_invalid_start] interval = %s',
                    self.valid_interval)
        url = "/nova/hypervisor/spawns?start=" + self.invalid_start + \
            "&end=" + self.valid_end + \
            "&interval=" + self.valid_interval + \
            "&render=false"
        self._test_no_render_bad_request(url)

    def test_invalid_finish(self):
        logger.info('[test_invalid_finish] start = %s', self.valid_start)
        logger.info('[test_invalid_finish] end = %s', self.invalid_end)
        logger.info('[test_invalid_finish] interval = %s',
                    self.valid_interval)
        url = "/nova/hypervisor/spawns?start=" + self.valid_start + \
            "&end=" + self.invalid_end + \
            "&interval=" + self.valid_interval + \
            "&render=false"
        self._test_no_render_bad_request(url)

    def test_invalid_interval(self):
        logger.info('[test_invalid_interval] start = %s', self.valid_start)
        logger.info('[test_invalid_interval] end = %s', self.valid_end)
        logger.info('[test_invalid_interval] interval = %s',
                    self.invalid_interval)
        url = "/nova/hypervisor/spawns?start=" + self.valid_start + \
            "&end=" + self.valid_end + \
            "&interval=" + self.invalid_interval + \
            "&render=false"
        self._test_no_render_bad_request(url)

    def test_invalid_render(self):
        url = "/nova/hypervisor/spawns?start=" + self.valid_start + \
            "&end=" + self.valid_end + \
            "&interval=" + self.valid_interval + \
            "&render=xyz"
        self._test_no_render_bad_request(url)
