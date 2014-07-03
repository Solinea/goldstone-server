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
from django.http import HttpResponse

__author__ = 'John Stanford'

from django.test import SimpleTestCase
import logging
import uuid
from datetime import datetime
import pytz
import redis
import json
from time import sleep
from goldstone.apps.logging.tasks import *
from goldstone.apps.logging.models import *
from celery.result import AsyncResult

logger = logging.getLogger(__name__)


class TaskTests(SimpleTestCase):
    """
    Remember that celery should be running, and if changes have been made
    to task code, it should be restarted.
    """

    def test_publish_host_stream_message(self):
        """
        Should be able to publish a message to redis and have the task receive
        it.
        """
        host1_name = str(uuid.uuid4())
        host1_time = datetime.now(tz=pytz.utc).isoformat()
        task_id = str(uuid.uuid1())
        body = {
            "body": json.dumps({
                'task': 'goldstone.apps.logging.tasks.process_host_stream',
                'id': task_id,
                'args': [host1_name, host1_time]
            }),
            "content-type": "application/json",
            "properties": {
                "delivery_info": {
                    "priority": 0,
                    "routing_key": "host_stream.#",
                    "exchange": "default"
                },
                "delivery_mode": 2,
                "delivery_tag": str(uuid.uuid4())
            },
            "content-encoding": "utf-8"
        }
        body = json.dumps(body)
        r = redis.StrictRedis(host='localhost', port=6379, db=0)
        r.lpush("host_stream", body)

        # this should wait for the task to complete (making it synchronous)
        # task returns the key
        key = 'host_stream.whitelist.' + host1_name
        result = AsyncResult(task_id).get(timeout=6)
        self.assertEqual(result, key)

        # the records should be stored in redis with keys of
        # host_stream.whitelist.hostname and values of their respective
        # timestamps

        host1_redis_time = r.get(key)
        try:
            self.assertEqual(host1_time, host1_redis_time)
            r.delete(key)
        except Exception:
            r.delete(key)
            raise

    def test_check_host_avail(self):
        r = redis.StrictRedis(host='localhost', port=6379, db=0)
        timestamp1 = (
            datetime.now(tz=pytz.utc) -
            settings.HOST_AVAILABLE_PING_THRESHOLD -
            timedelta(hours=1)
        ).strftime("%Y-%m-%dT%H:%M:%S.000Z")
        timestamp2 = (
            datetime.now(tz=pytz.utc) -
            settings.HOST_AVAILABLE_PING_THRESHOLD +
            timedelta(hours=1)
        ).strftime("%Y-%m-%dT%H:%M:%S.000Z")
        r.set('host_stream.whitelist.test', timestamp1)
        r.set('host_stream.whitelist.test2', timestamp2)
        sleep(1)
        l = check_host_avail()
        try:
            self.assertIn('test', l)
            self.assertNotIn('test2', l)
            r.delete('host_stream.whitelist.test')
            r.delete('host_stream.whitelist.test2')
        except:
            r.delete('host_stream.whitelist.test')
            r.delete('host_stream.whitelist.test2')
            raise


class ModelTests(SimpleTestCase):

    def test_get_host_avail_data(self):
        ha = HostAvailData()
        response = ha.get_all()
        self.assertTrue('blacklist' in response)
        self.assertTrue('whitelist' in response)


class ViewTests(SimpleTestCase):

    def test_get_agents(self):
        response = self.client.get("/logging/report/host_availability")
        self.assertIsInstance(response, HttpResponse)
        self.assertNotEqual(response.content, None)
        try:
            j = json.loads(response.content)
        except:
            self.fail("Could not convert content to JSON")
        else:
            self.assertIsInstance(j, dict)
            self.assertTrue('status' in j)
            self.assertTrue('data' in j)
