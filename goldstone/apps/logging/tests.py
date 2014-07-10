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

    def setUp(self):
        for obj in LN.objects.iterator():
            obj.delete()

    def test_process_host_stream(self):
        # administratively enabled
        node1 = LN(name=self.name1, disabled=False)
        node1.save()
        # get the object to get consistent date resolution
        node1 = LN.objects.get(uuid=node1.uuid)
        sleep(1)
        process_host_stream(self.name1, self.ts1)
        updated_node1 = LN.objects.get(uuid=node1.uuid)
        self.assertGreater(updated_node1.updated, node1.updated)

        # administratively disabled
        node2 = LN(name=self.name2, disabled=True)
        node2.save()
        node2 = LN.objects.get(uuid=node2.uuid)
        sleep(1)
        process_host_stream(self.name2, self.ts2)
        updated_node2 = LN.objects.get(uuid=node2.uuid)
        self.assertEqual(updated_node2.updated, node2.updated)

    def test_check_host_avail(self):
        now = datetime.now(tz=pytz.utc)
        last_year = now - timedelta(days=365)
        node1 = LN(name=self.name1)
        node2 = LN(name=self.name2, disabled=True)
        node3 = LN(name=self.name3)
        node3.save()
        node2.save()
        sleep(2)
        node1.save()
        result = check_host_avail(offset=timedelta(seconds=2))
        self.assertNotIn(node1, result)
        self.assertNotIn(node2, result)
        self.assertIn(node3, result)

    @patch.object(subprocess, 'call')
    def test_ping(self, call):
        now = datetime.now(tz=pytz.utc)
        last_year = now - timedelta(days=365)
        node1 = LN(name=self.name1)
        node1.save()
        node2 = LN(name=self.name2)
        node2.save()
        call.return_value = 0
        result = ping(node1)
        self.assertTrue(result)
        call.return_value = 1
        result = ping(node2)
        self.assertFalse(result)


class LNModelTests(SimpleTestCase):
    name1 = "test_node_123"
    name2 = "test_node_456"
    name3 = "test_node_789"

    def setUp(self):
        for obj in LN.objects.iterator():
            obj.delete()

    def test(self):
        node1 = LN(name=self.name1)
        node1.save()
        node2 = LN(name=self.name2)
        node2.save()
        self.assertNotEqual(node1.id, node2.id)
        self.assertNotEqual(node1.uuid, node2.uuid)
        node1.method = 'host_stream'
        node1.disabled = True
        node1.save()
        self.assertNotEqual(node1.created, node1.updated)
        self.assertEqual(node1.method, 'host_stream')
        self.assertTrue(node1.disabled)

    def test_unicode(self):
        node1 = LN(name=self.name1)
        node1.save()
        uni = node1.__unicode__()
        self.assertIn('created', json.loads(uni))
        self.assertIn('updated', json.loads(uni))
        self.assertIn('name', json.loads(uni))
        self.assertIn('disabled', json.loads(uni))
        self.assertIn('method', json.loads(uni))


class LNSerializerTests(SimpleTestCase):
    name1 = "test_node_123"
    name2 = "test_node_456"
    name3 = "test_node_789"

    def setUp(self):
        for obj in LN.objects.iterator():
            obj.delete()

    def test_serializer(self):
        node1 = LN(name=self.name1)
        node1.save()
        ser = LNSerializer(node1)
        j = JSONRenderer().render(ser.data)
        logger.debug('[test_serializer] node1 json = %s', j)
        self.assertNotIn('id', ser.data)
        self.assertIn('name', ser.data)
        self.assertIn('created', ser.data)
        self.assertIn('updated', ser.data)
        self.assertIn('disabled', ser.data)
        self.assertIn('method', ser.data)
        self.assertIn('uuid', ser.data)


class LNViewTests(APISimpleTestCase):
    name1 = "test_node_123"
    name2 = "test_node_456"
    name3 = "test_node_789"
    name4 = "test_node_987"

    def setUp(self):
        for obj in LN.objects.iterator():
            obj.delete()

    def test_get_list(self):
        node1 = LN(name=self.name1)
        node2 = LN(name=self.name2, disabled=True)
        node3 = LN(name=self.name3, disabled=True)
        node4 = LN(name=self.name4)
        node1.save()
        node2.save()
        node3.save()
        node4.save()
        response = self.client.get('/logging/nodes')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 4)

    def test_get_enabled(self):
        node1 = LN(name=self.name1)
        node2 = LN(name=self.name2, disabled=True)
        node3 = LN(name=self.name3, disabled=True)
        node4 = LN(name=self.name4)
        node1.save()
        node2.save()
        node3.save()
        node4.save()
        response = self.client.get('/logging/nodes?disabled=False')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        self.assertFalse(response.data[0]['disabled'])
        self.assertFalse(response.data[1]['disabled'])

    def test_get_disabled(self):
        node1 = LN(name=self.name1)
        node2 = LN(name=self.name2, disabled=True)
        node3 = LN(name=self.name3, disabled=True)
        node4 = LN(name=self.name4)
        node1.save()
        node2.save()
        node3.save()
        node4.save()
        response = self.client.get('/logging/nodes?disabled=True')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        self.assertTrue(response.data[0]['disabled'])
        self.assertTrue(response.data[1]['disabled'])

    def test_patch_disable(self):
        node1 = LN(name=self.name1)
        node1.save()
        response = self.client.get('/logging/nodes?disabled=False')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], self.name1)
        self.assertFalse(response.data[0]['disabled'])
        uuid = response.data[0]['uuid']
        response = self.client.patch('/logging/nodes/' + uuid + '/disable')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        response = self.client.get('/logging/nodes/' + uuid)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], self.name1)
        self.assertTrue(response.data['disabled'])

    def test_patch_enable(self):
        node1 = LN(name=self.name1, disabled=True)
        node1.save()
        response = self.client.get('/logging/nodes?disabled=True')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], self.name1)
        self.assertTrue(response.data[0]['disabled'])
        uuid = response.data[0]['uuid']
        response = self.client.patch('/logging/nodes/' + uuid + '/enable')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        response = self.client.get('/logging/nodes/' + uuid)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], self.name1)
        self.assertFalse(response.data['disabled'])

    def test_delete_fail(self):
        node1 = LN(name=self.name1)
        node1.save()
        response = self.client.get('/logging/nodes')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], self.name1)
        self.assertFalse(response.data[0]['disabled'])
        uuid = response.data[0]['uuid']
        response = self.client.delete('/logging/nodes/' + uuid)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        response = self.client.get('/logging/nodes/' + uuid)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_delete_succeed(self):
        node1 = LN(name=self.name1, disabled=True)
        node1.save()
        response = self.client.get('/logging/nodes')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], self.name1)
        self.assertTrue(response.data[0]['disabled'])
        uuid = response.data[0]['uuid']
        response = self.client.delete('/logging/nodes/' + uuid)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        response = self.client.get('/logging/nodes/' + uuid)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_post_fail(self):
        data = {'name': 'test123'}
        response = self.client.post('/logging/nodes', data=data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_put_fail(self):
        node1 = LN(name=self.name1, disabled=True)
        node1.save()
        response = self.client.get('/logging/nodes')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], self.name1)
        uuid = response.data[0]['uuid']

        data = {'name': 'test123'}
        response = self.client.put('/logging/nodes/' + uuid, data=data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
