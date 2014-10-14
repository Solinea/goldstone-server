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
from goldstone.models import GSConnection
from models import *
from serializers import *
from datetime import datetime
import logging
import arrow

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

        Resource.objects.get_or_create(name="resource 1")
        Resource.objects.get_or_create(name="resource 2",
                                       last_seen=datetime.now(tz=pytz.utc))

        Node.objects.get_or_create(name="node 1")
        Node.objects.get_or_create(name="node 2")

    def tearDown(self):
        # When using Entity.objects.all().delete(), we have a strange situation
        # where the tests pass locally, but fail on the jenkins server.  See
        # https://solinea.atlassian.net/browse/GOLD-433 for details, and use
        # this form for deleting.
        for obj in Entity.objects.iterator():
            obj.delete()
        for obj in Resource.objects.iterator():
            obj.delete()
        for obj in Node.objects.iterator():
            obj.delete()

    def test_polymorphism(self):
        entities = Entity.objects.all()
        self.assertEqual(entities.count(), 7)

        resources = Resource.objects.all()
        self.assertEqual(resources.count(), 4)

        nodes = Node.objects.all()
        self.assertEqual(nodes.count(), 2)

    def test_unicode(self):
        e1 = Entity.objects.get(name="entity 1")
        u = e1.__unicode__()
        self.assertDictContainsSubset({"name": "entity 1"}, json.loads(u))
        self.assertIn('uuid', json.loads(u))

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


class EventModelTests(SimpleTestCase):

    def setUp(self):
        # delete the goldstone_model index, then recreate it
        conn = GSConnection().conn
        conn.indices.delete('goldstone_model')
        conn.indices.create('goldstone_model')

    def test_event_instantiation(self):
        # without source id
        e1 = Event("test_type", "test_message")
        self.assertEqual(e1.event_type, "test_type")
        self.assertEqual(e1.message, "test_message")
        self.assertIsNotNone(e1.id)
        self.assertEqual(e1.created, e1.updated)
        self.assertEqual("", e1.source_id)

        # with source id
        sid = uuid4()
        e2 = Event("test_type", "test_message", source_id=sid)
        self.assertNotEqual("", e2.source_id)

    def test_single_event_index_unindex(self):
        e1 = Event("test_type", "test_message")
        id_str = str(e1.id)
        e1.save()
        EventType.refresh_index(index='goldstone_model')
        search_result = Event.search(id=id_str)
        self.assertEqual(len(search_result), 1)
        e1.delete()
        EventType.refresh_index(index='goldstone_model')
        search_result = Event.search(id=id_str)
        self.assertEqual(len(search_result), 0)


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


class EventSerializerTests(SimpleTestCase):
    event1 = Event(event_type='test_serializer',
                   message='testing serialization')

    def setUp(self):
        self.event1.save()
        EventType.refresh_index()
        self.event1 = Event.search(_id=self.event1.id)[0].get_object()

    def tearDown(self):
        try:
            self.event1.delete()
        except:
            pass

    def test_serializer(self):
        ser = EventSerializer(self.event1)
        j = JSONRenderer().render(ser.data)
        logger.debug('[test_serializer] node1 json = %s', j)
        self.assertNotIn('_id', ser.data)
        self.assertIn('id', ser.data)
        self.assertIn('event_type', ser.data)
        self.assertEqual(ser.data['event_type'], 'test_serializer')
        self.assertIn('created', ser.data)
        self.assertIn('updated', ser.data)
        self.assertIn('message', ser.data)
        self.assertEqual(ser.data['message'], 'testing serialization')
        self.assertIn('source_id', ser.data)


class EventViewTests(APISimpleTestCase):

    # create the old event within the default event lookback window
    lookback = (settings.EVENT_LOOKBACK_MINUTES - 1) * -1
    old_date = arrow.utcnow().replace(minutes=lookback)
    event1 = Event(event_type='test_view',
                   message='testing old date',
                   created=old_date.isoformat())
    event2 = Event(event_type='test_view',
                   message='testing new date')

    def setUp(self):
        self.event1.save()
        self.event2.save()
        EventType.refresh_index()
        self.event1 = Event.search(_id=self.event1.id)[0].get_object()
        self.event2 = Event.search(_id=self.event2.id)[0].get_object()

    def tearDown(self):
        try:
            self.event1.delete()
            self.event2.delete()
        except:
            pass

    def test_get_list(self):
        response = self.client.get('/core/events')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        logger.debug("response.data = %s", response.data)
        self.assertEqual(len(response.data), 2)

    def test_get_list_with_start(self):
        response = self.client.get(
            '/core/events?lookback_mins=15')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_get_list_with_start_and_end(self):
        response = self.client.get(
            '/core/events?lookback_mins=2' +
            '&end_ts=' + str(self.old_date.replace(minutes=1).timestamp))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_get_succeed(self):
        response = self.client.get('/core/events/' + self.event1.id)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_get_fail(self):
        response = self.client.get('/core/events/' + str(uuid4()))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_succeed_no_exists(self):
        response = self.client.delete('/core/events/' + str(uuid4()))
        self.assertEqual(response.status_code, status.HTTP_202_ACCEPTED)

    def test_delete_succeed_exists(self):
        response = self.client.delete('/core/events/' + self.event1.id)
        self.assertEqual(response.status_code, status.HTTP_202_ACCEPTED)
        EventType.refresh_index()
        response = self.client.get('/core/events/' + self.event1.id)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_create_succeed_min(self):
        data = {
            "event_type": "external created event",
            "message": "I am your creator"
        }
        response = self.client.post('/core/events', data=data, format='json')

        logger.debug("[test_create_succeed] response.data = %s",
                     response.data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        EventType.refresh_index()
        response = self.client.get('/core/events/' + response.data['id'])
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        response = self.client.delete('/core/events/' + response.data['id'])
        self.assertEqual(response.status_code, status.HTTP_202_ACCEPTED)

    def test_create_succeed_max(self):
        d = arrow.utcnow()
        data = {
            "created": d.replace(hours=-1).isoformat(),
            "updated": d.isoformat(),
            "event_type": "external created event",
            "message": "I am your creator"
        }
        response = self.client.post('/core/events', data=data, format='json')

        logger.info("[test_create_succeed] response.data = %s",
                    response.data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        EventType.refresh_index()
        response = self.client.get('/core/events/' + response.data['id'])
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        response = self.client.delete('/core/events/' + response.data['id'])
        self.assertEqual(response.status_code, status.HTTP_202_ACCEPTED)

    def test_create_fail_date_format(self):

        data = {
            "created": 'xyzabc123',
            "event_type": "external created event",
            "message": "I am your creator"
        }
        response = self.client.post('/core/events', data=data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_fail_date_format2(self):

        data = {
            "updated": 'xyzabc123',
            "event_type": "external created event",
            "message": "I am your creator"
        }
        response = self.client.post('/core/events', data=data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_fail_date_order(self):
        d = arrow.utcnow()
        data = {
            "updated": d.replace(hours=-1).isoformat(),
            "created": d.isoformat(),
            "event_type": "external created event",
            "message": "I am your creator"
        }
        response = self.client.post('/core/events', data=data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
