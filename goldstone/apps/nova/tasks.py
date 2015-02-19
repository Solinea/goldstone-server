"""Nova tasks.

This module contains tasks related to the OpenStack Nova application.  They
are typically fired from celerybeat, but may also be triggered by an output
from logstash that writes to redis.

"""
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

from datetime import datetime
import json
import logging
import requests

from django.conf import settings
from goldstone.apps.api_perf.utils import openstack_api_request_base, \
    time_api_call

from goldstone.apps.nova.models import HypervisorStatsData, \
    AgentsData, AggregatesData, AvailZonesData, CloudpipesData, FlavorsData, \
    FloatingIpPoolsData, HostsData, HypervisorsData, NetworksData, \
    SecGroupsData, ServersData, ServicesData
from goldstone.celery import app as celery_app
from goldstone.utils import to_es_date, \
    get_region_for_nova_client

logger = logging.getLogger(__name__)


@celery_app.task(bind=True)
def nova_hypervisors_stats(self):
    from novaclient.v1_1 import client

    novaclient = client.Client(settings.OS_USERNAME,
                               settings.OS_PASSWORD,
                               settings.OS_TENANT_NAME,
                               settings.OS_AUTH_URL,
                               service_type="compute")
    response = \
        novaclient.hypervisors.statistics()._info     # pylint: disable=W0212

    now = datetime.utcnow()
    response['@timestamp'] = now.strftime(
        "%Y-%m-%dT%H:%M:%S." + str(int(round(now.microsecond/1000))) + "Z")

    response['task_id'] = self.request.id

    hvdb = HypervisorStatsData()
    hvdbid = hvdb.post(response)

    logger.debug("[hypervisor_stats] id = %s", hvdbid)


def time_hypervisor_show_api(url, headers):
    """

    :return:
    """
    return time_api_call('novav3.hypervisor.show', url, headers=headers)


@celery_app.task()
def time_hypervisor_list_api():
    """
    Call the hypervisor list command for the test tenant.  Retrieves the
    endpoint from keystone, then constructs the URL to call.  If there are
    hypervisors returned, then calls the hypervisor-show command on the first
    one, otherwise uses the results from hypervisor list to inserts a record
    in the DB.
    """

    image_list_precursor = openstack_api_request_base("computev3",
                                                      "/os-hypervisors")
    result = time_api_call('novav3.hypervisor.list',
                           image_list_precursor['url'],
                           headers=image_list_precursor['headers'])

    # check for existing volumes. if they exist, redo the call with a single
    # volume for a more consistent result.
    if result['response'] is not None and \
            result['response'].status_code == requests.codes.ok:
        body = json.loads(result['response'].text)
        if 'hypervisors' in body and len(body['hypervisors']) > 0:
            show_result = time_hypervisor_show_api(
                image_list_precursor['url'] + str(
                    body['hypervisors'][0]['id']),
                image_list_precursor['headers'])
            result = [result, show_result]

    return result


def _update_nova_records(rec_type, region, db, items):
    import pytz

    # image list is a generator, so we need to make it not sol lazy it...
    body = {"@timestamp": to_es_date(datetime.now(tz=pytz.utc)),
            "region": region,
            rec_type: [item.__dict__['_info'] for item in items]}
    try:
        db.post(body)
    except Exception:           # pylint: disable=W0703
        logging.exception("failed to index nova %s", rec_type)


@celery_app.task(bind=True)
def discover_nova_topology(self):
    """Contacts the configured OpenStack API endpoint and gathers Nova resource
    information.  Information is written to the daily goldstone index.

    :return: None

    """
    from goldstone.utils import get_nova_client

    nova_access = get_nova_client()

    nova_client = nova_access['client']
    nova_client.client.authenticate()

    reg = get_region_for_nova_client(nova_client)

    _update_nova_records("agents",
                         reg,
                         AgentsData(),
                         nova_client.agents.list())
    _update_nova_records("aggregates",
                         reg,
                         AggregatesData(),
                         nova_client.aggregates.list())
    _update_nova_records("availability_zones",
                         reg,
                         AvailZonesData(),
                         nova_client.availability_zones.list())
    _update_nova_records("cloudpipes",
                         reg,
                         CloudpipesData(),
                         nova_client.cloudpipe.list())
    _update_nova_records("flavors",
                         reg,
                         FlavorsData(),
                         nova_client.flavors.list())
    _update_nova_records("floating_ip_pools",
                         reg,
                         FloatingIpPoolsData(),
                         nova_client.floating_ip_pools.list())
    _update_nova_records("hosts", reg, HostsData(), nova_client.hosts.list())
    _update_nova_records("hypervisors",
                         reg,
                         HypervisorsData(),
                         nova_client.hypervisors.list())
    _update_nova_records("networks",
                         reg,
                         NetworksData(),
                         nova_client.networks.list())
    _update_nova_records("secgroups",
                         reg,
                         SecGroupsData(),
                         nova_client.security_groups.list())
    _update_nova_records("servers",
                         reg,
                         ServersData(),
                         nova_client.servers.list(
                             search_opts={'all_tenants': 1}))
    _update_nova_records("services",
                         reg,
                         ServicesData(),
                         nova_client.services.list())
