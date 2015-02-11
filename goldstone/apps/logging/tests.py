"""Logging tests."""
# Copyright 2014 - 2015 Solinea, Inc.
#
# Licensed under the Solinea Software License Agreement (goldstone),
# Version 1.0 (the "License"); you may not use this file except in compliance
# with the License. You may obtain a copy of the License at:
#
#     http://www.solinea.com/goldstone/LICENSE.pdf
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either expressed or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
import arrow
from datetime import timedelta
import logging
import subprocess

from django.test import SimpleTestCase
from rest_framework import status
from rest_framework.test import APISimpleTestCase
from time import sleep
from mock import patch

from goldstone.apps.core.models import Node, EventType
from goldstone.apps.logging.serializers import LoggingNodeSerializer
from goldstone.apps.logging.views import LoggingNodeViewSet
from goldstone.utils import utc_now
from .tasks import process_host_stream, _create_event, ping, check_host_avail

logger = logging.getLogger(__name__)


class TaskTests(SimpleTestCase):
    name1 = "test_node_123"
    name2 = "test_node_456"
    name3 = "test_node_789"
    ts1 = '2015-07-04T01:06:27.750046+00:00'
    ts2 = '2015-07-04T01:06:27.750046+00:00'
    ts3 = '2013-07-04T01:06:27.750046+00:00'

    def setUp(self):
        Node.objects.all().delete()

    def tearDown(self):
        Node.objects.all().delete()

    def test_process_host_stream(self):

        # administratively enabled
        node1 = Node(name=self.name1, managed='true')
        node1.save()
        self.assertEqual(Node.objects.all().count(), 1)

        # get the object to get consistent date resolution
        node1 = Node.objects.get(name=node1.name)
        sleep(1)
        process_host_stream(self.name1, self.ts1)
        self.assertEqual(Node.objects.all().count(), 1)

        updated_node1 = Node.objects.get(id=node1.id)
        self.assertGreater(updated_node1.updated, node1.updated)

        # administratively disabled
        node2 = Node(name=self.name2, managed='false')
        node2.save()
        node2 = Node.objects.get(name=node2.name)
        self.assertEqual(node2.update_method, 'UNKNOWN')

        process_host_stream(self.name2, self.ts2)
        updated_node2 = Node.objects.get(id=node2.id)
        self.assertEqual(updated_node2.updated, node2.updated)
        self.assertEqual(node2.update_method, 'UNKNOWN')
        self.assertEqual(updated_node2.managed, 'false')

        # creation
        process_host_stream('xyz', self.ts2)
        node = Node.objects.get(name='xyz')
        self.assertEqual(node.update_method, 'LOGS')

    @patch.object(subprocess, 'call')
    def test_check_host_avail(self, call):

        node1 = Node(name=self.name1)
        node2 = Node(name=self.name2, managed='false')
        node3 = Node(name=self.name3)
        node3.save()
        node2.save()
        sleep(2)
        node1.save()

        check_host_avail(offset=timedelta(seconds=2))
        call.assert_called_once()

    def test_create_event(self):
        time_str = arrow.utcnow().isoformat()
        event1 = _create_event(time_str, 'not_found_node', "Syslog Error",
                               'test message',)
        self.assertEqual(event1.created, arrow.get(time_str).datetime)
        self.assertEqual(event1.message, "test message")
        self.assertEqual(event1.event_type, "Syslog Error")
        self.assertEqual(event1.source_id, "")
        self.assertEqual(event1.source_name, "")

        # create a logging node to relate
        node = Node(name="fake_node")
        node.save()
        event2 = _create_event(time_str, 'fake_node', "Syslog Error",
                               'test message 2')
        EventType.refresh_index()
        self.assertEqual(event2.created, arrow.get(time_str).datetime)
        self.assertEqual(event2.message, "test message 2")
        self.assertEqual(event2.event_type, "Syslog Error")
        logger.debug("event2.source_name = %s", event2.source_name)
        self.assertEqual(event2.source_name, "fake_node")

    @patch.object(subprocess, 'call')
    def test_ping(self, call):
        node1 = Node(name=self.name1)
        node1.save()
        node2 = Node(name=self.name2)
        node2.save()
        call.return_value = 0
        result = ping(node1)
        self.assertTrue(result)
        call.return_value = 1
        result = ping(node2)
        self.assertFalse(result)


class LoggingNodeSerializerTests(SimpleTestCase):

    node1 = Node(name='test_node')

    def setUp(self):
        Node.objects.all().delete()
        self.node1.save()

    def tearDown(self):
        Node.objects.all().delete()

    def test_serialize(self):
        ser = LoggingNodeSerializer(
            self.node1, context={'start_time': arrow.utcnow(),
                                 'end_time': arrow.utcnow()})

        self.assertEqual(ser.data['id'], self.node1.id)
        self.assertEqual(ser.data['name'],
                         self.node1.name)
        self.assertIn('error_count', ser.data)
        self.assertIn('warning_count', ser.data)
        self.assertIn('info_count', ser.data)
        self.assertIn('audit_count', ser.data)
        self.assertIn('debug_count', ser.data)


class LoggingNodeViewTests(APISimpleTestCase):

    def setUp(self):
        Node.objects.all().delete()

    def test_post(self):
        data = {'name': "test logging node"}
        response = self.client.post('/logging/nodes', data=data)
        self.assertEqual(response.status_code,
                         status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_put(self):
        data = {'name': "test logging node"}
        response = self.client.put('/logging/nodes', data=data)
        self.assertEqual(response.status_code,
                         status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_patch(self):
        data = {'name': "test logging node"}
        response = self.client.patch('/logging/nodes', data=data)
        self.assertEqual(response.status_code,
                         status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_delete(self):
        response = self.client.put('/logging/nodes/12345-67890')
        self.assertEqual(response.status_code,
                         status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_set_time_range(self):
        """Test get_request_time_range."""

        lnvs = LoggingNodeViewSet()

        start = utc_now()
        end = utc_now()

        time_range = lnvs.get_request_time_range({'start_time': start,
                                                  'end_time': end})

        self.assertEqual(time_range['start_time'], start)
        self.assertEqual(time_range['end_time'], end)

    def test_list(self):
        from django.conf import settings

        # Create 20 nodes.
        for i in range(0, 20):
            node = Node(name="node"+str(i))
            node.save()

        self.assertEqual(20, Node.objects.all().count())

        response = self.client.get('/logging/nodes')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 20)
        self.assertEqual(len(response.data['results']),
                         settings.REST_FRAMEWORK['PAGINATE_BY'])

    def test_get(self):

        node = Node(name="node1")
        node.save()

        response = self.client.get('/logging/nodes/' + node.id)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('name', response.data)
        self.assertEqual(node.name, response.data['name'])
