# Copyright '2014' Solinea, Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
from uuid import uuid4
from django.test import SimpleTestCase
from elasticsearch import Elasticsearch
from elasticsearch.client import IndicesClient
from mock import patch, PropertyMock, MagicMock, Mock
import mock
import pytz
from rest_framework import status
from rest_framework.renderers import JSONRenderer
from rest_framework.test import APISimpleTestCase
from goldstone.apps.core import tasks
from goldstone.apps.core.views import NodeViewSet
from models import *
from serializers import *
from datetime import datetime
import logging
import subprocess

__author__ = 'stanford'

logger = logging.getLogger(__name__)


class TaskTests(SimpleTestCase):

    def test_delete_indices(self):
        # tests that delete indices returns result of check_call
        tasks.check_call = mock.Mock(return_value='mocked')
        self.assertEqual(tasks._delete_indices('abc', 10), 'mocked')

    @patch.object(IndicesClient, 'create')
    @patch.object(IndicesClient, 'exists_alias')
    @patch.object(IndicesClient, 'update_aliases')
    @patch.object(IndicesClient, 'put_alias')
    def test_create_daily_index(self, put_alias, update_aliases, exists_alias,
                                create):

        create.side_effect = None
        exists_alias.return_value = True
        update_aliases.return_value = "mocked True"
        self.assertEqual(tasks._create_daily_index('abc', 'abc'),
                         "mocked True")

        exists_alias.return_value = False
        put_alias.return_value = "mocked False"
        self.assertEqual(tasks._create_daily_index('abc', 'abc'),
                         "mocked False")

    def test_manage_es_indices(self):
        tasks._create_daily_index = mock.Mock(
            side_effect=KeyError("This is expected"))
        tasks._delete_indices = mock.Mock(
            side_effect=KeyError("This is expected"))
        self.assertEqual(tasks.manage_es_indices(), (False, False, False))

        tasks._create_daily_index = mock.Mock(return_value=None,
                                              side_effect=None)
        tasks._delete_indices = mock.Mock(return_value=None,
                                          side_effect=None)
        self.assertEqual(tasks.manage_es_indices(), (True, True, True))


