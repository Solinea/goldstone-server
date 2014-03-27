# vim: tabstop=4 shiftwidth=4 softtabstop=4

#
# Copyright 2014 Solinea, Inc.
#

from django.test import TestCase
from .models import *
import os
import gzip
from datetime import datetime
import pytz


logger = logging.getLogger(__name__)


class AvailabilityZoneDataModel(TestCase):
    start = datetime(2014, 3, 12, 0, 0, 0, tzinfo=pytz.utc)
    end = datetime.now(tz=pytz.utc)
    azd = AvailabilityZoneData()
    id_to_delete = None

    def setUp(self):
        # test post of a record
        rec = {"@timestamp": self.end.isoformat(),
               "zones": "availabilty_zone_test"}
        self.id_to_delete = self.azd.post(rec)
        self.assertIsNotNone(self.id_to_delete)

    def tearDown(self):
        # test delete of a record
        response = self.azd.delete(self.id_to_delete)
        self.assertTrue(response)

    def test_get(self):
        recs = self.azd.get(1)
        self.assertEqual(len(recs), 1)

    def test_get_range(self):
        recs = self.azd.get_date_range(self.start, self.end)
        self.assertGreater(len(recs), 0)



class SpawnDataModel(TestCase):
    start = datetime(2014, 3, 12, 0, 0, 0, tzinfo=pytz.utc)
    end = datetime.now(tz=pytz.utc)
    interval = '1h'
    sd = SpawnData(start, end, interval)

    def test_spawn_start_query(self):
        import goldstone.apps.intelligence.models

        q = self.sd._spawn_start_query()
        self.assertEqual(q['query']['range'],
                         goldstone.apps.intelligence.models._query_range(
                             '@timestamp',
                             self.start.isoformat(),
                             self.end.isoformat())['range'])
        self.assertEqual(
            q['aggs'],
            goldstone.apps.intelligence.models._agg_date_hist(self.interval))

    def test_spawn_finish_query(self):
        import goldstone.apps.intelligence.models

        q = self.sd._spawn_finish_query(True)
        self.assertEqual(
            q['query']['range'],
            goldstone.apps.intelligence.models._query_range(
                '@timestamp',
                self.start.isoformat(),
                self.end.isoformat())['range'])
        self.assertDictEqual(
            q['aggs']['success_filter']['aggs'],
            goldstone.apps.intelligence.models._agg_date_hist(self.interval))
        self.assertDictEqual(
            q['aggs']['success_filter']['filter'],
            goldstone.apps.intelligence.models._agg_filter_term(
                "success", "true",
                "success_filter")['success_filter']['filter'])
        q = self.sd._spawn_finish_query(False)
        self.assertDictEqual(
            q['aggs']['success_filter']['filter'],
            goldstone.apps.intelligence.models._agg_filter_term(
                "success", "false",
                "success_filter")['success_filter']['filter'])

    def test_get_spawn_start(self):
        sd = SpawnData(self.start, self.end, self.interval)
        response = sd.get_spawn_start()
        self.assertEqual(False, response.empty)
        # test for an empty response
        sd.start = datetime.now(tz=pytz.utc)
        sd.end = datetime.now(tz=pytz.utc)
        sd.interval = "1s"
        response = sd.get_spawn_start()
        logger.debug("response = %s", response)
        self.assertEqual(True, response.empty)

    def test_get_spawn_finish(self):
        sd = SpawnData(self.start, self.end, self.interval)
        response = sd._get_spawn_finish(True)
        self.assertEqual(False, response.empty)
        # test for an empty response
        sd.start = datetime.now(tz=pytz.utc)
        sd.end = datetime.now(tz=pytz.utc)
        sd.interval = "1s"
        response = sd.get_spawn_start()
        self.assertEqual(True, response.empty)

    def test_get_spawn_success(self):
        sd = SpawnData(self.start, self.end, self.interval)
        response = sd.get_spawn_success()
        control = sd._get_spawn_finish(True)
        self.assertTrue(response.equals(control))

    def test_get_spawn_failure(self):
        sd = SpawnData(self.start, self.end, self.interval)
        response = sd.get_spawn_failure()
        control = sd._get_spawn_finish(False)
        self.assertTrue(response.equals(control))
