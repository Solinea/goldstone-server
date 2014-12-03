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
from time import sleep
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
from goldstone.apps.core.views import ElasticViewSetMixin
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
        update_aliases.return_value = None
        self.assertEqual(tasks._create_daily_index('abc', 'abc'),
                         None)

        exists_alias.return_value = False
        put_alias.return_value = None
        self.assertEqual(tasks._create_daily_index('abc', 'abc'),
                         None)

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
        self.assertIn('id', ser.data)
        self.assertIn('name', ser.data)
        self.assertIn('created', ser.data)
        self.assertIn('updated', ser.data)
        self.assertIn('admin_disabled', ser.data)
        self.assertIn('last_seen_method', ser.data)
        self.assertNotIn('uuid', ser.data)


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
        es = Elasticsearch(settings.ES_SERVER)
        if es.indices.exists('goldstone_model'):
            es.indices.delete('goldstone_model')
        es.indices.create('goldstone_model')

    def test_get_list(self):
        self.node1.save()
        self.node2.save()
        self.node3.save()
        self.node4.save()
        NodeType.refresh_index()
        response = self.client.get('/core/nodes')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 4)

    def test_get_enabled(self):
        self.node1.save()
        self.node2.save()
        self.node3.save()
        self.node4.save()
        NodeType.refresh_index()
        response = self.client.get('/core/nodes?admin_disabled=false')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)
        self.assertFalse(response.data['results'][0]['admin_disabled'])
        self.assertFalse(response.data['results'][1]['admin_disabled'])

    def test_get_disabled(self):
        self.node1.save()
        self.node2.save()
        self.node3.save()
        self.node4.save()
        NodeType.refresh_index()
        response = self.client.get('/core/nodes?admin_disabled=true')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)
        self.assertTrue(response.data['results'][0]['admin_disabled'])
        self.assertTrue(response.data['results'][1]['admin_disabled'])

    def test_patch_disable(self):
        self.node1.save()
        self.node2.save()
        self.node3.save()
        self.node4.save()
        NodeType.refresh_index()
        response = self.client.get('/core/nodes?admin_disabled=false')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)
        self.assertFalse(response.data['results'][0]['admin_disabled'])
        uuid = response.data['results'][0]['id']
        response = self.client.patch('/core/nodes/' + uuid + '/disable')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        NodeType.refresh_index()
        response = self.client.get('/core/nodes/' + uuid)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['admin_disabled'])

    def test_patch_enable(self):
        self.node1.save()
        self.node2.save()
        self.node3.save()
        self.node4.save()
        NodeType.refresh_index()
        response = self.client.get('/core/nodes?admin_disabled=true')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)
        self.assertTrue(response.data['results'][0]['admin_disabled'])
        id = response.data['results'][0]['id']
        response = self.client.patch('/core/nodes/' + id + '/enable')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        NodeType.refresh_index()
        response = self.client.get('/core/nodes/' + id)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        logger.info('id = %s', id)
        self.assertEqual(type(response.data['admin_disabled']), bool)
        self.assertFalse(response.data['admin_disabled'])

    def test_delete_fail(self):
        self.node1.save()
        self.node2.save()
        self.node3.save()
        self.node4.save()
        NodeType.refresh_index()
        response = self.client.get('/core/nodes?admin_disabled=true')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)
        self.assertTrue(response.data['results'][0]['admin_disabled'])
        uuid = response.data['results'][0]['id']
        response = self.client.delete('/core/nodes/' + uuid)
        self.assertEqual(response.status_code,
                         status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_post_fail(self):
        data = {'name': 'test123'}
        response = self.client.post('/core/nodes', data=data)
        self.assertEqual(response.status_code,
                         status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_put_fail(self):
        self.node1.save()
        self.node2.save()
        self.node3.save()
        self.node4.save()
        NodeType.refresh_index()
        response = self.client.get('/core/nodes')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 4)
        uuid = response.data['results'][0]['id']
        data = response.data['results'][0]
        data['name'] = 'test123123'
        response = self.client.put('/core/nodes/' + uuid, data=data)
        self.assertEqual(response.status_code,
                         status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_partial_update_fail(self):
        self.node1.save()
        self.node2.save()
        self.node3.save()
        self.node4.save()
        NodeType.refresh_index()
        response = self.client.get('/core/nodes')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 4)
        uuid = response.data['results'][0]['id']
        data = {'name': 'test123'}
        response = self.client.patch('/core/nodes/' + uuid, data=data)
        self.assertEqual(response.status_code,
                         status.HTTP_405_METHOD_NOT_ALLOWED)


class NodeModelTests(SimpleTestCase):

    name1 = "test_node_123"
    name2 = "test_node_456"
    name3 = "test_node_789"
    name4 = "test_node_987"
    # node1 = Node(name=name1)
    # node2 = Node(name=name2, admin_disabled=True)
    # node3 = Node(name=name3, admin_disabled=True)
    # node4 = Node(name=name4)

    def setUp(self):
        es = Elasticsearch(settings.ES_SERVER)
        if es.indices.exists('goldstone_model'):
            es.indices.delete('goldstone_model')
        es.indices.create('goldstone_model')

    def test_create_model(self):
        n1 = Node(name=self.name1)
        self.assertIsNotNone(n1.id)
        self.assertFalse(n1.admin_disabled)
        self.assertLess(n1.created, arrow.utcnow().datetime)
        self.assertEqual(n1.created, n1.updated)
        self.assertEqual(n1.last_seen_method, "UNKNOWN")

        n2 = Node(name=self.name2, admin_disabled=False)
        self.assertIsNotNone(n2.id)
        self.assertFalse(n2.admin_disabled)
        self.assertLess(n2.created, arrow.utcnow().datetime)
        self.assertEqual(n2.created, n2.updated)
        self.assertEqual(n2.last_seen_method, "UNKNOWN")

        n3 = Node(name=self.name3, admin_disabled=True)
        self.assertIsNotNone(n3.id)
        self.assertTrue(n3.admin_disabled)
        self.assertLess(n3.created, arrow.utcnow().datetime)
        self.assertEqual(n3.created, n3.updated)
        self.assertEqual(n3.last_seen_method, "UNKNOWN")

        updated = arrow.utcnow()
        sleep(1)
        created = updated.replace(minutes=-30)
        n4 = Node(name=self.name4, admin_disabled=True,
                  last_seen_method="PING", created=created.datetime,
                  updated=updated.datetime)
        self.assertIsNotNone(n4.id)
        self.assertTrue(n4.admin_disabled)
        self.assertEqual(n4.created, created.datetime)
        self.assertGreater(arrow.get(n4.updated).timestamp,
                           updated.timestamp)
        self.assertEqual(n4.last_seen_method, "PING")


    def test_index_and_get_model(self):
        updated = arrow.utcnow()
        created = updated.replace(minutes=-30)
        n1 = Node(name=self.name1, admin_disabled=True,
                  last_seen_method="PING", created=created.datetime,
                  updated=updated.datetime)
        sleep(1)
        n1.save()
        NodeType.refresh_index()
        self.assertEqual(Node.es_objects.all().count(), 1)
        stored = Node.get(id=n1.id)
        self.assertNotEqual(stored, None)
        self.assertEqual(stored.id, n1.id)
        self.assertEqual(stored.name, n1.name)
        self.assertEqual(stored.admin_disabled, n1.admin_disabled)
        self.assertEqual(stored.last_seen_method, n1.last_seen_method)
        # update times are maintained by the model
        self.assertGreater(arrow.get(stored.updated).timestamp,
                           updated.timestamp)
        self.assertEqual(stored.created, n1.created)

    def test_update_existing(self):
        # should have a new updated timestamp
        updated = arrow.utcnow()
        created = updated.replace(minutes=-30)
        n1 = Node(name=self.name1, admin_disabled=True,
                  last_seen_method="PING", created=created.datetime,
                  updated=updated.datetime)
        n1.save()
        NodeType.refresh_index()
        sleep(1)
        n1.save()
        NodeType.refresh_index()
        stored = Node.get(id=n1.id)
        self.assertEqual(stored.id, n1.id)
        self.assertGreater(arrow.get(stored.updated).timestamp,
                           arrow.get(n1.updated).timestamp)
        self.assertEqual(stored.created, n1.created)

    def test_delete_model(self):
        n1 = Node(name=self.name1, admin_disabled=True,
                  last_seen_method="PING")
        n1.save()
        NodeType.refresh_index()
        self.assertEqual(n1.es_objects.all().count(), 1)
        n1.delete()
        NodeType.refresh_index()
        self.assertEqual(Node.es_objects.all().count(), 0)


class EventModelTests(SimpleTestCase):

    def setUp(self):
        es = Elasticsearch(settings.ES_SERVER)
        if es.indices.exists('goldstone_model'):
            es.indices.delete('goldstone_model')
        es.indices.create('goldstone_model')

    def test_create_model(self):
        e1 = Event(event_type='test_event', message='this is a test event')
        self.assertIsNotNone(e1.id)
        self.assertEqual(e1.source_id, "")
        self.assertEqual(e1.source_name, "")
        self.assertNotEqual(e1.id, "")
        self.assertIsNotNone(e1.created)

    def test_index_model(self):
        e1 = Event(event_type='test_event', message='this is a test event')
        e1.save()
        EventType.refresh_index()
        self.assertEqual(e1._mt.search().query().count(), 1)
        stored = e1._mt.search().query(). \
            filter(_id=e1.id)[:1]. \
            execute(). \
            objects[0]. \
            get_object()
        self.assertEqual(stored.id, e1.id)
        self.assertEqual(stored.event_type, e1.event_type)
        self.assertEqual(stored.message, e1.message)
        self.assertEqual(stored.created, e1.created)

    def test_unindex_model(self):
        e1 = Event(event_type='test_event', message='this is a test event')
        e1.save()
        EventType.refresh_index()
        self.assertEqual(e1._mt.search().query().count(), 1)
        e1.delete()
        EventType.refresh_index()
        self.assertEqual(EventType().search().query().count(), 0)


class EventTypeTests(SimpleTestCase):
    def test_get_mapping(self):
        m = EventType.get_mapping()
        self.assertIs(type(m), dict)


class EventSerializerTests(SimpleTestCase):

    event1 = Event(event_type='test_serializer',
                   message='testing serialization')

    def setUp(self):
        es = Elasticsearch(settings.ES_SERVER)
        if es.indices.exists('goldstone_model'):
            es.indices.delete('goldstone_model')
        es.indices.create('goldstone_model')
        self.event1.save()

    def test_serialize(self):
        ser = EventSerializer(self.event1)
        extract = EventType.extract_document(self.event1.id, self.event1)

        # date serialization is awkward wrt +00:00 (gets converted to Z), and
        # resolution is a mismatch from arrow, so need to compare field by
        # field
        self.assertEqual(ser.data['id'], extract['id'])
        self.assertEqual(ser.data['event_type'],
                         extract['event_type'])
        self.assertEqual(ser.data['message'],
                         extract['message'])
        self.assertEqual(ser.data['source_id'],
                         extract['source_id'])
        self.assertEqual(arrow.get(ser.data['created']),
                         arrow.get(extract['created']))

    def test_deserialize(self):
        pass


class EventViewTests(APISimpleTestCase):

    def setUp(self):
        es = Elasticsearch(settings.ES_SERVER)
        if es.indices.exists('goldstone_model'):
            es.indices.delete('goldstone_model')
        es.indices.create('goldstone_model')

    def test_post(self):
        data = {
            'event_type': "test event",
            'message': "test message"}
        response = self.client.post('/core/events', data=data)
        EventType.refresh_index()
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_list(self):
        data1 = {
            "event_type": "test event",
            "message": "test message 1"}
        data2 = {
            "event_type": "test event",
            "message": "test message 2"}
        response = self.client.post('/core/events', data=data1)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        response = self.client.post('/core/events', data=data2)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        EventType.refresh_index()
        response = self.client.get('/core/events')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 2)

    def test_get(self):
        self.maxDiff = None
        data = {
            "event_type": "test event",
            "message": "test message"}
        response = self.client.post('/core/events', data=data)
        EventType.refresh_index()
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        response = self.client.get('/core/events')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        list_response_data = response.data['results'][0]
        self.assertDictContainsSubset(data, list_response_data)
        response = self.client.get('/core/events/' + list_response_data['id'])
        d1_created = list_response_data['created']
        d2_created = response.data['created']
        del list_response_data['created']
        del response.data['created']
        self.assertDictEqual(list_response_data, response.data)
        self.assertEqual(arrow.get(d1_created), arrow.get(d2_created))

    def test_delete(self):
        data = {
            "event_type": "test event",
            "message": "test message"}
        response = self.client.post('/core/events', data=data)
        EventType.refresh_index()
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        list_response_data = response.data
        self.assertDictContainsSubset(data, list_response_data)
        response = self.client.delete(
            '/core/events/' + list_response_data['id'])
        EventType.refresh_index()
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        response = self.client.get(
            '/core/events/' + list_response_data['id'])
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_create_fail_date_format(self):
        data = {
            "created": "xyzabc123",
            "event_type": "external created event",
            "message": "I am your creator"
        }
        response = self.client.post('/core/events', data=data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_get_list_with_start(self):
        start_time = arrow.utcnow().replace(minutes=-15)
        data1 = {
            "event_type": "test event",
            "message": "test message"}

        data2 = {
            "event_type": "test event",
            "message": "test message",
            "created": start_time.replace(minutes=-2).isoformat()
        }
        response = self.client.post('/core/events', data=data1)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data1_id = response.data['id']
        response = self.client.post('/core/events', data=data2)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data2_id = response.data['id']
        EventType.refresh_index()
        response = self.client.get('/core/events')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 2)

        # make sure that data2 has the proper created time
        response = self.client.get('/core/events/' + data2_id)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        d2_created = arrow.get(response.data['created'])
        self.assertEqual(d2_created, start_time.replace(minutes=-2))

        response = self.client.get(
            '/core/events?created__gte=' + str(start_time.timestamp * 1000))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['id'], data1_id)

    def test_get_list_with_start_and_end(self):
        end_time = arrow.utcnow().replace(minutes=-14)
        start_time = end_time.replace(minutes=-2)
        data1 = {
            "event_type": "test event",
            "message": "test message 1"}
        data2 = {
            "event_type": "test event",
            "message": "test message 2",
            "created": end_time.replace(minutes=-1).isoformat()
        }
        response = self.client.post('/core/events', data=data1)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data1_id = response.data['id']
        response = self.client.post('/core/events', data=data2)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data2_id = response.data['id']
        EventType.refresh_index()
        response = self.client.get('/core/events')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 2)

        response = self.client.get(
            '/core/events?created__gte=' + str(start_time.timestamp * 1000) +
            '&created__lte=' + str(end_time.timestamp * 1000)
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['id'], data2_id)

    def test_not_in_db(self):
        data = {
            "event_type": "test event",
            "message": "test message"}
        response = self.client.post('/core/events', data=data)
        EventType.refresh_index()
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        shapes = Event.objects.raw('SELECT * FROM core_event')
        self.assertEqual(len(list(shapes)), 0)


