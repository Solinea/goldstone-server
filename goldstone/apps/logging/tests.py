# Copyright 2014 Solinea, Inc.
#
# Licensed under the Solinea Software License Agreement (goldstone),
# Version 1.0 (the "License"); you may not use this file except in compliance
# with the License. You may obtain a copy of the License at:
#
#     http://www.solinea.com/goldstone/LICENSE.pdf
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
from django.http import HttpResponse

__author__ = 'John Stanford'

from django.test import SimpleTestCase
import logging
import uuid
import redis
from time import sleep
from goldstone.apps.logging.tasks import *
from goldstone.apps.logging.models import *
from celery.result import AsyncResult
from mock import patch, PropertyMock, MagicMock, Mock

logger = logging.getLogger(__name__)


class TaskTests(SimpleTestCase):

    @patch.object(HostAvailData, 'set')
    def test_process_host_stream(self, set):

        # test when host exists in blacklist
        set.return_value = None
        result = process_host_stream('test123',
                                     '2014-07-04T01:06:27.750046+00:00')
        self.assertTrue(set.called)
        self.assertEqual(result, set.return_value)
        # test when host is not in blacklist
        set.return_value = 'host_stream.whitelist.test123'
        result = process_host_stream('test123',
                                     '2014-07-04T01:06:27.750046+00:00')
        self.assertEqual(set.call_count, 2)
        self.assertEqual(result, set.return_value)

    @patch.object(redis.StrictRedis, 'mget')
    @patch.object(redis.StrictRedis, 'keys')
    def test_check_host_avail(self, keys, mget):
        keys.return_value = ['host_stream.whitelist.test123',
                             'host_stream.whitelist.test456',
                             'host_stream.whitelist.test789']
        now = datetime.now(tz=pytz.utc)
        last_year = now - timedelta(days=365)

        mget.return_value = [now.isoformat(),
                             now.isoformat(),
                             last_year.isoformat()]

        result = check_host_avail()
        self.assertTrue(keys.called)
        self.assertTrue(mget.called)
        self.assertNotIn('test123', result)
        self.assertNotIn('test456', result)
        self.assertIn('test789', result)


    # TODO this should be part of the integration test suite
    # def test_publish_host_stream_message(self):
    #     """
    #     Should be able to publish a message to redis and have the task
    #     receive it.
    #     """
    #     host1_name = str(uuid.uuid4())
    #     host1_time = datetime.now(tz=pytz.utc).isoformat()
    #     task_id = str(uuid.uuid1())
    #     body = {
    #         "body": json.dumps({
    #             'task': 'goldstone.apps.logging.tasks.process_host_stream',
    #             'id': task_id,
    #             'args': [host1_name, host1_time]
    #         }),
    #         "content-type": "application/json",
    #         "properties": {
    #             "delivery_info": {
    #                 "priority": 0,
    #                 "routing_key": "host_stream.#",
    #                 "exchange": "default"
    #             },
    #             "delivery_mode": 2,
    #             "delivery_tag": str(uuid.uuid4())
    #         },
    #         "content-encoding": "utf-8"
    #     }
    #     body = json.dumps(body)
    #     r = redis.StrictRedis(host='localhost', port=6379, db=0)
    #     r.lpush("host_stream", body)
    #
    #     # this should wait for the task to complete (making it synchronous)
    #     # task returns the key
    #     key = 'host_stream.whitelist.' + host1_name
    #     result = AsyncResult(task_id).get(timeout=6)
    #     self.assertEqual(result, key)
    #
    #     # the records should be stored in redis with keys of
    #     # host_stream.whitelist.hostname and values of their respective
    #     # timestamps
    #
    #     host1_redis_time = r.get(key)
    #     try:
    #         self.assertEqual(host1_time, host1_redis_time)
    #         r.delete(key)
    #     except Exception:
    #         r.delete(key)
    #         raise


    # TODO this should be part of the integration test suite
    # def test_check_host_avail(self):
    #     r = redis.StrictRedis(host='localhost', port=6379, db=0)
    #     timestamp1 = (
    #         datetime.now(tz=pytz.utc) -
    #         settings.HOST_AVAILABLE_PING_THRESHOLD -
    #         timedelta(hours=1)
    #     ).strftime("%Y-%m-%dT%H:%M:%S.000Z")
    #     timestamp2 = (
    #         datetime.now(tz=pytz.utc) -
    #         settings.HOST_AVAILABLE_PING_THRESHOLD +
    #         timedelta(hours=1)
    #     ).strftime("%Y-%m-%dT%H:%M:%S.000Z")
    #     r.set('host_stream.whitelist.test', timestamp1)
    #     r.set('host_stream.whitelist.test2', timestamp2)
    #     sleep(1)
    #     l = check_host_avail()
    #     try:
    #         self.assertIn('test', l)
    #         self.assertNotIn('test2', l)
    #         r.delete('host_stream.whitelist.test')
    #         r.delete('host_stream.whitelist.test2')
    #     except:
    #         r.delete('host_stream.whitelist.test')
    #         r.delete('host_stream.whitelist.test2')
    #         raise


