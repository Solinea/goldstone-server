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
        # test returns false if an exception creating index
        create.side_effect = KeyError("this is expected")
        self.assertRaises(KeyError, tasks._create_daily_index, 'abc', 'abc')

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


class ModelTests(SimpleTestCase):

# All of the direct entity stuff is commented out.  We have a strange situation
# where the tests pass locally, but fail on the jenkins server.  See
# https://solinea.atlassian.net/browse/GOLD-433 for details.
    def setUp(self):

        # Entity.objects.get_or_create(name="entity 1")
        # Entity.objects.get_or_create(name="entity 2")

        Project.objects.get_or_create(name="project 1")
        Project.objects.get_or_create(name="project 2")

        Resource.objects.get_or_create(name="resource 1")
        Resource.objects.get_or_create(name="resource 2",
                                       last_seen=datetime.now(tz=pytz.utc))

        Node.objects.get_or_create(name="node 1")
        Node.objects.get_or_create(name="node 2")

        Service.objects.get_or_create(name="service 1")
        Service.objects.get_or_create(name="service 2")

    def tearDown(self):
        # logger.info("in teardown, entity count = %d",
        # Entity.objects.all().count())
        # for e in Entity.objects.all():
        #     if hasattr(e, 'entity_ptr'):
        #         logger.info("entity %s has entity_ptr", e.name)
        #     else:
        #         logger.info("entity %s does not have entity_ptr", e.name)

        # Entity.objects.all().delete()
        Project.objects.all().delete()
        Resource.objects.all().delete()
        Node.objects.all().delete()
        Service.objects.all().delete()

    # def test_entity_relation(self):
    #     e1 = Entity.objects.get(name="entity 1")
    #     e2 = Entity.objects.get(name="entity 2")
    #     e1.add_relationship(e2, "has")
    #
    #     e1_rels = e1.get_relationships("has")
    #     self.assertEqual(e1_rels.count(), 1)
    #     self.assertEqual(e1_rels[0], e2)
    #
    #     e1_rel_tos = e1.get_related_to("has")
    #     self.assertEqual(e1_rel_tos.count(), 0)
    #
    #     e2_rel_tos = e2.get_related_to("has")
    #     self.assertEqual(e2_rel_tos.count(), 1)
    #     self.assertEqual(e2_rel_tos[0], e1)
    #
    #     e1.remove_relationship(e2, "has")

    def test_polymorphism(self):
        # entities = Entity.objects.all()
        # self.assertEqual(entities.count(), 10)

        projects = Project.objects.all()
        self.assertEqual(projects.count(), 2)

        resources = Resource.objects.all()
        self.assertEqual(resources.count(), 4)

        services = Service.objects.all()
        self.assertEqual(services.count(), 2)

        nodes = Node.objects.all()
        self.assertEqual(nodes.count(), 2)

    def test_unicode(self):
        # e1 = Entity.objects.get(name="entity 1")
        # u = e1.__unicode__()
        # self.assertDictContainsSubset({"name": "entity 1"}, json.loads(u))
        # self.assertIn('uuid', json.loads(u))

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


class NodeSerializerTests(SimpleTestCase):
    name1 = "test_node_123"
    name2 = "test_node_456"
    name3 = "test_node_789"
    node1 = Node(name=name1)

    def setUp(self):

        self.node1.save()

    def tearDown(self):
        Node.objects.all().delete()

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
        Node.objects.all().delete()

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
