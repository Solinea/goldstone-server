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
from goldstone.celery import app as celery_app
from celery.utils.log import get_task_logger
from goldstone.core.models import AlertDefinition, SavedSearch, \
    MonitoredService
from django.db.models import Q
from goldstone.models import es_conn
from goldstone.cinder.utils import update_nodes as update_cinder_nodes
from goldstone.glance.utils import update_nodes as update_glance_nodes
from goldstone.keystone.utils import update_nodes as update_keystone_nodes
from goldstone.nova.utils import update_nodes as update_nova_nodes
from goldstone.neutron.utils import update_nodes as update_neutron_nodes

# do not user get_task_logger here as it does not honor the Django settings
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
        {"prefix": "internal-", "time_string": "%Y.%m.%d"},
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

    graph_resource_funcs = [update_cinder_nodes,
                            update_glance_nodes,
                            update_keystone_nodes,
                            update_nova_nodes,
                            update_neutron_nodes]

    for f in graph_resource_funcs:
        try:
            f()
        except Exception as e:
            logger.exception(e)

    logger.info("update_persistent_graph task completed successfully")


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
def process_alerts():
    """Detect new alerts since the last run."""

    for alert_def in AlertDefinition.objects.all():
        try:
            # try to process all alert definitions
            search, start, end = alert_def.search.search_recent()
            result = search.execute()
            alert_def.evaluate(result.to_dict(), start, end)
        except Exception as e:
            logger.exception("failed to process %s" % alert_def)
            continue


def status_from_agg(host_buckets, host):
    service_buckets = [service['per_component']['buckets']
                       for service in host_buckets
                       if service['key'] == host][0]

    result = []
    for bucket in service_buckets:
        if bucket['doc_count'] > 0:
            state = MonitoredService.UP
        else:
            state = MonitoredService.DOWN

        result.append({"host": host,
                       "name": bucket['key'],
                       "state": state})
    return result


@celery_app.task()
def service_status_check():
    """Run the service status saved search, update any records, and log a
        message for any services with changed status.

        The response from the associated search has an aggregation that we
        can use to assess availablity.  It looks like this:

        "aggregations": {
              "per_host": {
                 "doc_count_error_upper_bound": 0,
                 "sum_other_doc_count": 0,
                 "buckets": [
                    {
                       "key": "rdo-kilo",
                       "doc_count": 13834,
                       "per_component": {
                          "doc_count_error_upper_bound": 0,
                          "sum_other_doc_count": 0,
                          "buckets": [
                             {
                                "key": "keystone",
                                "doc_count": 8810
                             },
                             {
                                "key": "neutron",
                                "doc_count": 2304
                             },
                             {
                                "key": "nova",
                                "doc_count": 1430
                             },
                             {
                                "key": "glance",
                                "doc_count": 614
                             },
                             {
                                "key": "cinder",
                                "doc_count": 338
                             }
                          ]
                       }
                    }
                 ]
              }
           }

        Current interpretation for a key would be:
            key missing = 'UNKNOWN'
            doc_count = 0 = 'DOWN'
            doc_count > 0 = 'UP'
        """

    # execute our search and get the results
    logger.info("Starting service status check")
    search_id = 'c7fa5f00-e851-4a71-9be0-7dbf8415426c'
    ss = SavedSearch.objects.get(uuid=search_id)
    search, start, end = ss.search_recent()
    # print "search = %s" % search.to_dict()
    result = search.execute().to_dict()

    # print "search_result = %s" % result

    # compare our results with existing MonitoredService records to see if
    # we have a state change.
    found_services_by_host = result['aggregations']['per_host']['buckets']
    monitored_services = MonitoredService.objects.all()

    found_hosts = set([rec['key'] for rec in found_services_by_host])
    monitored_hosts = set([service.host for service in monitored_services])

    new_hosts = found_hosts - monitored_hosts
    missing_hosts = monitored_hosts - found_hosts
    common_hosts = found_hosts.intersection(monitored_hosts)

    for host in new_hosts:
        # found a new host, so all services on it should be monitored.
        # also log a message to indicate a status change.
        statuses = status_from_agg(found_services_by_host, host)
        for status in statuses:
            MonitoredService(**status).save()
            logger.info("Service status update: service %s discovered on host "
                        "%s with state %s" %
                        (status['name'], status['host'], status['state']))

    for host in missing_hosts:

        # these hosts have disappeared from all ES records.  Possibly an old
        # host that has been curated out of all indices.  We'll set the state
        # of all services on the host to unknown.  A human may want to mark the
        # service as deleted at some point.

        missing_services = MonitoredService.objects.filter(
            ~Q(state=MonitoredService.UNKNOWN),
            host=host
        )
        for missing_service in missing_services:

            logger.info("Service status update: service %s on host "
                        "%s changed state from %s to %s" %
                        (missing_service.name,
                         missing_service.host,
                         missing_service.state,
                         MonitoredService.UNKNOWN))
            missing_service.state = MonitoredService.UNKNOWN
            missing_service.save()

    for host in common_hosts:

        # we still may known or missing services for a known host.  handle
        # those like above.  everything else is a comparison of state.

        host_services = MonitoredService.objects.filter(host=host)
        statuses = status_from_agg(found_services_by_host, host)

        for status in statuses:

            # process each of the status records in ES for this host

            if host_services.filter(name=status['name']).count() == 0:

                # this is a new service on the host.  Create a database entry
                # and log a message to be harvested by an AlertDefinition.

                MonitoredService(**status).save()

                logger.info(
                    "Service status update: service %s discovered on host "
                    "%s with state %s" %
                    (status['name'], status['host'], status['state']))

                continue

            # if we got here, there should be a record for this service

            service_rec = MonitoredService.objects.get(
                host=status['host'],
                name=status['name'])

            if service_rec.state != status['state']:

                # this is a state change. Update the database entry
                # and log a message to be harvested by an AlertDefinition.

                logger.info("Service status update: service %s on host "
                            "%s changed state from %s to %s" %
                            (service_rec.name,
                             service_rec.host,
                             service_rec.state,
                             status['state']))
                service_rec.state = status['state']
                service_rec.save()

    # if we got here, let's update the search time range
    ss.update_recent_search_window(start, end)
    logger.info("Finished service status check")



