"""Core app unit tests.

This module demonstrates no less than 3 strategies for mocking ES.

"""
# Copyright 2014 - 2015 Solinea, Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either expressed or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
import logging
from time import sleep
from uuid import uuid4

import arrow
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.test import SimpleTestCase
from elasticsearch.client import IndicesClient
import mock
from mock import patch
from rest_framework import status
from rest_framework.renderers import JSONRenderer
from rest_framework.test import APISimpleTestCase

from goldstone.apps.core import tasks
from goldstone.apps.core.views import ElasticViewSetMixin
from goldstone.models import es_conn
from goldstone.test_utils import create_and_login, AUTHORIZATION_PAYLOAD
from .models import EventType, Event, MetricType, Metric, ReportType, \
    Report, validate_str_bool, validate_method_choices, Node
from .serializers import EventSerializer, NodeSerializer, ReportSerializer

logger = logging.getLogger(__name__)


class TaskTests(SimpleTestCase):

    def test_delete_indices(self):
        """Tests that delete indices returns result of check_call,"""

        tasks.check_call = mock.Mock(return_value='mocked')
        # pylint: disable=W0212
        self.assertEqual(tasks.delete_indices('abc', 10), 'mocked')

    @patch.object(IndicesClient, 'create')
    @patch.object(IndicesClient, 'exists_alias')
    @patch.object(IndicesClient, 'update_aliases')
    @patch.object(IndicesClient, 'put_alias')
    def test_create_daily_index(self, put_alias, update_aliases, exists_alias,
                                create):

        create.side_effect = None
        exists_alias.return_value = True
        update_aliases.return_value = None

        # pylint: disable=W0212
        self.assertIsNone(tasks.create_daily_index('abc'))
        create.assert_called()

        exists_alias.return_value = False
        put_alias.return_value = None

        self.assertIsNone(tasks.create_daily_index('abc'))


class NodeSerializerTests(SimpleTestCase):

    name1 = "test_node_123"
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
        self.assertIn('managed', ser.data)
        self.assertIn('update_method', ser.data)
        self.assertNotIn('uuid', ser.data)