class MetricTypeTests(SimpleTestCase):

    def setUp(self):
        self.metric1 = Metric(id=str(uuid4()),
                              timestamp=arrow.utcnow().datetime,
                              name="metric1",
                              metric_type="metric_type1",
                              value=999,
                              unit="units",
                              node="")

    def test_get_mapping(self):
        m = MetricType.get_mapping()
        self.assertIs(type(m), dict)

    def test_get_model(self):
        o = MetricType.get_model()
        self.assertEqual(o.__name__, "Metric")


class MetricTests(SimpleTestCase):

    def setUp(self):
        self.metric1 = Metric(id=str(uuid4()),
                              timestamp=arrow.utcnow().datetime,
                              name="metric1",
                              metric_type="metric_type1",
                              value=999,
                              unit="units",
                              node="")

    def test_save(self):
        self.assertRaises(NotImplementedError, self.metric1.save)

    def test_delete(self):
        self.assertRaises(NotImplementedError, self.metric1.delete)

    def test_reconstitute(self):
        kwargs = self.metric1.__dict__
        del kwargs['_state']
        reconstituted = Metric._reconstitute(**kwargs)
        self.assertEqual(self.metric1, reconstituted)


class ReportTypeTest(SimpleTestCase):

    def setUp(self):
        self.metric1 = Metric(id=str(uuid4()),
                              timestamp=arrow.utcnow().datetime,
                              name="metric1",
                              metric_type="metric_type1",
                              value=999,
                              unit="units",
                              node="")

    def test_get_mapping(self):
        m = ReportType.get_mapping()
        self.assertIs(type(m), dict)

    def test_get_model(self):
        o = ReportType.get_model()
        self.assertEqual(o.__name__, "Report")


