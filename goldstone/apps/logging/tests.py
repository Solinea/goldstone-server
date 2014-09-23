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
import json
from time import sleep
from django.http import HttpResponse
from rest_framework import status
from rest_framework.renderers import JSONRenderer
from rest_framework.test import APISimpleTestCase

__author__ = 'John Stanford'

from django.test import SimpleTestCase
import logging
from datetime import timedelta
from .tasks import *
from .tasks import _create_event
from goldstone.apps.core.models import Node
from mock import patch

logger = logging.getLogger(__name__)


class TaskTests(SimpleTestCase):
    name1 = "test_node_123"
    name2 = "test_node_456"
    name3 = "test_node_789"
    ts1 = '2015-07-04T01:06:27.750046+00:00'
    ts2 = '2015-07-04T01:06:27.750046+00:00'
    ts3 = '2013-07-04T01:06:27.750046+00:00'

    def tearDown(self):
        for obj in Node.objects.iterator():
            obj.delete()
        for obj in Event.objects.iterator():
            obj.delete()

    def test_process_host_stream(self):
        # administratively enabled
        node1 = Node(name=self.name1, admin_disabled=False)
        node1.save()
        # get the object to get consistent date resolution
        node1 = Node.objects.get(uuid=node1.uuid)
        sleep(1)
        process_host_stream(self.name1, self.ts1)
        updated_node1 = Node.objects.get(uuid=node1.uuid)
        self.assertGreater(updated_node1.updated, node1.updated)

        # administratively disabled
        node2 = Node(name=self.name2, admin_disabled=True)
        node2.save()
        node2 = Node.objects.get(uuid=node2.uuid)
        sleep(1)
        process_host_stream(self.name2, self.ts2)
        updated_node2 = Node.objects.get(uuid=node2.uuid)
        self.assertEqual(updated_node2.updated, node2.updated)
        Node.objects.get(uuid=node1.uuid).delete()
        Node.objects.get(uuid=node2.uuid).delete()

    def test_check_host_avail(self):
        now = datetime.now(tz=pytz.utc)
        last_year = now - timedelta(days=365)
        node1 = Node(name=self.name1)
        node2 = Node(name=self.name2, admin_disabled=True)
        node3 = Node(name=self.name3)
        node3.save()
        node2.save()
        sleep(2)
        node1.save()
        result = check_host_avail(offset=timedelta(seconds=2))
        self.assertNotIn(node1, result)
        self.assertNotIn(node2, result)
        self.assertIn(node3, result)
        Node.objects.get(uuid=node1.uuid).delete()
        Node.objects.get(uuid=node2.uuid).delete()
        Node.objects.get(uuid=node3.uuid).delete()

    def test_create_event(self):
        timestamp = arrow.utcnow().__str__()
        event1 = _create_event(timestamp, 'not_found_node', 'test message',
                               "Syslog Error")
        self.assertEqual(event1.created, arrow.get(timestamp).datetime)
        self.assertEqual(event1.message, "test message")
        self.assertEqual(event1.name, "Syslog Error")
        self.assertEqual(len(event1.get_relationships("source")), 0)
        self.assertEqual(len(event1.get_relationships("affects")), 0)

        # create a logging node to relate
        node = LoggingNode(name="fake_node")
        node.save()
        event2 = _create_event(timestamp, 'fake_node', 'test message 2',
                               "Syslog Error")
        self.assertEqual(event2.created, arrow.get(timestamp).datetime)
        self.assertEqual(event2.message, "test message 2")
        self.assertEqual(event2.name, "Syslog Error")
        self.assertEqual(len(event2.get_relationships("source")), 1)
        self.assertEqual(len(event2.get_relationships("affects")), 1)
        saved_event = LoggingEvent.objects.get(message="test message 2")
        self.assertEqual(len(saved_event.get_relationships("source")), 1)
        self.assertEqual(len(saved_event.get_relationships("affects")), 1)




    @patch.object(subprocess, 'call')
    def test_ping(self, call):
        now = datetime.now(tz=pytz.utc)
        last_year = now - timedelta(days=365)
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
