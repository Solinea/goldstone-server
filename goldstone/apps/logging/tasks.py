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
from goldstone.apps.logging.models import LoggingNode

__author__ = 'John Stanford'

from django.conf import settings
from goldstone.celery import app as celery_app
import logging
from goldstone.apps.core.models import *
from datetime import datetime
import arrow


logger = logging.getLogger(__name__)


@celery_app.task(bind=True, rate_limit='100/s', expires=5, time_limit=1)
def process_host_stream(self, host, timestamp):
    """
    This task reads a list of host names out of the incoming message on the
    host_stream queue, and creates or updates an associated node in the model.
    :return: None
    """
    node, created = Node.objects.get_or_create(name=host)
    if not node.admin_disabled:
        node.last_seen_method = 'LOGS'
        # todo change date to arrow
        node.last_seen = datetime.now(tz=pytz.utc)
        node.save()


@celery_app.task(bind=True, rate_limit='100/s', expires=5, time_limit=1)
def process_event_stream(self, timestamp, host, event_type, message):
    """
    This task handles events coming from the log stream.  Specific handling
    can be implemented based on the event type.  Currently know event types
    are "AMQPDownError" and "GenericSyslogError".
    :return: None
    """
    logger.debug("[process_event_stream] got an event with timestamp=%s, "
                 "host=%s, event_type=%s, message=%s",
                 timestamp, host, event_type, message)

    if event_type == "GenericSyslogError":
        process_log_error_event(timestamp, host, message)
    elif event_type == "AMQPDownError":
        process_amqp_down_event(timestamp, host, message)
    else:
        logger.warning("[process_event_stream] don't know how to handle event"
                       "of type %s with message=%s", event_type, message)


def _create_event(timestamp, host, message, event_type):
    logger.debug("[_create_event] got a log error event with "
                 "timestamp=%s, host=%s message=%s, event_type=%s",
                 timestamp, host, message, event_type)

    dt = arrow.get(timestamp).datetime

    try:
        node = LoggingNode.objects.get(name=host)
    except LoggingNode.DoesNotExist:
        logger.warning("[process_log_error_event] could not find logging node "
                       "with name=%s.  event will have not relations.", host)
        event = Event(event_type=event_type, created=dt, message=message)
        event.save()
        return event
    else:
        event = Event(event_type=event_type, created=dt, message=message,
                      source_id=str(node.uuid))
        event.save()
        return event


def process_log_error_event(timestamp, host, message):
    logger.debug("[process_log_error_event] got a log error event with "
                 "host=%s message=%s",
                 timestamp, host, message)

    return _create_event(timestamp, host, message, "Syslog Error")


def process_amqp_down_event(timestamp, host, message):
    logger.debug("[process_amqp_down_event] got an AMQP down event with "
                 "timestamp=%s, host=%s, event_type=%s, message=%s",
                 timestamp, host, message)

    return _create_event(timestamp, host, message, "AMQP Down")


@celery_app.task(bind=True)
def ping(self, node):
    response = subprocess.call("ping -c 5 %s" % node.name,
                               shell=True,
                               stdout=open('/dev/null', 'w'),
                               stderr=subprocess.STDOUT)
    if response == 0:
        logger.debug("%s is alive", node.uuid)
        node.last_seen = datetime.now(tz=pytz.utc)
        node.last_seen_method = 'PING'
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
    cutoff = (datetime.now(tz=pytz.utc) - offset)
    logger.debug("[check_host_avail] cutoff = %s", cutoff)
    to_ping = Node.objects.filter(updated__lte=cutoff, admin_disabled=False)
    logger.debug("hosts to ping = %s", to_ping)
    for node in to_ping.iterator():
        ping(node)

    return to_ping
