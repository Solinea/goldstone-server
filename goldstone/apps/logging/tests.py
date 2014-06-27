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

__author__ = 'John Stanford'

from django.test import SimpleTestCase
import logging
import uuid
from datetime import datetime
import pytz
import redis
import json
from base64 import b64encode

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

        body = {
            "body": json.dumps({
                'task': 'goldstone.apps.logging.tasks.process_host_stream',
                'id': str(uuid.uuid1()),
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

        # the records should be stored in redis with keys of
        # host_stream.whitelist.hostname and values of their respective
        # timestamps

        from time import sleep
        sleep(5)
        key = 'host_stream.whitelist.' + host1_name
        host1_redis_time = r.get(key)
        try:
            self.assertEqual(host1_time, host1_redis_time)
            r.delete(key)
        except Exception:
            r.delete(key)
            raise