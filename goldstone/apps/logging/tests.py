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
from rest_framework.test import APISimpleTestCase

__author__ = 'John Stanford'

from django.test import SimpleTestCase
import logging
import uuid
import redis
from datetime import timedelta
from .tasks import *
from .models import *
from .serializers import *
from mock import patch

logger = logging.getLogger(__name__)


class TaskTests(SimpleTestCase):
    name1 = "test_node_123"
    name2 = "test_node_456"
    name3 = "test_node_789"
    ts1 = '2015-07-04T01:06:27.750046+00:00'
    ts2 = '2015-07-04T01:06:27.750046+00:00'
    ts3 = '2013-07-04T01:06:27.750046+00:00'

    @patch.object(redis.StrictRedis, 'set')
    @patch.object(LoggingNode, 'get')
    def test_process_host_stream(self, get, set):

        # administratively enabled
        node1 = LoggingNode(self.name1, self.ts1, disabled=False)
        set.return_value = None
        get.return_value = node1
        result = process_host_stream(self.name1, self.ts1)
        self.assertTrue(set.called)
        self.assertEqual(result.name, node1.name)
        self.assertEqual(result.timestamp, node1.timestamp)
        self.assertEqual(result.method, node1.method)
        self.assertEqual(result.disabled, node1.disabled)
        self.assertEqual(result._deleted, node1._deleted)

        # administratively disabled
        node2 = LoggingNode(self.name2, self.ts2, disabled=True)
        get.return_value = node2
        result = process_host_stream(self.name2, self.ts2)
        self.assertEqual(result, set.return_value)

    @patch.object(redis.StrictRedis, 'set')
    @patch.object(redis.StrictRedis, 'mget')
    @patch.object(redis.StrictRedis, 'keys')
    def test_check_host_avail(self, keys, mget, set):
        set.return_value = None
        now = datetime.now(tz=pytz.utc)
        last_year = now - timedelta(days=365)
        node1 = LoggingNode(self.name1)
        node2 = LoggingNode(self.name2)
        node3 = LoggingNode(self.name3, last_year.isoformat())
        keys.return_value = ['host_stream.nodes.' + self.name1,
                             'host_stream.nodes.' + self.name2,
                             'host_stream.nodes.' + self.name3]
        mget.return_value = [node1.__repr__(),
                             node2.__repr__(),
                             node3.__repr__()]

        result = check_host_avail()
        self.assertTrue(keys.called)
        self.assertTrue(mget.called)
        self.assertNotIn(node1, result)
        self.assertNotIn(node2, result)
        self.assertEqual(node3, result[0])

    @patch.object(redis.StrictRedis, 'set')
    @patch.object(subprocess, 'call')
    def test_ping(self, call, set):
        now = datetime.now(tz=pytz.utc)
        last_year = now - timedelta(days=365)
        set.return_value = "something"
        node1 = LoggingNode(self.name1)
        node2 = LoggingNode(self.name2)
        call.return_value = 0
        result = ping(node1)
        self.assertTrue(result)
        call.return_value = 1
        result = ping(node2)
        self.assertFalse(result)


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
    ts3 = '2016-07-04T01:06:27.750046+00:00'

    @patch.object(redis.StrictRedis, 'set')
    def test_init(self, set):
        set.return_value = None
        node1 = LoggingNode(self.name1, self.ts1)
        node2 = LoggingNode(self.name2, self.ts2, 'ping')
        node3 = LoggingNode(self.name3, self.ts3, disabled=True)
        self.assertEqual(set.call_count, 3)

        self.assertEqual(node1.name, self.name1)
        self.assertEqual(node2.name, self.name2)
        self.assertEqual(node3.name, self.name3)

        self.assertEqual(node1.timestamp, self.ts1)
        self.assertEqual(node2.timestamp, self.ts2)
        self.assertEqual(node3.timestamp, self.ts3)

        self.assertEqual(node1.method, 'log_stream')
        self.assertEqual(node2.method, 'ping')
        self.assertEqual(node3.method, 'log_stream')

        self.assertEqual(node1.disabled, False)
        self.assertEqual(node2.disabled, False)
        self.assertEqual(node3.disabled, True)

    @patch.object(redis.StrictRedis, 'keys')
    @patch.object(redis.StrictRedis, 'mget')
    @patch.object(redis.StrictRedis, 'set')
    def test_all(self, set, mget, keys):
        # No matches
        keys.return_value = []
        set.return_value = None
        nodes = LoggingNode.all()
        self.assertEqual(nodes, [])
        node1 = LoggingNode(self.name1, self.ts1)
        node2 = LoggingNode(self.name2, self.ts2, 'ping')
        node3 = LoggingNode(self.name3, self.ts3, disabled=True)
        keys.return_value = ['host_stream.nodes.' + self.name1,
                             'host_stream.nodes.' + self.name2,
                             'host_stream.nodes.' + self.name3]
        mget.return_value = [node1.__repr__(),
                             node2.__repr__(),
                             node3.__repr__()]
        nodes = LoggingNode.all()
        self.assertEqual(len(nodes), 3)
        self.assertIsInstance(nodes[0], LoggingNode)
        self.assertEqual(nodes[0].name, self.name1)
        self.assertEqual(nodes[1].name, self.name2)

    @patch.object(redis.StrictRedis, 'set')
    @patch.object(redis.StrictRedis, 'get')
    def test_get(self, get, set):
        set.return_value = None
        node1 = LoggingNode(self.name1, self.ts1)
        node2 = LoggingNode(self.name2, self.ts2)
        get.return_value = node1.__repr__()
        get_wl1 = LoggingNode.get(self.name1)
        get.return_value = node2.__repr__()
        get_bl1 = LoggingNode.get(self.name2)
        self.assertEqual(get_wl1.name, self.name1)
        self.assertEqual(get_bl1.name, self.name2)
        self.assertEqual(get_wl1.timestamp, self.ts1)
        self.assertEqual(get_bl1.timestamp, self.ts2)
        get.return_value = None
        get_none = LoggingNode.get(self.name1)
        self.assertEqual(get_none, None)

    @patch.object(redis.StrictRedis, 'set')
    @patch.object(redis.StrictRedis, 'get')
    def test_update(self, get, set):
        set.return_value = None
        node1 = LoggingNode(self.name1, self.ts1)
        get.return_value = node1.__repr__()
        self.assertEqual(node1.method, 'log_stream')
        node1 = node1.update(method='ping')
        self.assertEqual(node1.method, 'ping')
        node1 = node1.update(disabled=True)
        self.assertEqual(node1.disabled, True)
        node1.update(timestamp=self.ts2)
        self.assertEqual(node1.timestamp, self.ts2)

    @patch.object(redis.StrictRedis, 'delete')
    @patch.object(redis.StrictRedis, 'set')
    def test_delete(self, set, delete):
        set.return_value = None
        node1 = LoggingNode(self.name1, self.ts1)
        node2 = LoggingNode(self.name3)
        self.assertFalse(node1._deleted)
        self.assertFalse(node2._deleted)
        self.assertTrue(node1.timestamp is not None)
        self.assertTrue(node2.timestamp is not None)
        delete.return_value = None
        node1.delete()
        node2.delete()
        self.assertTrue(node1._deleted)
        self.assertTrue(node2._deleted)
        self.assertTrue(node1.timestamp is None)
        self.assertTrue(node2.timestamp is None)

    @patch.object(redis.StrictRedis, 'set')
    def test_repr(self, set):
        set.return_value = None
        wl1 = LoggingNode(self.name1, self.ts1)
        self.assertEqual(str(wl1), json.dumps({'name': self.name1,
                                               'timestamp': self.ts1,
                                               'method': 'log_stream',
                                               'disabled': False,
                                               '_deleted': False}))
        wl1._deleted = True
        self.assertEqual(str(wl1), json.dumps({'name': self.name1,
                                               'timestamp': self.ts1,
                                               'method': 'log_stream',
                                               'disabled': False,
                                               '_deleted': True}))

    @patch.object(redis.StrictRedis, 'delete')
    @patch.object(redis.StrictRedis, 'set')
    @patch.object(redis.StrictRedis, 'get')
    def test_ts(self, get, set, delete):
        set.return_value = None
        delete.return_value = None
        get.return_value = 'whatever'
        wl1 = LoggingNode(self.name1, self.ts1)
        self.assertNotEqual(wl1.timestamp, None)
        wl1.delete()
        self.assertEqual(wl1.timestamp, None)

    @patch.object(redis.StrictRedis, 'set')
    @patch.object(redis.StrictRedis, 'delete')
    @patch.object(redis.StrictRedis, 'get')
    def test_disable(self, get, delete, set):
        get.return_value = "whatever"
        delete.return_vale = None
        set.return_value = None
        node1 = LoggingNode(self.name1, self.ts1)
        result = node1.update(disabled=True)
        self.assertIsInstance(result, LoggingNode)
        self.assertEqual(result.name, self.name1)
        self.assertEqual(result.timestamp, self.ts1)
        self.assertFalse(result._deleted)
        self.assertTrue(result.disabled)
        self.assertEqual(set.called, True)

    @patch.object(redis.StrictRedis, 'set')
    @patch.object(redis.StrictRedis, 'delete')
    @patch.object(redis.StrictRedis, 'get')
    def test_enable(self, get, delete, set):
        get.return_value = "whatever"
        delete.return_vale = None
        set.return_value = None
        node1 = LoggingNode(self.name1, self.ts1, disabled=True)
        self.assertTrue(node1.disabled)
        result = node1.update(disabled=False)
        self.assertIsInstance(result, LoggingNode)
        self.assertEqual(result.name, self.name1)
        self.assertEqual(result.timestamp, self.ts1)
        self.assertFalse(result._deleted)
        self.assertEqual(set.called, True)
        self.assertFalse(result.disabled)


