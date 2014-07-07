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
from rest_framework import status
from rest_framework.test import APIClient, APISimpleTestCase

__author__ = 'John Stanford'

from django.test import SimpleTestCase
import logging
import uuid
import redis
from time import sleep
from .tasks import *
from .models import *
from .serializers import *
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

    @patch.object(redis.StrictRedis, 'set')
    def test_init(self, set):
        set.return_value = None
        wl1 = WhiteListNode(self.name1, self.ts1)
        wl2 = WhiteListNode(self.name2, self.ts2)
        self.assertEqual(set.called, True)
        bl1 = BlackListNode(self.name3)
        self.assertEqual(wl1.name, self.name1)
        self.assertEqual(wl2.name, self.name2)
        self.assertEqual(bl1.name, self.name3)
        self.assertEqual(wl1.timestamp, self.ts1)
        self.assertEqual(wl2.timestamp, self.ts2)

    @patch.object(redis.StrictRedis, 'keys')
    @patch.object(redis.StrictRedis, 'mget')
    @patch.object(redis.StrictRedis, 'set')
    def test_all(self, set, mget, keys):

        # index not set / calling from superclass
        keys.side_effect = TypeError()
        with self.assertRaises(Exception):
            WhiteListNode.all()
        keys.side_effect = None
        keys.return_value = []
        set.return_value = None
        all_white = WhiteListNode.all()
        self.assertEqual(all_white, [])
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

    @patch.object(redis.StrictRedis, 'set')
    @patch.object(redis.StrictRedis, 'get')
    def test_get(self, get, set):
        set.return_value = None
        WhiteListNode(self.name1, self.ts1)
        BlackListNode(self.name2, self.ts2)
        get.return_value = self.ts1
        get_wl1 = WhiteListNode.get(self.name1)
        get.return_value = self.ts2
        get_bl1 = BlackListNode.get(self.name2)
        self.assertEqual(get_wl1.name, self.name1)
        self.assertEqual(get_bl1.name, self.name2)
        self.assertEqual(get_wl1.timestamp, self.ts1)
        self.assertEqual(get_bl1.timestamp, self.ts2)

    @patch.object(redis.StrictRedis, 'delete')
    @patch.object(redis.StrictRedis, 'set')
    def test_delete(self, set, delete):
        set.return_value = None
        wl1 = WhiteListNode(self.name1, self.ts1)
        bl1 = BlackListNode(self.name3)
        self.assertFalse(wl1._deleted)
        self.assertFalse(bl1._deleted)
        self.assertTrue(wl1.timestamp is not None)
        self.assertTrue(bl1.timestamp is not None)
        delete.return_value = None
        wl1.delete()
        bl1.delete()
        self.assertTrue(wl1._deleted)
        self.assertTrue(bl1._deleted)
        self.assertTrue(wl1.timestamp is None)
        self.assertTrue(bl1.timestamp is None)

    def test_superclass_all(self):
        with self.assertRaises(RuntimeError):
            LoggingNode._all(self.name1, self.ts1)

    @patch.object(redis.StrictRedis, 'set')
    def test_repr(self, set):
        set.return_value = None
        wl1 = WhiteListNode(self.name1, self.ts1)
        self.assertEqual(str(wl1), json.dumps({'name': self.name1,
                                               'timestamp': self.ts1}))
        wl1._deleted = True
        self.assertEqual(str(wl1), json.dumps({'name': self.name1,
                                               'deleted': True}))

    @patch.object(redis.StrictRedis, 'delete')
    @patch.object(redis.StrictRedis, 'set')
    @patch.object(redis.StrictRedis, 'get')
    def test_ts(self, get, set, delete):
        set.return_value = None
        delete.return_value = None
        get.return_value = '2014-07-04T01:06:27.750046+00:00'
        wl1 = WhiteListNode(self.name1, self.ts1)
        self.assertNotEqual(wl1.timestamp, None)
        wl1.delete()
        self.assertEqual(wl1.timestamp, None)

    @patch.object(redis.StrictRedis, 'set')
    @patch.object(redis.StrictRedis, 'delete')
    @patch.object(redis.StrictRedis, 'get')
    def test_to_blacklist(self, get, delete, set):
        get.return_value = self.ts1
        delete.return_vale = None
        set.return_value = None
        wl1 = WhiteListNode(self.name1, self.ts1)
        result = wl1.to_blacklist()
        self.assertIsInstance(result, BlackListNode)
        self.assertEqual(result.name, self.name1)
        self.assertEqual(result.timestamp, self.ts1)
        self.assertFalse(result._deleted)
        self.assertEqual(delete.called, True)
        self.assertEqual(set.called, True)
        self.assertTrue(wl1._deleted)
        self.assertEqual(wl1.timestamp, None)
        get.return_value = None
        wl2 = WhiteListNode(self.name2, self.ts2)
        with self.assertRaises(Exception):
            wl2.to_blacklist()

    @patch.object(redis.StrictRedis, 'set')
    @patch.object(redis.StrictRedis, 'delete')
    @patch.object(redis.StrictRedis, 'get')
    def test_to_whitelist(self, get, delete, set):
        get.return_value = self.ts1
        delete.return_vale = None
        set.return_value = None
        bl1 = BlackListNode(self.name1, self.ts1)
        result = bl1.to_whitelist()
        self.assertIsInstance(result, WhiteListNode)
        self.assertEqual(result.name, self.name1)
        self.assertEqual(result.timestamp, self.ts1)
        self.assertFalse(result._deleted)
        self.assertEqual(delete.called, True)
        self.assertEqual(set.called, True)
        self.assertTrue(bl1._deleted)
        self.assertEqual(bl1.timestamp, None)
        get.return_value = None
        bl2 = BlackListNode(self.name2, self.ts2)
        with self.assertRaises(Exception):
            bl2.to_whitelist()