class ReportTest(SimpleTestCase):

    def setUp(self):
        self.report1 = Report(id=str(uuid4()),
                              timestamp=arrow.utcnow().datetime,
                              name="report1",
                              value="abc",
                              node="")

    def test_save(self):
        self.assertRaises(NotImplementedError, self.report1.save)

    def test_delete(self):
        self.assertRaises(NotImplementedError, self.report1.delete)

    def test_reconstitute(self):
        kwargs = self.report1.__dict__
        del kwargs['_state']
        reconstituted = Report._reconstitute(**kwargs)
        self.assertEqual(self.report1, reconstituted)


class ReportSerializerTests(APISimpleTestCase):

    def setUp(self):
        self.report1 = Report(id=str(uuid4()),
                              timestamp=arrow.utcnow().datetime,
                              name="report1",
                              value=["abc", "def", "ghi"],
                              node="")

        self.report2 = Report(id=str(uuid4()),
                              timestamp=arrow.utcnow().datetime,
                              name="report2",
                              value=["{\"abc\":\"def\"}", "{\"ghi\":\"jkl\"}"],
                              node="")

        self.report3 = Report(id=str(uuid4()),
                              timestamp=arrow.utcnow().datetime,
                              name="report3",
                              value="xyz",
                              node="")

    def test_serialize(self):
        ser = ReportSerializer(self.report1)

        # date serialization is awkward wrt +00:00 (gets converted to Z), and
        # resolution is a mismatch from arrow, so need to compare field by
        # field
        self.assertEqual(ser.data['name'],
                         self.report1.name)
        self.assertEqual(ser.data['value'],
                         ser._transform_value(self.report1.value))
        self.assertEqual(ser.data['node'],
                         self.report1.node)
        self.assertEqual(arrow.get(ser.data['timestamp']),
                         arrow.get(self.report1.timestamp))

        ser = ReportSerializer(self.report2)

        # date serialization is awkward wrt +00:00 (gets converted to Z), and
        # resolution is a mismatch from arrow, so need to compare field by
        # field
        self.assertEqual(ser.data['name'],
                         self.report2.name)
        self.assertEqual(ser.data['value'],
                         ser._transform_value(self.report2.value))
        self.assertEqual(ser.data['node'],
                         self.report2.node)
        self.assertEqual(arrow.get(ser.data['timestamp']),
                         arrow.get(self.report2.timestamp))

        ser = ReportSerializer(self.report3)

        # date serialization is awkward wrt +00:00 (gets converted to Z), and
        # resolution is a mismatch from arrow, so need to compare field by
        # field
        self.assertEqual(ser.data['name'],
                         self.report3.name)
        self.assertEqual(ser.data['value'],
                         ser._transform_value(self.report3.value))
        self.assertEqual(ser.data['node'],
                         self.report3.node)
        self.assertEqual(arrow.get(ser.data['timestamp']),
                         arrow.get(self.report3.timestamp))