class EntityTests(SimpleTestCase):

    def setUp(self):

        Entity.objects.get_or_create(name="entity 1")
        Entity.objects.get_or_create(name="entity 2")
        Entity.objects.get_or_create(name="entity 3")

        Project.objects.get_or_create(name="project 1")
        Project.objects.get_or_create(name="project 2")

        Resource.objects.get_or_create(name="resource 1")
        Resource.objects.get_or_create(name="resource 2",
                                       last_seen=datetime.now(tz=pytz.utc))

        Node.objects.get_or_create(name="node 1")
        Node.objects.get_or_create(name="node 2")

        Service.objects.get_or_create(name="service 1")
        Service.objects.get_or_create(name="service 2")

        Event.objects.get_or_create(event_type="type 1")
        Event.objects.get_or_create(event_type="type 2")
        Event.objects.get_or_create(event_type="type 3")

    def tearDown(self):
        # When using Entity.objects.all().delete(), we have a strange situation
        # where the tests pass locally, but fail on the jenkins server.  See
        # https://solinea.atlassian.net/browse/GOLD-433 for details, and use
        # this form for deleting.
        for obj in Entity.objects.iterator():
            obj.delete()
        for obj in Project.objects.iterator():
            obj.delete()
        for obj in Resource.objects.iterator():
            obj.delete()
        for obj in Node.objects.iterator():
            obj.delete()
        for obj in Service.objects.iterator():
            obj.delete()
        for obj in Event.objects.iterator():
            obj.delete()

    def test_entity_relation(self):
        entity1 = Entity.objects.get(name="entity 1")
        entity2 = Entity.objects.get(name="entity 2")
        entity3 = Entity.objects.get(name="entity 3")
        event1 = Event.objects.get(event_type="type 1")
        event2 = Event.objects.get(event_type="type 2")

        # add relationships to entity and event
        result = entity1.add_entity_rel(entity2, "has")
        self.assertIsInstance(result, Entity2EntityRel)
        result = entity1.add_entity_rel(entity3, "has")
        self.assertIsInstance(result, Entity2EntityRel)
        result = entity1.add_event_rel(event1, "saw")
        self.assertIsInstance(result, Entity2EventRel)
        result = entity1.add_event_rel(event2, "saw")
        self.assertIsInstance(result, Entity2EventRel)

        # get forward relationships
        entity_rels = entity1.get_entity_rels("has")
        self.assertEqual(entity_rels.count(), 2)
        self.assertIsInstance(entity_rels[0], Entity)
        self.assertIsInstance(entity_rels[1], Entity)
        self.assertIn(entity2, entity_rels)
        self.assertIn(entity3, entity_rels)

        # get backward relationships
        related_entities = entity2.get_related_entities("has")
        self.assertEqual(related_entities.count(), 1)
        self.assertIn(entity1, related_entities)
        entity3.add_entity_rel(entity2, "has")
        related_entities = entity2.get_related_entities("has")
        self.assertEqual(related_entities.count(), 2)
        self.assertIn(entity1, related_entities)
        self.assertIn(entity3, related_entities)

        # get forward event relationships
        event_rels = entity1.get_event_rels("saw")
        self.assertEqual(event_rels.count(), 2)
        self.assertIsInstance(event_rels[0], Event)
        self.assertIsInstance(event_rels[1], Event)
        self.assertIn(event1, event_rels)
        self.assertIn(event2, event_rels)

        # get backward event relationships
        # related_entities = event1.get_related_events("saw")
        # self.asssertEqual("", related_entities)
        # self.assertEqual(related_entities.count(), 2)
        # self.assertIn(event1, related_entities)
        # self.assertIn(event2, related_entities)

        # delete a related object and make sure relation is cleaned up
        entity3.remove_entity_rel(entity2, "has")
        entity1_rels = entity1.get_entity_rels("has")
        self.assertIn(entity2, entity1_rels)

        entity2.add_entity_rel(entity3, "has")
        entity3_related = entity3.get_related_entities("has")
        self.assertIn(entity2, entity3_related)

        Entity.objects.get(uuid=entity2.uuid).delete()
        entity1_rels = entity1.get_entity_rels("has")
        self.assertNotIn(entity2, entity1_rels)

        entity3_related = entity3.get_related_entities("has")
        self.assertNotIn(entity2, entity3_related)

        entity1_event_rels = entity1.get_event_rels("saw")
        self.assertIn(event1, entity1_event_rels)
        Event.objects.get(uuid=event1.uuid).delete()
        entity1_event_rels = entity1.get_event_rels("saw")
        self.assertNotIn(event1, entity1_event_rels)

        # delete relationships
        entity1_rels = entity1.get_entity_rels("has")
        self.assertIn(entity3, entity1_rels)
        entity1.remove_entity_rel(entity3, "has")
        entity1_rels = entity1.get_entity_rels("has")
        self.assertNotIn(entity3, entity1_rels)

        entity1_event_rels = entity1.get_event_rels("saw")
        self.assertIn(event2, entity1_event_rels)
        entity1.remove_event_rel(event2, "saw")
        entity1_event_rels = entity1.get_event_rels("saw")
        self.assertNotIn(event2, entity1_event_rels)

    def test_polymorphism(self):
        entities = Entity.objects.all()
        self.assertEqual(entities.count(), 11)

        projects = Project.objects.all()
        self.assertEqual(projects.count(), 2)

        resources = Resource.objects.all()
        self.assertEqual(resources.count(), 4)

        services = Service.objects.all()
        self.assertEqual(services.count(), 2)

        nodes = Node.objects.all()
        self.assertEqual(nodes.count(), 2)

        events = Event.objects.all()
        self.assertEqual(events.count(), 3)

    def test_unicode(self):
        e1 = Entity.objects.get(name="entity 1")
        u = e1.__unicode__()
        self.assertDictContainsSubset({"name": "entity 1"}, json.loads(u))
        self.assertIn('uuid', json.loads(u))

        p1 = Project.objects.get(name="project 1")
        u = p1.__unicode__()
        self.assertDictContainsSubset({"name": "project 1"}, json.loads(u))
        self.assertIn('version', json.loads(u))

        r1 = Resource.objects.get(name="resource 1")
        u = r1.__unicode__()
        self.assertDictContainsSubset({"name": "resource 1"}, json.loads(u))
        self.assertIn('last_seen', json.loads(u))
        self.assertEqual(u'', json.loads(u)['last_seen'])
        self.assertIn('last_seen_method', json.loads(u))
        self.assertIn('admin_disabled', json.loads(u))
        r2 = Resource.objects.get(name="resource 2")
        u = r2.__unicode__()
        self.assertIn('last_seen', json.loads(u))
        self.assertNotEqual(u'', json.loads(u)['last_seen'])


