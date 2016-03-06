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
from goldstone.core.models import AlertDefinition
from goldstone.models import es_conn
from goldstone.cinder.utils import update_nodes as update_cinder_nodes
from goldstone.glance.utils import update_nodes as update_glance_nodes
from goldstone.keystone.utils import update_nodes as update_keystone_nodes
from goldstone.nova.utils import update_nodes as update_nova_nodes
from goldstone.neutron.utils import update_nodes as update_neutron_nodes

logger = get_task_logger(__name__)


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
