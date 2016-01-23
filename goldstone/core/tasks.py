"""Core tasks."""
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
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
import logging
from subprocess import check_call
import arrow
from django.conf import settings
from pycadf import event, cadftype, cadftaxonomy, resource, measurement, metric
from goldstone.celery import app as celery_app
from goldstone.core.models import SavedSearch, CADFEventDocType, AlertSearch, \
    Alert, EmailProducer, Producer


logger = logging.getLogger(__name__)


@celery_app.task()
def delete_indices(prefix,
                   cutoff=None,
                   es_host=settings.ES_HOST,
                   es_port=settings.ES_PORT):
    """Cull old indices from Elasticsearch.

    Takes an index name prefix (ex: goldstone-) and a cutoff time in days
    Returns 0 or None if no cutoff was provided.
    """

    if cutoff is not None:
        cmd = "curator --host %s --port %s delete --prefix %s " \
              "--older-than %d" % (es_host, es_port, prefix, cutoff)
        return check_call(cmd.split())
    else:
        return "Cutoff was none, no action taken"


@celery_app.task()
def prune_es_indices():
    """Prune old events_* indices."""
    from subprocess import check_call

    for prefix in settings.PRUNE_INDICES:
        curator = ["curator",
                   "delete",
                   "indices",
                   "--prefix",
                   "%s" % prefix,
                   "--older-than",
                   "%d" % settings.PRUNE_OLDER_THAN,
                   "--time-unit",
                   "%s" % settings.PRUNE_TIME_UNITS,
                   "--timestring",
                   "%Y.%m.%d"]

    check_call(curator)


@celery_app.task()
def update_persistent_graph():
    """Update the Resource graph's persistent data from the current OpenStack
    cloud state.

    Nodes are:
       - deleted if they are no longer in the OpenStack cloud
       - added if they are in the OpenStack cloud, but not in the graph.
       - updated from the cloud if they are already in the graph.

    """
    from goldstone.cinder.utils import update_nodes as update_cinder_nodes
    from goldstone.glance.utils import update_nodes as update_glance_nodes
    from goldstone.keystone.utils import update_nodes as update_keystone_nodes
    from goldstone.nova.utils import update_nodes as update_nova_nodes

    update_cinder_nodes()
    update_glance_nodes()
    update_keystone_nodes()
    update_nova_nodes()


@celery_app.task()
def expire_auth_tokens():
    """Expire authorization tokens.

    This deletes all existing tokens, which will force every user to log in
    again.

    This should be replaced with djangorestframwork-timed-auth-token after we
    upgrade to Django 1.8.

    """
    from rest_framework.authtoken.models import Token

    Token.objects.all().delete()


@celery_app.task()
def log_event_search():
    """Check to see if any SavedSearch objects owned by the event system need
        to be executed.  If so, run them and create events for matching
        results."""

    owner = 'events'
    indices = 'logstash-*'

    # TODO need IDs for these things, else pycadf will gen a UUID.
    event_initiator = resource.Resource(typeURI="service/oss/monitoring",
                                        name="log_event_search")

    event_observer = event_initiator

    event_target = resource.Resource(typeURI="service/oss/monitoring",
                                     name="logging_service")

    # limit our searches to those owned by us, and concerned with logs
    saved_searches = SavedSearch.objects.filter(
        owner=owner, index_prefix=indices)

    # stub out the event
    e = event.Event(
        eventType=cadftype.EVENTTYPE_MONITOR,
        action='monitor',
        outcome=cadftaxonomy.OUTCOME_SUCCESS,
        name="goldstone.events.tasks.log_event_search")
    e.initiator = event_initiator
    e.observer = event_observer
    e.target = event_target

    for obj in saved_searches:
        # execute the search, and assuming no error, update the last_ times
        s, start, end = obj.search_recent()
        response = s.execute()
        if response.hits.total > 0:
            met = metric.Metric(metricId=obj.uuid, unit="count", name=obj.name)
            meas = measurement.Measurement(result=response.hits.total,
                                           metric=met)
            e.add_measurement(meas)

        obj.last_start = start
        obj.last_end = end
        obj.save()

    cadf = CADFEventDocType(event=e)
    return cadf.save()


@celery_app.task()
def check_for_pending_alerts():
    """
     Run an AlertSearch query to check for any pending alerts to be fired.
    """

    saved_alerts = AlertSearch.objects.all()

    for obj in saved_alerts:
        # execute the search, and assuming no error, update the last_ times
        s, start, end = obj.search_recent()
        response = s.execute()
        if response.hits.total > 0:
            # We have a non-zero match for pending alerts
            # Go ahead and generate an instance of the alert object here.
            # We can directly call the producer class to send an email

            now = arrow.utcnow().datetime

            msg_dict = obj.build_alert_template(hits=response.hits.total)

            # For this scheduled celery task, pick up the message template
            # from the query object and pass it along. For all other
            # cases, user is allowed to send custom msg_title and msg_body
            alert_obj = Alert(name=obj.name,
                              query=obj, msg_title=msg_dict['title'],
                              msg_body=msg_dict['body'])

            # Filter by fk = AlertSearch obj
            producer_rv_list = list()
            for producer in EmailProducer.objects.filter(query=obj):
                producer_ret = producer.send(alert_obj)
                producer_rv_list.append(producer_ret)

            # Update timestamps on the object for future searches to work.
            obj.last_start = start
            obj.last_end = end
            obj.save()
            alert_obj.save()

            return producer_rv_list