class NodeViewTests(APISimpleTestCase):

    name1 = "test_node_123"
    name2 = "test_node_456"
    name3 = "test_node_789"
    name4 = "test_node_987"

    node1 = Node(name=name1)
    node2 = Node(name=name2, managed='false')
    node3 = Node(name=name3, managed='false')
    node4 = Node(name=name4)

    def setUp(self):
        """Run before every test."""

        Node.objects.all().delete()

        # Needed for DRF's token authentication.
        get_user_model().objects.all().delete()
        self.token = create_and_login()

    def _save_nodes(self):
        """Save all four test nodes."""

        self.node1.save()
        self.node2.save()
        self.node3.save()
        self.node4.save()

    def test_get_list(self):

        self._save_nodes()

        response = self.client.get(
            '/core/nodes',
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % self.token)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            len(response.data['results']), 4)  # pylint: disable=E1101

    def test_get_enabled(self):

        self._save_nodes()

        response = self.client.get(
            '/core/nodes?managed=true',
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % self.token)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # pylint: disable=E1101
        self.assertEqual(len(response.data['results']), 2)
        self.assertEqual(response.data['results'][0]['managed'],
                         'true')
        self.assertEqual(response.data['results'][1]['managed'],
                         'true')

    def test_get_disabled(self):

        self._save_nodes()

        response = self.client.get(
            '/core/nodes?managed=false',
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % self.token)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # pylint: disable=E1101
        self.assertEqual(len(response.data['results']), 2)
        self.assertEqual(response.data['results'][0]['managed'], 'false')
        self.assertEqual(response.data['results'][1]['managed'], 'false')

    def test_patch_disable(self):

        self._save_nodes()

        response = self.client.get(
            '/core/nodes?managed=true',
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % self.token)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # pylint: disable=E1101
        self.assertEqual(len(response.data['results']), 2)
        self.assertEqual(response.data['results'][0]['managed'],
                         'true')
        uuid = response.data['results'][0]['id']
        response = self.client.patch(
            '/core/nodes/' + uuid + '/disable',
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % self.token)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        response = self.client.get(
            '/core/nodes/' + uuid,
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % self.token)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['managed'], 'false')

    def test_patch_enable(self):

        self._save_nodes()

        response = self.client.get(
            '/core/nodes?managed=false',
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % self.token)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # pylint: disable=E1101
        self.assertEqual(len(response.data['results']), 2)
        self.assertEqual(response.data['results'][0]['managed'], 'false')

        id_value = response.data['results'][0]['id']
        response = self.client.patch(
            '/core/nodes/' + id_value + '/enable',
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % self.token)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        response = self.client.get(
            '/core/nodes/' + id_value,
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % self.token)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['managed'], 'true')

    def test_delete_fail(self):

        self._save_nodes()

        response = self.client.get(
            '/core/nodes?managed=false',
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % self.token)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # pylint: disable=E1101
        self.assertEqual(len(response.data['results']), 2)
        self.assertEqual(response.data['results'][0]['managed'], 'false')

        uuid = response.data['results'][0]['id']
        response = self.client.delete(
            '/core/nodes/' + uuid,
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % self.token)

        self.assertEqual(response.status_code,
                         status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_post_fail(self):

        data = {'name': 'test123'}
        response = self.client.post(
            '/core/nodes',
            data=data,
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % self.token)

        self.assertEqual(response.status_code,
                         status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_put_fail(self):

        self._save_nodes()

        response = self.client.get(
            '/core/nodes',
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % self.token)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # pylint: disable=E1101
        self.assertEqual(len(response.data), 4)

        uuid = response.data['results'][0]['id']
        data = response.data['results'][0]
        # pylint: enable=E1101
        data['name'] = 'test123123'
        response = self.client.put(
            '/core/nodes/' + uuid,
            data=data,
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % self.token)

        self.assertEqual(response.status_code,
                         status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_partial_update_fail(self):

        self._save_nodes()

        response = self.client.get(
            '/core/nodes',
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % self.token)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # pylint: disable=E1101
        self.assertEqual(len(response.data), 4)

        uuid = response.data['results'][0]['id']
        # pylint: enable=E1101
        data = {'name': 'test123'}
        response = self.client.patch(
            '/core/nodes/' + uuid,
            data=data,
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % self.token)

        self.assertEqual(response.status_code,
                         status.HTTP_405_METHOD_NOT_ALLOWED)


class NodeModelTests(SimpleTestCase):

    name1 = "test_node_123"
    name2 = "test_node_456"
    name3 = "test_node_789"
    name4 = "test_node_987"

    def setUp(self):
        Node.objects.all().delete()

    def tearDown(self):
        Node.objects.all().delete()

    def test_validate_str_bool(self):

        self.assertIsNone(validate_str_bool('true'))
        self.assertIsNone(validate_str_bool('false'))
        self.assertRaises(ValidationError, validate_str_bool, 'True')
        self.assertRaises(ValidationError, validate_str_bool, 'False')

    def test_validate_method_choices(self):

        self.assertIsNone(validate_method_choices('UNKNOWN'))
        self.assertRaises(ValidationError, validate_method_choices, 'XYZ')

    def test_create_model(self):
        from goldstone.utils import utc_now

        node1 = Node(name=self.name1)
        node1.save()
        self.assertIsNotNone(node1.id)
        self.assertEqual(node1.managed, 'true')
        self.assertLess(node1.created, utc_now())
        self.assertAlmostEqual(arrow.get(node1.created).timestamp,
                               arrow.get(node1.updated).timestamp)
        self.assertEqual(node1.update_method, "UNKNOWN")

        node2 = Node(name=self.name2, managed='true')
        node2.save()
        self.assertIsNotNone(node2.id)
        self.assertEqual(node2.managed, 'true')
        self.assertAlmostEqual(arrow.get(node1.created).timestamp,
                               arrow.get(node1.updated).timestamp)
        self.assertEqual(node2.update_method, "UNKNOWN")

        node3 = Node(name=self.name3, managed='false')
        node3.save()
        self.assertIsNotNone(node3.id)
        self.assertEqual(node3.managed, 'false')
        self.assertLess(node3.created, utc_now())
        self.assertAlmostEqual(arrow.get(node1.created).timestamp,
                               arrow.get(node1.updated).timestamp)
        self.assertEqual(node3.update_method, "UNKNOWN")

        updated = arrow.utcnow()
        sleep(1)
        created = updated.replace(minutes=-30)

        node4 = Node(name=self.name4,
                     managed='false',
                     update_method="PING",
                     created=created.datetime,
                     updated=updated.datetime)
        node4.save()
        self.assertIsNotNone(node4.id)
        self.assertEqual(node4.managed, 'false')
        self.assertAlmostEqual(arrow.get(node1.created).timestamp,
                               arrow.get(node1.updated).timestamp)
        self.assertGreater(arrow.get(node4.updated).timestamp,
                           updated.timestamp)
        self.assertEqual(node4.update_method, "PING")

    def test_model_validation(self):
        """Test that ValidationError is raised appropriately."""

        # For every kind of managed state...
        for managed in ["False", "True", "XYZ"]:
            # Saving this should raised a ValidationError.
            node = Node(name='n1', managed=managed)
            self.assertRaises(ValidationError, node.save)

    def test_index_and_get_model(self):

        updated = arrow.utcnow()
        created = updated.replace(minutes=-30)

        node = Node(name=self.name1,
                    managed='false',
                    update_method="PING",
                    created=created.datetime,
                    updated=updated.datetime)
        node.save()

        self.assertEqual(Node.objects.all().count(), 1)
        stored = Node.objects.get(name=node.name)
        self.assertIsNotNone(stored)

        self.assertEqual(stored.name, node.name)
        self.assertEqual(stored.managed, node.managed)
        self.assertEqual(stored.update_method, node.update_method)
        self.assertEqual(stored.created, node.created)

    def test_update_existing(self):
        """Test that a Node update will update the node_updated timestamp, and
        not change the node_created timestamp."""

        node = Node(name=self.name1, managed='false', update_method="PING")
        node.save()

        node_created = Node.objects.get(name=node.name).created
        node_updated = Node.objects.get(name=node.name).updated
        sleep(1)
        node.save()

        stored_created = Node.objects.get(name=node.name).created
        stored_updated = Node.objects.get(name=node.name).updated

        self.assertEqual(stored_created, node_created)
        self.assertGreater(stored_updated, node_updated)

    def test_delete_model(self):
        """Test deleting a Node."""

        node = Node(name=self.name1, managed='true', update_method="PING")

        node.save()
        self.assertEqual(Node.objects.all().count(), 1)

        node.delete()
        self.assertEqual(Node.objects.all().count(), 0)


class EventModelTests(SimpleTestCase):

    def setUp(self):

        server = es_conn()

        if server.indices.exists('goldstone_model'):
            server.indices.delete('goldstone_model')

        server.indices.create('goldstone_model')

    def test_create_model(self):

        event = Event(event_type='test_event', message='this is a test event')

        self.assertIsNotNone(event.id)
        self.assertEqual(event.source_id, "")
        self.assertEqual(event.source_name, "")
        self.assertNotEqual(event.id, "")
        self.assertIsNotNone(event.created)

    def test_index_model(self):

        event = Event(event_type='test_event', message='this is a test event')
        event.save()

        EventType.refresh_index()

        # pylint: disable=W0212
        self.assertEqual(event._mt.search().query().count(), 1)

        stored = event._mt.search().query(). \
            filter(_id=event.id)[:1]. \
            execute(). \
            objects[0]. \
            get_object()

        self.assertEqual(stored.id, event.id)
        self.assertEqual(stored.event_type, event.event_type)
        self.assertEqual(stored.message, event.message)
        self.assertEqual(stored.created, event.created)

    def test_unindex_model(self):

        event = Event(event_type='test_event', message='this is a test event')
        event.save()

        EventType.refresh_index()
        # pylint: disable=W0212
        self.assertEqual(event._mt.search().query().count(), 1)

        event.delete()
        EventType.refresh_index()
        self.assertEqual(EventType().search().query().count(), 0)


class EventTypeTests(SimpleTestCase):

    def test_get_mapping(self):

        result = EventType.get_mapping()
        self.assertIs(type(result), dict)


class EventSerializerTests(SimpleTestCase):

    event1 = Event(event_type='test_serializer',
                   message='testing serialization')

    def setUp(self):

        server = es_conn()

        if server.indices.exists('goldstone_model'):
            server.indices.delete('goldstone_model')

        server.indices.create('goldstone_model')

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
        self.assertEqual(ser.data['message'], extract['message'])
        self.assertEqual(ser.data['source_id'], extract['source_id'])
        self.assertEqual(arrow.get(ser.data['created']),
                         arrow.get(extract['created']))

    def test_deserialize(self):
        pass


class EventViewTests(APISimpleTestCase):

    def setUp(self):
        """Run before every test."""

        server = es_conn()

        if server.indices.exists('goldstone_model'):
            server.indices.delete('goldstone_model')

        server.indices.create('goldstone_model')

        # Needed for DRF's token authentication.
        get_user_model().objects.all().delete()
        self.token = create_and_login()

    def test_post(self):

        data = {'event_type': "test event", 'message': "test message"}
        response = self.client.post(
            '/core/events',
            data=data,
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % self.token)

        EventType.refresh_index()

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_list(self):
        """Record two events, then GET them."""

        data1 = {"event_type": "test event", "message": "test message 1"}
        data2 = {"event_type": "test event", "message": "test message 2"}

        for data in [data1, data2]:
            response = self.client.post(
                '/core/events',
                data=data,
                HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % self.token)

            self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        EventType.refresh_index()
        response = self.client.get(
            '/core/events',
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % self.token)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 2)  # pylint: disable=E1101

    def test_get(self):

        data = {"event_type": "test event", "message": "test message"}

        response = self.client.post(
            '/core/events',
            data=data,
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % self.token)

        EventType.refresh_index()
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        response = self.client.get(
            '/core/events',
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % self.token)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # pylint: disable=E1101
        self.assertEqual(response.data['count'], 1)

        list_response_data = response.data['results'][0]
        # pylint: enable=E1101
        self.assertDictContainsSubset(data, list_response_data)

        response = self.client.get(
            '/core/events/' + list_response_data['id'],
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % self.token)

        d1_created = list_response_data['created']
        # pylint: disable=E1101
        d2_created = response.data['created']
        del list_response_data['created']
        del response.data['created']
        self.assertDictEqual(list_response_data, response.data)
        # pylint: enable=E1101
        self.assertEqual(arrow.get(d1_created), arrow.get(d2_created))

    def test_delete(self):

        data = {"event_type": "test event", "message": "test message"}

        response = self.client.post(
            '/core/events',
            data=data,
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % self.token)

        EventType.refresh_index()
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        # pylint: disable=E1101
        list_response_data = response.data
        self.assertDictContainsSubset(data, list_response_data)

        # pylint: enable=E1101
        response = self.client.delete(
            '/core/events/' + list_response_data['id'],
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % self.token)
        EventType.refresh_index()
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        response = self.client.get(
            '/core/events/' + list_response_data['id'],
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % self.token)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_create_fail_date_format(self):

        data = {"created": "xyzabc123",
                "event_type": "external created event",
                "message": "I am your creator"
                }

        response = self.client.post(
            '/core/events',
            data=data,
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % self.token)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_get_list_with_start(self):

        start_time = arrow.utcnow().replace(minutes=-15)

        data1 = {"event_type": "test event", "message": "test message"}
        data2 = {"event_type": "test event",
                 "message": "test message",
                 "created": start_time.replace(minutes=-2).isoformat()
                 }

        response = self.client.post(
            '/core/events',
            data=data1,
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % self.token)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        data1_id = response.data['id']  # pylint: disable=E1101

        response = self.client.post(
            '/core/events',
            data=data2,
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % self.token)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        data2_id = response.data['id']  # pylint: disable=E1101
        EventType.refresh_index()
        response = self.client.get(
            '/core/events',
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % self.token)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 2)  # pylint: disable=E1101

        # make sure that data2 has the proper created time
        response = self.client.get(
            '/core/events/' + data2_id,
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % self.token)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        d2_created = arrow.get(
            response.data['created'])  # pylint: disable=E1101
        self.assertEqual(d2_created, start_time.replace(minutes=-2))

        response = self.client.get(
            '/core/events?created__gte=' + str(start_time.timestamp * 1000),
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % self.token)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # pylint: disable=E1101
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['id'], data1_id)

    def test_get_list_start_and_end(self):

        end_time = arrow.utcnow().replace(minutes=-14)
        start_time = end_time.replace(minutes=-2)

        data1 = {"event_type": "test event", "message": "test message 1"}
        data2 = {"event_type": "test event",
                 "message": "test message 2",
                 "created": end_time.replace(minutes=-1).isoformat()
                 }

        response = self.client.post(
            '/core/events',
            data=data1,
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % self.token)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        response = self.client.post(
            '/core/events',
            data=data2,
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % self.token)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        data2_id = response.data['id']  # pylint: disable=E1101
        EventType.refresh_index()
        response = self.client.get(
            '/core/events',
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % self.token)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 2)  # pylint: disable=E1101

        response = self.client.get(
            '/core/events?created__gte=' + str(start_time.timestamp * 1000) +
            '&created__lte=' + str(end_time.timestamp * 1000),
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % self.token)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # pylint: disable=E1101
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['id'], data2_id)

    def test_not_in_db(self):

        data = {"event_type": "test event", "message": "test message"}

        response = self.client.post(
            '/core/events',
            data=data,
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % self.token)

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

        result = MetricType.get_mapping()
        self.assertIs(type(result), dict)

    def test_get_model(self):

        result = MetricType.get_model()
        self.assertEqual(result.__name__, "Metric")


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
        reconstituted = Metric.reconstitute(**kwargs)
        self.assertEqual(self.metric1, reconstituted)