class ReportViewTests(APISimpleTestCase):

    def setUp(self):
        es = Elasticsearch(settings.ES_SERVER)
        if es.indices.exists('goldstone_agent'):
            es.indices.delete('goldstone_agent')
        es.indices.create('goldstone_agent')
        es.index('goldstone_agent', 'core_report', {
            'timestamp': arrow.utcnow().timestamp * 1000,
            'name': 'test.test.report',
            'value': 'test value',
            'node': ''})
        es.index('goldstone_agent', 'core_report', {
            'timestamp': arrow.utcnow().timestamp * 1000,
            'name': 'test.test.report2',
            'value': 'test value',
            'node': ''})

    def test_post(self):
        data = {
            'name': "test.test.report",
            'value': "some value"}
        response = self.client.post('/core/reports', data=data)
        self.assertEqual(response.status_code,
                         status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_list(self):
        ReportType.refresh_index()
        response = self.client.get('/core/reports')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 2)

    def test_retrieve(self):
        response = self.client.get('/core/reports/abcdef')
        self.assertEqual(response.status_code,
                         status.HTTP_405_METHOD_NOT_ALLOWED)


class ElasticViewSetMixinTests(APISimpleTestCase):

    def test_process_params(self):
        params = {'name': 'test_param', 'name__fuzzy': 'xyz',
                  'name__gte': '123', 'must_not': "True",
                  "ordering": "-source_name"}
        e = ElasticViewSetMixin()
        # support the ordering lookup with a known model type
        e.model = EventType
        result = e._process_params(params)

        self.assertEqual(result,
                         {'query_kwargs': {'name__fuzzy': 'xyz',
                                           'must_not': 'True',
                                           'name__gte': '123'},
                          'filter_kwargs': {
                              'name': 'test_param'},
                          'order_by': '-source_name.raw'
                         })


class ReportListViewTests(APISimpleTestCase):

    def test_get_fail(self):
        response = self.client.get('/core/report_list')
        self.assertEqual(response.status_code,
                         status.HTTP_200_OK)