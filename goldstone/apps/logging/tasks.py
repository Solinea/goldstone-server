"""Logging tasks."""
# Copyright 2014 - 2015 Solinea, Inc.
#
# Licensed under the Solinea Software License Agreement (goldstone),
# Version 1.0 (the "License"); you may not use this file except in compliance
# with the License. You may obtain a copy of the License at:
#
#     http://www.solinea.com/goldstone/LICENSE.pdf
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either expressed or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
from __future__ import absolute_import

import arrow
from django.conf import settings
from django.core.exceptions import ObjectDoesNotExist
from goldstone.celery import app as celery_app
import logging
from goldstone.apps.core.models import Event, Node


logger = logging.getLogger(__name__)


@celery_app.task(bind=True, rate_limit='100/s', expires=5, time_limit=1)
def process_host_stream(self, host, _):
    """
    This task reads a list of host names out of the incoming message on the
    host_stream queue, and creates or updates an associated node in the model.
    :return: None

    """

    # TODO this cleanup should be in a slower moving lane
    try:
        node = Node.objects.get(name=host)
        if node.managed == 'true':
            node.update_method = 'LOGS'
            node.save()
    except ObjectDoesNotExist:
        # no nodes found, we should create one
        node = Node(name=host, update_method='LOGS')
        node.save()
    except Exception:         # pylint: disable=W0703
        logger.exception('unidentified exception in process_host_stream')


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

    _create_event(timestamp, host, event_type, message)


def _create_event(timestamp, host, event_type, message):
    dt = arrow.get(timestamp).datetime

    try:
        node = Node.objects.get(name=host)
        event = Event(event_type=event_type, created=dt, message=message,
                      source_id=str(node.id), source_name=host)
        event.save()
        return event
    except ObjectDoesNotExist:
        logger.warning("[process_log_error_event] could not find node "
                       "with name=%s.  event will have not relations.", host)
        event = Event(event_type=event_type, created=dt, message=message)
        event.save()
        return event


@celery_app.task(bind=True)
def ping(self, node):
    from datetime import datetime
    import subprocess
    import pytz

    response = subprocess.call("ping -c 5 %s" % node.name,
                               shell=True,
                               stdout=open('/dev/null', 'w'),
                               stderr=subprocess.STDOUT)

    if response == 0:
        logger.debug("%s is alive", node.id)
        node.last_seen = datetime.now(tz=pytz.utc)
        node.last_seen_method = 'PING'
        node.save()
        return True
    else:
        logger.debug("%s did not respond", node.id)
        return False


@celery_app.task(bind=True)
def check_host_avail(self, offset=settings.HOST_AVAILABLE_PING_THRESHOLD):
    """
    Inspect the hosts in the store, and initiate a ping task for
    ones that have not been seen within the configured window.
    :return: None
    """

    cutoff = arrow.utcnow().datetime - offset
    logger.debug("[check_host_avail] cutoff = %s", str(cutoff))
    to_ping = Node.objects.filter(updated__lte=cutoff, managed='true')

    logger.debug("hosts to ping = %s", to_ping)
    for node in to_ping:
        ping(node)