class MetricViewTests(APISimpleTestCase):

    def setUp(self):
        """Run before every test."""

        server = es_conn()

        if server.indices.exists('goldstone_agent'):
            server.indices.delete('goldstone_agent')
        server.indices.create('goldstone_agent')

        server.index('goldstone_agent', 'core_metric', {
            'timestamp': arrow.utcnow().timestamp * 1000,
            'name': 'test.test.metric',
            'value': 'test value',
            'node': ''})

        server.index('goldstone_agent', 'core_metric', {
            'timestamp': arrow.utcnow().timestamp * 1000,
            'name': 'test.test.metric2',
            'value': 'test value',
            'node': ''})

        # Needed for DRF's token authentication.
        get_user_model().objects.all().delete()
        self.token = create_and_login()

    def test_post(self):

        data = {'name': "test.test.metric", 'value': "some value"}
        response = self.client.post(
            '/core/metrics',
            data=data,
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % self.token)

        self.assertEqual(response.status_code,
                         status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_list(self):

        ReportType.refresh_index()

        response = self.client.get(
            '/core/metrics',
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % self.token)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 2)  # pylint: disable=E1101

    def test_retrieve(self):

        response = self.client.get(
            '/core/metrics/abcdef',
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % self.token)

        self.assertEqual(response.status_code,
                         status.HTTP_405_METHOD_NOT_ALLOWED)


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

        result = ReportType.get_mapping()
        self.assertIs(type(result), dict)

    def test_get_model(self):

        result = ReportType.get_model()
        self.assertEqual(result.__name__, "Report")


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
        reconstituted = Report.reconstitute(**kwargs)
        self.assertEqual(self.report1, reconstituted)