class NodeListTests(SimpleTestCase):
    name1 = "test_node_123"
    name2 = "test_node_456"
    name3 = "test_node_789"
    ts1 = '2014-07-04T01:06:27.750046+00:00'
    ts2 = '2015-07-04T01:06:27.750046+00:00'

    @patch.object(WhiteListNode, 'save')
    @patch.object(BlackListNode, 'save')
    @patch.object(redis.StrictRedis, 'get')
    def test_init(self, get, black_save, white_save):
        black_save.return_value = True
        white_save.return_value = True
        wl1 = WhiteListNode(self.name1, self.ts1)
        wl2 = WhiteListNode(self.name2, self.ts2)
        bl1 = BlackListNode(self.name3)
        self.assertEqual(wl1.name, self.name1)
        self.assertEqual(wl2.name, self.name2)
        self.assertEqual(bl1.name, self.name3)
        get.return_value = '2014-07-04T01:06:27.750046+00:00'
        self.assertEqual(wl1.timestamp_str(), self.ts1)
        get.return_value = '2015-07-04T01:06:27.750046+00:00'
        self.assertEqual(wl2.timestamp_str(), self.ts2)

    @patch.object(redis.StrictRedis, 'keys')
    @patch.object(redis.StrictRedis, 'mget')
    def test_all(self, mget, keys):
        keys.return_value = ['host_stream.whitelist.' + self.name1,
                             'host_stream.whitelist.' + self.name2]
        mget.return_value = ['2014-07-04T01:06:27.750046+00:00',
                             '2015-07-04T01:06:27.750046+00:00']
        all_white = WhiteListNode.all()
        self.assertEqual(len(all_white), 2)
        self.assertIsInstance(all_white[0], WhiteListNode)
        self.assertEqual(all_white[0].name, self.name1)
        self.assertEqual(all_white[1].name, self.name2)
        keys.return_value = ['host_stream.blacklist.' + self.name3]
        mget.return_value = ['2014-07-04T01:06:27.750046+00:00']
        all_black = BlackListNode.all()
        self.assertEqual(len(all_black), 1)
        self.assertIsInstance(all_black[0], BlackListNode)
        self.assertEqual(all_black[0].name, self.name3)


