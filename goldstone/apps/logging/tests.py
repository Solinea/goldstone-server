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
from elasticsearch import TransportError, Elasticsearch

__author__ = 'John Stanford'

import json
from time import sleep
from django.http import HttpResponse
from rest_framework import status
from rest_framework.renderers import JSONRenderer
from rest_framework.test import APISimpleTestCase
from django.test import SimpleTestCase
import logging
from datetime import timedelta
from .tasks import *
from .tasks import _create_event
from goldstone.apps.core.models import Node
from mock import *

logger = logging.getLogger(__name__)


class TaskTests(SimpleTestCase):
    name1 = "test_node_123"
    name2 = "test_node_456"
    name3 = "test_node_789"
    ts1 = '2015-07-04T01:06:27.750046+00:00'
    ts2 = '2015-07-04T01:06:27.750046+00:00'
    ts3 = '2013-07-04T01:06:27.750046+00:00'

    def setUp(self):
        es = Elasticsearch(settings.ES_SERVER)
        if es.indices.exists('goldstone_model'):
            es.indices.delete('goldstone_model')
        es.indices.create('goldstone_model')

    def test_process_host_stream(self):
        # administratively enabled
        node1 = Node(name=self.name1, admin_disabled=False)
        node1.save()
        NodeType.refresh_index()
        self.assertEqual(Node.es_objects.all().count(), 1)
        # get the object to get consistent date resolution
        node1 = Node.get(id=node1.id)
        sleep(1)
        process_host_stream(self.name1, self.ts1)
        NodeType.refresh_index()
        self.assertEqual(Node.es_objects.all().count(), 1)
        updated_node1 = Node.get(id=node1.id)
        self.assertGreater(updated_node1.updated, node1.updated)

        # administratively disabled
        node2 = Node(name=self.name2, admin_disabled=True)
        node2.save()
        NodeType.refresh_index()
        node2 = Node.get(id=node2.id)
        sleep(1)
        process_host_stream(self.name2, self.ts2)
        NodeType.refresh_index()
        updated_node2 = Node.get(id=node2.id)
        self.assertEqual(updated_node2.updated, node2.updated)
        Node.get(id=node1.id).delete()
        Node.get(id=node2.id).delete()

    @patch.object(subprocess, 'call')
    def test_check_host_avail(self, call):
        node1 = Node(name=self.name1)
        node2 = Node(name=self.name2, admin_disabled=True)
        node3 = Node(name=self.name3)
        node3.save()
        node2.save()
        sleep(2)
        node1.save()
        NodeType.refresh_index()

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
        NodeType.refresh_index()
        event2 = _create_event(time_str, 'fake_node', "Syslog Error",
                               'test message 2')
        EventType.refresh_index()
        self.assertEqual(event2.created, arrow.get(time_str).datetime)
        self.assertEqual(event2.message, "test message 2")
        self.assertEqual(event2.event_type, "Syslog Error")
        logger.info("event2.source_name = %s", event2.source_name)
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
