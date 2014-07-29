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
import subprocess
from rest_framework.renderers import JSONRenderer

__author__ = 'John Stanford'

from django.conf import settings
from goldstone.celery import app as celery_app
import logging
from goldstone.apps.core.models import *
from datetime import datetime


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
    node, created = Node.objects.get_or_create(name=host)
    if not node.admin_disabled:
        node.last_seen_method = 'LOGS'
        node.last_seen = datetime.now(tz=pytz.utc)
        node.save()


@celery_app.task(bind=True, rate_limit='100/s', expires=5, time_limit=1)
def process_amqp_stream(self, timestamp, host, message):
    """
    This task handles AMQP status events coming from the log stream.
    :return: None
    """
    logger.info("[process_amqp_stream] got an event with timestamp=%s, "
                "host=%s, message=%s", timestamp, host, message)
    #node, created = LoggingNode.objects.get_or_create(name=host)
    #if not node.disabled:
    #    node.save()


@celery_app.task(bind=True)
def ping(self, node):
    response = subprocess.call("ping -c 5 %s" % node.name,
                               shell=True,
                               stdout=open('/dev/null', 'w'),
                               stderr=subprocess.STDOUT)
    if response == 0:
        logger.debug("%s is alive", node.uuid)
        node.method = 'ping'
        node.save()
        return True
    else:
        logger.debug("%s did not respond", node.uuid)
        return False


@celery_app.task(bind=True)
def check_host_avail(self, offset=settings.HOST_AVAILABLE_PING_THRESHOLD):
    """
    Inspect the hosts in the store, and initiate a ping task for
    ones that have not been seen within the configured window.
    :return: None
    """
    cutoff = (
        datetime.now(tz=pytz.utc) - offset
    )
    logger.debug("[check_host_avail] cutoff = %s", cutoff)
    to_ping = Node.objects.filter(updated__lte=cutoff, admin_disabled=False)
    logger.debug("hosts to ping = %s", to_ping)
    for node in to_ping.iterator():
        ping(node)

    return to_ping


@celery_app.task(bind=True)
def create_event(self, event):
    """
    send an event to
    :param event:
    :return:
    """
    pass
