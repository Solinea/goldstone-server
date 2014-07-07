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
from goldstone.apps.logging.models import *


logger = logging.getLogger(__name__)


@celery_app.task(bind=True, rate_limit='100/s', expires=5, time_limit=1)
def process_host_stream(self, host, timestamp):
    """
    This task reads a list of host names  out of the incoming message on the
    host_stream queue, gets the current state stored in redis, updates the
    information updates redis with the new result.  It also facilitates getting
    the result to ES periodically.
    :return: None
    """
    node = LoggingNode.get(host)
    if node is None or node.disabled:
        return None

    return node.update(timestamp=timestamp)


@celery_app.task(bind=True)
def check_host_avail(self):
    """
    Inspect the hosts in the store, and initiate a ping task for
    ones that have not been seen within the configured window.
    :return: None
    """
    # connect to redis
    # TODO make these config params
    # TODO use a connection pool
    cutoff = (
        datetime.now(tz=pytz.utc) - settings.HOST_AVAILABLE_PING_THRESHOLD
    ).strftime("%Y-%m-%dT%H:%M:%S.000Z")
    logger.debug("[check_host_avail] cutoff = %s", cutoff)
    all = LoggingNode.all()
    logger.debug("[check_host_avail] kv_list = %s", all)
    to_ping = [i.name for i in all if i.timestamp < cutoff and not i.disabled]
    logger.debug("hosts to ping = %s", json.dumps(to_ping))
    return to_ping
