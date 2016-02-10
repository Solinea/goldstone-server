"""Core tasks."""
# Copyright 2015 Solinea, Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
import logging
from django.conf import settings
import curator
from pycadf import event, cadftype, cadftaxonomy, resource, measurement, metric
from goldstone.celery import app as celery_app
from goldstone.core.models import SavedSearch, CADFEventDocType, AlertSearch, \
    Alert, EmailProducer, Producer
from goldstone.models import es_conn
import goldstone.cinder.utils as cinder_res
import goldstone.glance.utils as glance_res
import goldstone.keystone.utils as keystone_res
import goldstone.nova.utils as nova_res

logger = logging.getLogger(__name__)


@celery_app.task()
def prune_es_indices():
    """Prune ES indices older than the age defined in
    settings.PRUNE_OLDER_THAN."""

    curation_params = [
        {"prefix": "events_", "time_string": "%Y-%m-%d"},
        {"prefix": "logstash-", "time_string": "%Y.%m.%d"},
        {"prefix": "goldstone-", "time_string": "%Y.%m.%d"},
        {"prefix": "goldstone_metrics-", "time_string": "%Y.%m.%d"},
        {"prefix": "api_stats-", "time_string": "%Y.%m.%d"},
    ]

    client = es_conn()
    all_indices = curator.get_indices(client)
    deleted_indices = []
    working_list = all_indices  # we'll whittle this down with filters

    for index_set in curation_params:

        # filter on our prefix
        name_filter = curator.build_filter(
            kindOf='prefix', value=index_set['prefix'])

        # filter on the datestring
        age_filter = curator.build_filter(
            kindOf='older_than', time_unit='days',
            timestring=index_set['time_string'],
            value=settings.PRUNE_OLDER_THAN)

        # apply the filters to get the final list of indices to delete
        working_list = curator.apply_filter(working_list, **name_filter)
        working_list = curator.apply_filter(working_list, **age_filter)

        if working_list is not None and len(working_list) > 0:
            try:
                curator.delete_indices(client, working_list)
                deleted_indices = deleted_indices + working_list
            except Exception:
                logger.exception("curator.delete_indices raised an exception")

        working_list = all_indices  # reset for the next loop iteration

    return deleted_indices


@celery_app.task()
def update_persistent_graph():
    """Update the Resource graph's persistent data from the current OpenStack
    cloud state.

    Nodes are:
       - deleted if they are no longer in the OpenStack cloud
       - added if they are in the OpenStack cloud, but not in the graph.
       - updated from the cloud if they are already in the graph.

    """

    graph_resources = [cinder_res, glance_res, keystone_res, nova_res]

    for obj in graph_resources:
        try:
            obj.update_nodes()
        except Exception as e:
            logger.exception(str(e))


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
        obj.last_start = start
        obj.last_end = end
        obj.save()

        if response.hits.total > 0:
            # We have a non-zero match for pending alerts
            # Go ahead and generate an instance of the alert object here.
            # We can directly call the producer class to send an email

            msg_dict = obj.build_alert_template(hits=response.hits.total)

            # For this scheduled celery task, pick up the message template
            # from the query object and pass it along. For all other
            # cases, user is allowed to send custom msg_title and msg_body
            alert_obj = Alert(query=obj, msg_title=msg_dict['title'],
                              msg_body=msg_dict['body'])
            alert_obj.save()

            # Filter by fk = AlertSearch obj
            # dont throw an exception from this loop and keep retrying
            # till all the producers in the list are exhausted
            producer_rv_list = list()
            for producer in EmailProducer.objects.filter(query=obj):
                try:
                    producer_ret = producer.send(alert_obj)
                    ret_dict = {producer.query.name: producer_ret}
                except Exception as e:
                    ret_dict = {producer.query.name: e}
                    # Uncomment the lines below if we ever want to mark
                    # this task to be in retry state. For now, we don't
                    # mind that this task is marked success/failure.
                    # check_for_pending_alerts.retry(throw=False)
                    # raise RetryTaskError(None, None)
                producer_rv_list.append(ret_dict)

            return producer_rv_list