class ReportSerializerTests(APISimpleTestCase):

    def setUp(self):
        """Initialize the test."""

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
        """Test the Report serializer."""

        # pylint: disable=W0212

        # For each of the test reports...
        for entry in [self.report1, self.report2, self.report3]:
            # Date serialization is awkward wrt +00:00 (gets converted
            # to Z), and resolution is a mismatch from arrow, so we need
            # to compare field by field.
            ser = ReportSerializer(entry)

            self.assertEqual(ser.data['name'], entry.name)
            self.assertEqual(ser.data['value'],
                             ser._transform_value(entry.value))
            self.assertEqual(ser.data['node'], entry.node)
            self.assertEqual(arrow.get(ser.data['timestamp']),
                             arrow.get(entry.timestamp))


class ReportViewTests(APISimpleTestCase):

    def setUp(self):
        """Run before every test."""

        server = es_conn()

        if server.indices.exists('goldstone_agent'):
            server.indices.delete('goldstone_agent')

        server.indices.create('goldstone_agent')

        server.index('goldstone_agent',
                     'core_report',
                     {'timestamp': arrow.utcnow().timestamp * 1000,
                      'name': 'test.test.report',
                      'value': 'test value',
                      'node': ''})

        server.index('goldstone_agent',
                     'core_report',
                     {'timestamp': arrow.utcnow().timestamp * 1000,
                      'name': 'test.test.report2',
                      'value': 'test value',
                      'node': ''})

        get_user_model().objects.all().delete()
        self.token = create_and_login()

    def test_post(self):

        data = {'name': "test.test.report", 'value': "some value"}
        response = self.client.post(
            '/core/reports',
            data=data,
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % self.token)

        self.assertEqual(response.status_code,
                         status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_list(self):

        ReportType.refresh_index()
        response = self.client.get(
            '/core/reports',
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % self.token)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 2)  # pylint: disable=E1101

    def test_retrieve(self):

        response = self.client.get(
            '/core/reports/abcdef',
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % self.token)

        self.assertEqual(response.status_code,
                         status.HTTP_405_METHOD_NOT_ALLOWED)


class ElasticViewSetMixinTests(APISimpleTestCase):

    def test_process_params(self):

        # Test parameters.
        PARAMS = {'name': 'test_param', 'name__fuzzy': 'xyz',
                  'name__gte': '123', 'must_not': "True",
                  "ordering": "-source_name"}

        mixin = ElasticViewSetMixin()

        # Support the ordering lookup with a known model type.
        mixin.model = EventType
        result = mixin._process_params(PARAMS)      # pylint: disable=W0212

        self.assertEqual(result,
                         {'query_kwargs': {'name__fuzzy': 'xyz',
                                           'must_not': 'True',
                                           'name__gte': '123'},
                          'filter_kwargs': {'name': 'test_param'},
                          'order_by': '-source_name.raw'})


class ReportListViewTests(APISimpleTestCase):

    def test_get_fail(self):

        get_user_model().objects.all().delete()
        token = create_and_login()

        response = self.client.get(
            '/core/report_list',
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