class LoggingNodeSerializerTests(SimpleTestCase):
    name1 = "test_node_123"
    name2 = "test_node_456"
    name3 = "test_node_789"
    ts1 = '2014-07-04T01:06:27.750046+00:00'
    ts2 = '2015-07-04T01:06:27.750046+00:00'

    @patch.object(redis.StrictRedis, 'set')
    @patch.object(redis.StrictRedis, 'delete')
    def test_white_serializer(self, delete, set):
        set.return_value = None
        delete.return_value = None
        wl1 = WhiteListNode(self.name1, self.ts1)
        self.assertTrue(set.called)
        serializer = LoggingNodeSerializer(wl1)
        self.assertIn('name', serializer.data)
        self.assertIn('timestamp', serializer.data)
        self.assertIn('_deleted', serializer.data)
        self.assertEqual(serializer.data['name'], self.name1)
        self.assertEqual(serializer.data['timestamp'], self.ts1)
        self.assertEqual(serializer.data['_deleted'], False)
        wl1.delete()
        self.assertTrue(delete.called)
        serializer = LoggingNodeSerializer(wl1)
        self.assertEqual(serializer.data['_deleted'], True)

    @patch.object(redis.StrictRedis, 'set')
    @patch.object(redis.StrictRedis, 'delete')
    def test_black_serializer(self, delete, set):
        set.return_value = None
        delete.return_value = None
        bl1 = BlackListNode(self.name1, self.ts1)
        serializer = LoggingNodeSerializer(bl1)
        self.assertIn('name', serializer.data)
        self.assertIn('timestamp', serializer.data)
        self.assertIn('_deleted', serializer.data)
        self.assertEqual(serializer.data['name'], self.name1)
        self.assertEqual(serializer.data['timestamp'], self.ts1)
        self.assertEqual(serializer.data['_deleted'], False)


class ViewTests(APISimpleTestCase):
    name1 = "test_node_123"
    name2 = "test_node_456"
    name3 = "test_node_789"
    ts1 = '2014-07-04T01:06:27.750046+00:00'
    ts2 = '2015-07-04T01:06:27.750046+00:00'

    @patch.object(redis.StrictRedis, 'set')
    @patch.object(redis.StrictRedis, 'keys')
    @patch.object(redis.StrictRedis, 'mget')
    def test_get_whitelist(self, mget, keys, set):
        set.return_value = None
        keys.return_value = ['host_stream.whitelist.' + self.name1,
                             'host_stream.whitelist.' + self.name2]
        mget.return_value = [self.ts1,
                             self.ts2]
        WhiteListNode(self.name1, self.ts1)
        WhiteListNode(self.name2, self.ts2)
        response = self.client.get('/logging/whitelist/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        self.assertEqual(response.data[0]['name'], self.name1)
        self.assertEqual(response.data[0]['timestamp'], self.ts1)
        self.assertEqual(response.data[1]['name'], self.name2)
        self.assertEqual(response.data[1]['timestamp'], self.ts2)

    @patch.object(redis.StrictRedis, 'set')
    @patch.object(redis.StrictRedis, 'keys')
    @patch.object(redis.StrictRedis, 'mget')
    def test_get_blacklist(self, mget, keys, set):
        set.return_value = None
        keys.return_value = ['host_stream.blacklist.' + self.name1,
                             'host_stream.blacklist.' + self.name2]
        mget.return_value = [self.ts1,
                             self.ts2]
        BlackListNode(self.name1, self.ts1)
        BlackListNode(self.name2, self.ts2)
        response = self.client.get('/logging/blacklist/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        self.assertEqual(response.data[0]['name'], self.name1)
        self.assertEqual(response.data[0]['timestamp'], self.ts1)
        self.assertEqual(response.data[1]['name'], self.name2)
        self.assertEqual(response.data[1]['timestamp'], self.ts2)