class EventTests(SimpleTestCase):

    def setUp(self):

        Entity.objects.get_or_create(name="entity 1")
        Entity.objects.get_or_create(name="entity 2")
        Node.objects.get_or_create(name="node 1")

        Event.objects.get_or_create(event_type="type 1", message="message 1")
        Event.objects.get_or_create(event_type="type 2", message="message 2")
        Event.objects.get_or_create(event_type="type 3", message="message 3")

    def tearDown(self):

        for obj in Entity.objects.iterator():
            obj.delete()

        for obj in Node.objects.iterator():
            obj.delete()

        for obj in Event.objects.iterator():
            obj.delete()

    def test_entity_relation(self):
        event1 = Event.objects.get(event_type="type 1")
        event2 = Event.objects.get(event_type="type 2")
        event3 = Event.objects.get(event_type="type 3")
        entity1 = Entity.objects.get(name="entity 1")
        entity2 = Entity.objects.get(name="entity 2")
        node1 = Node.objects.get(name="node 1")

        # create event to event relation
        r1 = event1.add_event_rel(event2, "related_event")
        r2 = event1.add_event_rel(event3, "related_event")
        r3 = event3.add_event_rel(event2, "related_event")
        self.assertIsInstance(r1, Event2EventRel)
        self.assertIsInstance(r2, Event2EventRel)
        self.assertIsInstance(r3, Event2EventRel)

        # created entity to event relation
        r1 = entity1.add_event_rel(event1, "saw")
        r2 = entity2.add_event_rel(event1, "saw")
        self.assertIsInstance(r1, Entity2EventRel)
        self.assertIsInstance(r2, Entity2EventRel)

        # get forward event 2 event relationships
        event1_event_rels = event1.get_event_rels("related_event")
        self.assertIn(event2, event1_event_rels)
        self.assertIn(event3, event1_event_rels)
        event3_event_rels = event3.get_event_rels("related_event")
        self.assertIn(event2, event3_event_rels)

        # get backward event 2 event relationships
        event2_related_events = event2.get_related_events("related_event")
        self.assertIn(event1, event2_related_events)
        self.assertIn(event3, event2_related_events)

        # get event 2 entity relationships
        event1_event_rels = event1.get_event_rels("saw")
        self.assertIn(entity1, event1_event_rels)
        self.assertIn(entity2, event1_event_rels)

        # delete a related object and make sure relation is cleaned up
        event3.remove_event_rel(event2, "related_event")
        event1_event_rels = event1.get_event_rels("related_event")
        self.assertIn(event2, event1_event_rels)

        event2.add_event_rel(event3, "related_event")
        event3_related_events = event3.get_related_events("related_event")
        self.assertIn(event2, event3_related_events)

        Event.objects.get(uuid=event2.uuid).delete()
        event1_event_rels = event1.get_event_rels("related_event")
        self.assertNotIn(event2, event1_event_rels)

        event3_related_events = event3.get_related_events("related_event")
        self.assertNotIn(event2, event3_related_events)


