from __future__ import absolute_import
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

import pytz

__author__ = 'John Stanford'

from django.conf import settings
from goldstone.celery import app as celery_app
import logging
import redis
import json
from datetime import datetime
import pytz


logger = logging.getLogger(__name__)


@celery_app.task(bind=True)
def process_host_stream(self, host, timestamp):
    """
    This task reads a list of host names  out of the incoming message on the
    host_stream queue, gets the current state stored in redis, updates the
    information updates redis with the new result.  It also facilitates getting
    the result to ES periodically.
    :return: None
    """
    # connect to redis
    # TODO make these config params
    # TODO use a connection pool
    r = redis.StrictRedis(host='localhost', port=6379, db=0)
    if not r.exists("host_stream.blacklist." + host):
        key = "host_stream.whitelist." + host
        r.set(key, timestamp)
        logger.debug("set key %s to %s", key, timestamp)