class HostAvailModelTests(SimpleTestCase):

    def test_get_datalist_empty(self):
        had = HostAvailData()
        mock_conn = Mock()
        config = {'keys.return_value': []}
        mock_conn.configure_mock(**config)
        had.conn = mock_conn
        result = had._get_datalist('''host_stream.whitelist.''')
        self.assertEqual(had.conn.keys.called, True)
        self.assertListEqual(result, [])

    def test_get_datalist_whitelist(self):
        had = HostAvailData()
        mock_conn = Mock()
        config = {'keys.return_value': ['host_stream.whitelist.test123'],
                  'mget.return_value': ['2014-07-04T01:06:27.750046+00:00']}
        mock_conn.configure_mock(**config)
        had.conn = mock_conn
        result = had._get_datalist('''host_stream.whitelist.''')
        self.assertEqual(had.conn.keys.called, True)
        self.assertEqual(had.conn.mget.called, True)
        self.assertListEqual(result,
                             [{'test123': '2014-07-04T01:06:27.750046+00:00'}])

    def test_get_datalist_blacklist(self):
        had = HostAvailData()
        mock_conn = Mock()
        config = {'keys.return_value': ['host_stream.blacklist.test123',
                                        'host_stream.blacklist.test456'],
                  'mget.return_value': ['2014-07-04T01:06:27.750046+00:00',
                                        '2015-07-04T01:06:27.750046+00:00']}
        mock_conn.configure_mock(**config)
        had.conn = mock_conn
        result = had._get_datalist('''host_stream.blacklist.''')
        self.assertEqual(had.conn.keys.called, True)
        self.assertEqual(had.conn.mget.called, True)
        self.assertListEqual(result,
                             [{'test123': '2014-07-04T01:06:27.750046+00:00'},
                              {'test456': '2015-07-04T01:06:27.750046+00:00'}])

    def test_get_all(self):
        rv = [{'test123': '2014-07-04T01:06:27.750046+00:00'},
              {'test456': '2015-07-04T01:06:27.750046+00:00'}]
        had = HostAvailData()
        mock_get_datalist = Mock(return_value=rv)
        had._get_datalist = mock_get_datalist
        result = had.get_all()
        self.assertEqual(had._get_datalist.call_count, 2)
        self.assertDictEqual(result, {'whitelist': rv, 'blacklist': rv})

    def test_set(self):
        had = HostAvailData()
        mock_conn = Mock()
        # already exists in the blacklist, set whitelist
        config = {'exists.return_value': True,
                  'set.return_value': 'do not care'}
        mock_conn.configure_mock(**config)
        had.conn = mock_conn
        result = had.set('test123', datetime.now(tz=pytz.utc).isoformat())
        self.assertTrue(had.conn.exists.called)
        self.assertFalse(had.conn.set.called)
        self.assertEqual(result, None)

        # not in the blacklist, set whitelist
        config = {'exists.return_value': False,
                  'set.return_value': 'do not care'}
        mock_conn.configure_mock(**config)
        had.conn = mock_conn
        result = had.set('test123', datetime.now(tz=pytz.utc).isoformat())
        self.assertTrue(had.conn.set.called)
        self.assertEqual(result, 'host_stream.whitelist.test123')

        # already exists in the whitelist, set blacklist
        config = {'exists.return_value': True,
                  'set.return_value': 'do not care'}
        mock_conn.configure_mock(**config)
        had.conn = mock_conn
        result = had.set('test123',
                         datetime.now(tz=pytz.utc).isoformat(),
                         'black')
        self.assertEqual(result, None)

         # not in the whitelist, set blacklist
        config = {'exists.return_value': False,
                  'set.return_value': 'do not care'}
        mock_conn.configure_mock(**config)
        had.conn = mock_conn
        result = had.set('test123',
                         datetime.now(tz=pytz.utc).isoformat(),
                         'black')
        self.assertEqual(result, 'host_stream.blacklist.test123')

    @patch.object(redis.StrictRedis, 'set')
    @patch.object(redis.StrictRedis, 'get')
    @patch.object(HostAvailData, 'delete')
    def test_to_blacklist(self, delete, get, set):
        had = HostAvailData()
        # test when host exists in whitelist
        get.return_value = 'host_stream.whitelist.test123'
        set.return_value = 'host_stream.blacklist.test123'
        delete.return_value = None
        result = had.to_blacklist('test123')
        self.assertTrue(set.called)
        self.assertTrue(get.called)
        self.assertTrue(delete.called)
        self.assertEqual(result, set.return_value)
        # test when host is not in blacklist


class ViewTests(SimpleTestCase):

    @patch.object(HostAvailData, 'get_all')
    def test_get_agents(self, get_all):
        rv = [
            {'test123': '2014-07-04T01:06:27.750046+00:00'},
            {'test456': '2015-07-04T01:06:27.750046+00:00'}
        ]
        get_all.return_value = {'whitelist': rv, 'blacklist': rv}
        response = self.client.get("/logging/report/host_availability")
        self.assertTrue(get_all.called)
        self.assertIsInstance(response, HttpResponse)
        self.assertNotEqual(response.content, None)
        try:
            j = json.loads(response.content)
        except:
            self.fail("Could not convert content to JSON")
        else:
            self.assertIsInstance(j, dict)
            self.assertTrue('status' in j)
            self.assertTrue('data' in j)
            self.assertDictEqual(j['data'], get_all.return_value)
