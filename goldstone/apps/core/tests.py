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

        Node.objects.get_or_create(name="node 1")
        Node.objects.get_or_create(name="node 2")


    def tearDown(self):
        # When using Entity.objects.all().delete(), we have a strange situation
        # where the tests pass locally, but fail on the jenkins server.  See
        # https://solinea.atlassian.net/browse/GOLD-433 for details, and use
        # this form for deleting.
        for obj in Entity.objects.iterator():
            obj.delete()
        for obj in Node.objects.iterator():
            obj.delete()

    def test_polymorphism(self):
        entities = Entity.objects.all()
        self.assertEqual(entities.count(), 5)

        nodes = Node.objects.all()
        self.assertEqual(nodes.count(), 2)

    def test_unicode(self):
        e1 = Entity.objects.get(name="entity 1")
        u = e1.__unicode__()
        self.assertDictContainsSubset({"name": "entity 1"}, json.loads(u))
        self.assertIn('uuid', json.loads(u))

        r1 = Node.objects.get(name="node 1")
        r1.save()
        u = r1.__unicode__()
        self.assertDictContainsSubset({"name": "node 1"}, json.loads(u))
        self.assertIn('last_seen_method', json.loads(u))
        self.assertIn('admin_disabled', json.loads(u))
        r2 = Node.objects.get(name="node 2")
        r2.save()
        u = r2.__unicode__()
        self.assertIn('updated', json.loads(u))
        self.assertNotEqual(u'', json.loads(u)['updated'])


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


class EventModelTests(SimpleTestCase):

    def setUp(self):
        es = Elasticsearch(settings.ES_SERVER)
        if es.indices.exists('goldstone_model'):
            es.indices.delete('goldstone_model')
        es.indices.create('goldstone_model')

    def test_create_model(self):
        e1 = Event(event_type='test_event', message='this is a test event')
        self.assertIsNotNone(e1.id)
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
            'event_type': "test event",
            'message': "test message 1"}
        data2 = {
            'event_type': "test event",
            'message': "test message 2"}
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
            'event_type': "test event",
            'message': "test message"}
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
            'event_type': "test event",
            'message': "test message"}
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
            "created": 'xyzabc123',
            "event_type": "external created event",
            "message": "I am your creator"
        }
        response = self.client.post('/core/events', data=data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_get_list_with_start(self):
        start_time = arrow.utcnow().replace(minutes=-15)
        data1 = {
            'event_type': "test event",
            'message': "test message"}

        data2 = {
            'event_type': "test event",
            'message': "test message",
            "created": start_time.replace(minutes=-2).isoformat()
        }
        response = self.client.post('/core/events', data=data1)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data1_id = response.data['id']
        logger.info("data1_id = %s", data1_id)
        response = self.client.post('/core/events', data=data2)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data2_id = response.data['id']
        logger.info("data2_id = %s", data2_id)
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
            'event_type': "test event",
            'message': "test message"}
        data2 = {
            'event_type': "test event",
            'message': "test message",
            "created": end_time.replace(minutes=-1).isoformat()
        }
        response = self.client.post('/core/events', data=data1)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data1_id = response.data['id']
        logger.info("data1_id = %s", data1_id)
        response = self.client.post('/core/events', data=data2)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data2_id = response.data['id']
        logger.info("data2_id = %s", data2_id)
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
            'event_type': "test event",
            'message': "test message"}
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
                         ser.transform_value(self.report1, self.report1.value))
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
                         ser.transform_value(self.report2, self.report2.value))
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
                         ser.transform_value(self.report3, self.report3.value))
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