class NodeSerializerTests(SimpleTestCase):
    name1 = "test_node_123"
    name2 = "test_node_456"
    name3 = "test_node_789"
    node1 = Node(name=name1)

    def setUp(self):

        self.node1.save()

    def tearDown(self):
        for obj in Node.objects.iterator():
            obj.delete()

    def test_serializer(self):
        ser = NodeSerializer(self.node1)
        j = JSONRenderer().render(ser.data)
        logger.debug('[test_serializer] node1 json = %s', j)
        self.assertNotIn('id', ser.data)
        self.assertIn('name', ser.data)
        self.assertIn('created', ser.data)
        self.assertIn('updated', ser.data)
        self.assertIn('admin_disabled', ser.data)
        self.assertIn('last_seen_method', ser.data)
        self.assertIn('last_seen', ser.data)
        self.assertIn('uuid', ser.data)


class NodeViewTests(APISimpleTestCase):
    name1 = "test_node_123"
    name2 = "test_node_456"
    name3 = "test_node_789"
    name4 = "test_node_987"
    node1 = Node(name=name1)
    node2 = Node(name=name2, admin_disabled=True)
    node3 = Node(name=name3, admin_disabled=True)
    node4 = Node(name=name4)

    def setUp(self):
        self.node1.save()
        self.node2.save()
        self.node3.save()
        self.node4.save()

    def tearDown(self):
        for obj in Node.objects.iterator():
            obj.delete()

    def test_get_list(self):
        response = self.client.get('/core/nodes')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 4)

    def test_get_enabled(self):
        response = self.client.get('/core/nodes?admin_disabled=False')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)
        self.assertFalse(response.data['results'][0]['admin_disabled'])
        self.assertFalse(response.data['results'][1]['admin_disabled'])

    def test_get_disabled(self):
        response = self.client.get('/core/nodes?admin_disabled=True')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)
        self.assertTrue(response.data['results'][0]['admin_disabled'])
        self.assertTrue(response.data['results'][1]['admin_disabled'])

    def test_patch_disable(self):
        response = self.client.get('/core/nodes?admin_disabled=False')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)
        self.assertFalse(response.data['results'][0]['admin_disabled'])
        uuid = response.data['results'][0]['uuid']
        response = self.client.patch('/core/nodes/' + uuid + '/disable')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        response = self.client.get('/core/nodes/' + uuid)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['admin_disabled'])

    def test_patch_enable(self):
        response = self.client.get('/core/nodes?admin_disabled=True')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)
        self.assertTrue(response.data['results'][0]['admin_disabled'])
        uuid = response.data['results'][0]['uuid']
        response = self.client.patch('/core/nodes/' + uuid + '/enable')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        response = self.client.get('/core/nodes/' + uuid)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['admin_disabled'])

    def test_delete_fail(self):
        response = self.client.get('/core/nodes?admin_disabled=False')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)
        self.assertFalse(response.data['results'][0]['admin_disabled'])
        uuid = response.data['results'][0]['uuid']
        response = self.client.delete('/core/nodes/' + uuid)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        response = self.client.get('/core/nodes/' + uuid)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_delete_succeed(self):
        response = self.client.get('/core/nodes?admin_disabled=True')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)
        self.assertTrue(response.data['results'][0]['admin_disabled'])
        uuid = response.data['results'][0]['uuid']
        response = self.client.delete('/core/nodes/' + uuid)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        response = self.client.get('/core/nodes/' + uuid)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_post_fail(self):
        data = {'name': 'test123'}
        response = self.client.post('/core/nodes', data=data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_put_fail(self):
        response = self.client.get('/core/nodes')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 4)
        uuid = response.data['results'][0]['uuid']
        data = response.data['results'][0]
        data['name'] = 'test123'
        response = self.client.put('/core/nodes/' + uuid, data=data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_partial_update_fail(self):
        response = self.client.get('/core/nodes')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 4)
        uuid = response.data['results'][0]['uuid']
        data = {'name': 'test123'}
        response = self.client.patch('/core/nodes/' + uuid, data=data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