class LoggingNodeSerializerTests(SimpleTestCase):
    name1 = "test_node_123"
    name2 = "test_node_456"
    name3 = "test_node_789"
    ts1 = '2014-07-04T01:06:27.750046+00:00'
    ts2 = '2015-07-04T01:06:27.750046+00:00'

    @patch.object(redis.StrictRedis, 'set')
    @patch.object(redis.StrictRedis, 'delete')
    def test_serializer(self, delete, set):
        set.return_value = None
        delete.return_value = None
        wl1 = LoggingNode(self.name1, self.ts1)
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


class ViewTests(APISimpleTestCase):
    name1 = "test_node_123"
    name2 = "test_node_456"
    name3 = "test_node_789"
    name4 = "test_node_987"
    ts1 = '2014-07-04T01:06:27.750046+00:00'
    ts2 = '2015-07-04T01:06:27.750046+00:00'
    ts3 = '2016-07-04T01:06:27.750046+00:00'
    ts4 = '2016-07-04T01:06:27.750046+00:00'

    @patch.object(redis.StrictRedis, 'set')
    @patch.object(redis.StrictRedis, 'keys')
    @patch.object(redis.StrictRedis, 'mget')
    def test_get_all(self, mget, keys, set):
        node1 = LoggingNode(self.name1, self.ts1)
        node2 = LoggingNode(self.name2, self.ts2, disabled=True)
        node3 = LoggingNode(self.name3, self.ts3, disabled=True)
        node4 = LoggingNode(self.name4, self.ts4)

        set.return_value = None
        keys.return_value = ['host_stream.nodes.' + self.name1,
                             'host_stream.nodes.' + self.name2,
                             'host_stream.nodes.' + self.name3,
                             'host_stream.nodes.' + self.name4]
        mget.return_value = [node1.__repr__(),
                             node2.__repr__(),
                             node3.__repr__(),
                             node4.__repr__()]

        response = self.client.get('/logging/nodes')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 4)
        self.assertEqual(response.data[0]['name'], self.name1)
        self.assertEqual(response.data[0]['timestamp'], self.ts1)
        self.assertEqual(response.data[1]['name'], self.name2)
        self.assertEqual(response.data[1]['timestamp'], self.ts2)
        self.assertTrue(response.data[1]['disabled'])
        self.assertTrue(response.data[2]['disabled'])

    @patch.object(redis.StrictRedis, 'set')
    @patch.object(redis.StrictRedis, 'keys')
    @patch.object(redis.StrictRedis, 'mget')
    def test_get_disabled(self, mget, keys, set):
        node1 = LoggingNode(self.name1, self.ts1)
        node2 = LoggingNode(self.name2, self.ts2, disabled=True)
        node3 = LoggingNode(self.name3, self.ts3, disabled=True)
        node4 = LoggingNode(self.name4, self.ts4)

        set.return_value = None
        keys.return_value = ['host_stream.nodes.' + self.name1,
                             'host_stream.nodes.' + self.name2,
                             'host_stream.nodes.' + self.name3,
                             'host_stream.nodes.' + self.name4]
        mget.return_value = [node1.__repr__(),
                             node2.__repr__(),
                             node3.__repr__(),
                             node4.__repr__()]

        response = self.client.get('/logging/nodes?disabled=True')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        self.assertEqual(response.data[0]['name'], self.name2)
        self.assertEqual(response.data[0]['timestamp'], self.ts2)
        self.assertEqual(response.data[1]['name'], self.name3)
        self.assertEqual(response.data[1]['timestamp'], self.ts3)
        self.assertTrue(response.data[0]['disabled'])
        self.assertTrue(response.data[1]['disabled'])

    @patch.object(redis.StrictRedis, 'set')
    @patch.object(redis.StrictRedis, 'keys')
    @patch.object(redis.StrictRedis, 'mget')
    def test_get_enabled(self, mget, keys, set):
        node1 = LoggingNode(self.name1, self.ts1)
        node2 = LoggingNode(self.name2, self.ts2, disabled=True)
        node3 = LoggingNode(self.name3, self.ts3, disabled=True)
        node4 = LoggingNode(self.name4, self.ts4)

        set.return_value = None
        keys.return_value = ['host_stream.nodes.' + self.name1,
                             'host_stream.nodes.' + self.name2,
                             'host_stream.nodes.' + self.name3,
                             'host_stream.nodes.' + self.name4]
        mget.return_value = [node1.__repr__(),
                             node2.__repr__(),
                             node3.__repr__(),
                             node4.__repr__()]

        response = self.client.get('/logging/nodes?disabled=False')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        self.assertEqual(response.data[0]['name'], self.name1)
        self.assertEqual(response.data[0]['timestamp'], self.ts1)
        self.assertEqual(response.data[1]['name'], self.name4)
        self.assertEqual(response.data[1]['timestamp'], self.ts4)
        self.assertFalse(response.data[0]['disabled'])
        self.assertFalse(response.data[1]['disabled'])

    @patch.object(redis.StrictRedis, 'set')
    @patch.object(redis.StrictRedis, 'keys')
    @patch.object(redis.StrictRedis, 'mget')
    def test_get_misspelled(self, mget, keys, set):
        node1 = LoggingNode(self.name1, self.ts1)
        node2 = LoggingNode(self.name2, self.ts2, disabled=True)
        node3 = LoggingNode(self.name3, self.ts3, disabled=True)
        node4 = LoggingNode(self.name4, self.ts4)

        set.return_value = None
        keys.return_value = ['host_stream.nodes.' + self.name1,
                             'host_stream.nodes.' + self.name2,
                             'host_stream.nodes.' + self.name3,
                             'host_stream.nodes.' + self.name4]
        mget.return_value = [node1.__repr__(),
                             node2.__repr__(),
                             node3.__repr__(),
                             node4.__repr__()]

        response = self.client.get('/logging/nodes?disabled=xyz')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)

    @patch.object(redis.StrictRedis, 'set')
    @patch.object(redis.StrictRedis, 'get')
    @patch.object(LoggingNode, 'get')
    def test_update_disabled(self, lget, get, set):
        node1 = LoggingNode(self.name1, self.ts1)
        lget.return_value = node1
        set.return_value = None
        get.return_value = node1.__repr__()
        data = node1
        data.disabled = True
        response = self.client.put('/logging/nodes/' + self.name1,
                                   json.loads(data.__repr__()))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['disabled'], unicode('True'))

        lget.return_value = None
        response = self.client.put('/logging/nodes/xyz',
                                   json.loads(data.__repr__()))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    @patch.object(LoggingNode, 'get')
    @patch.object(redis.StrictRedis, 'set')
    @patch.object(redis.StrictRedis, 'delete')
    def test_delete_enabled(self, delete, set, get):
        node1 = LoggingNode(self.name1, self.ts1)
        set.return_value = "whatever"
        delete.return_value = True
        get.return_value = node1

        response = self.client.delete('/logging/nodes/' + self.name1)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    @patch.object(LoggingNode, 'get')
    @patch.object(redis.StrictRedis, 'set')
    @patch.object(redis.StrictRedis, 'delete')
    def test_delete_disabled(self, delete, set, get):
        node2 = LoggingNode(self.name2, self.ts2, disabled=True)
        set.return_value = "whatever"
        delete.return_value = True
        get.return_value = node2
        response = self.client.delete('/logging/nodes/' + self.name2)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    @patch.object(LoggingNode, 'get')
    @patch.object(redis.StrictRedis, 'set')
    def test_get_found(self, set, get):
        set.return_value = "whatever"
        node1 = LoggingNode(self.name1, self.ts1)
        get.return_value = node1
        response = self.client.get('/logging/nodes/' + self.name1)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertDictEqual(response.data, json.loads(node1.__repr__()))

    @patch.object(LoggingNode, 'get')
    @patch.object(redis.StrictRedis, 'set')
    def test_get_not_found(self, set, get):
        set.return_value = "whatever"
        node1 = LoggingNode(self.name1, self.ts1)
        get.return_value = None
        response = self.client.get('/logging/nodes/' + self.name1)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
