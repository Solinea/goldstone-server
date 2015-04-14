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
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either expressed or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
from django.conf import settings
import logging
from subprocess import check_call

from goldstone.celery import app as celery_app

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
def reconcile_hosts():
    """Update the Resource graph nodes and edges from the current OpenStack
    cloud state.

    Nodes are:
       - deleted if they are no longer in the OpenStack cloud.
       - added if they are in the OpenStack cloud, but not in the graph.
       - updated from the cloud if they are already in the graph.

    """
    from goldstone.apps.glance.utils import reconcile_glance_hosts
    from goldstone.apps.nova.utils import reconcile_nova_hosts

    for services in [reconcile_glance_hosts, reconcile_nova_hosts]:
        services()
