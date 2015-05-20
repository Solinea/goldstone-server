"""Nova tasks.

This module contains tasks related to the OpenStack Nova application.  They
are typically fired from celerybeat, but may also be triggered by an output
from logstash that writes to redis.

"""
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
from __future__ import absolute_import

import logging

from goldstone.nova.models import AgentsData, AggregatesData, \
    AvailZonesData, CloudpipesData, FlavorsData, \
    FloatingIpPoolsData, HostsData, HypervisorsData, NetworksData, \
    SecGroupsData, ServersData, ServicesData
from goldstone.core.models import Host, MetricData
from goldstone.celery import app as celery_app
from goldstone.utils import get_region_for_nova_client


logger = logging.getLogger(__name__)


@celery_app.task()
def nova_hypervisors_stats():
    """Get stats from the nova API and add them as Goldstone metrics."""
    from goldstone.utils import get_nova_client
    from goldstone.models import es_conn, daily_index
    import arrow

    novaclient = get_nova_client()['client']
    response = \
        novaclient.hypervisors.statistics()._info     # pylint: disable=W0212
    region = get_region_for_nova_client(novaclient)
    metric_prefix = 'nova.hypervisor.'
    now = arrow.utcnow()
    conn = es_conn()
    es_index = daily_index(MetricData.INDEX_PREFIX)
    es_doc_type = MetricData._doc_type.name

    for key, value in response.items():
        doc = {
            'type': es_doc_type,
            'name': metric_prefix + key,
            'value': value,
            'metric_type': 'gauge',
            '@timestamp': now.isoformat(),
            'region': region
        }

        if key in ['disk_available_least', 'free_disk_gb', 'local_gb',
                   'local_gb_used']:
            doc['unit'] = 'GB'
        elif key in ['free_ram_mb', 'memory_mb', 'memory_mb_used']:
            doc['unit'] = 'MB'
        else:
            doc['unit'] = 'count'

        conn.create(es_index, es_doc_type, doc)


def _update_nova_records(rec_type, region, db, items):

    from goldstone.utils import to_es_date
    import arrow

    # image list is a generator, so we need to make it not sol lazy it...
    body = {"@timestamp": to_es_date(arrow.utcnow().datetime),
            "region": region,
            rec_type: [item.__dict__['_info'] for item in items]}
    try:
        db.post(body)
    except Exception:           # pylint: disable=W0703
        logging.exception("failed to index nova %s", rec_type)


@celery_app.task()
def discover_nova_topology():
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


#
# This is the beginning of the new polymorphic resource model support
#

def reconcile_hosts():
    """Compares Goldstone's knowledge of nova hosts to source clouds.

    If a new host is found in the cloud, a model instance is created, if a host
    has been removed from the cloud, the

    :return: None

    """

    # UGLINESS AHEAD
    # Nova has no problem showing you multiple instance of the same host.  If
    # a host shows up multiple times in the list, it probably has multiple
    # service running on it.  We'll dedup this for them and link back here with
    # our graph from the value of service.host.
    #
    # Rsyslog is really hesitant to allow FQDN to be used in the message, so
    # all the logs going in to Logstash will only have the short name --
    # unless it gets configured really badly and only sends the IP address :-(
    # So, we'll set a short_name field to use for the name, and set an fqdn
    # field if available.
    #
    # Relations available here are service and zone, both are single values.

    hosts = get_nova_host_list()
    incoming = frozenset([host.host_name for host in hosts])
    incoming = frozenset([parse_host_name(host_name)
                          for host_name in incoming])
    incoming_names = frozenset([item[0] for item in incoming])
    existing_names = frozenset([host.name for host in Host.objects.all()])

    # now let's find out if we have new or missing hosts
    new = incoming_names.difference(existing_names)
    missing = existing_names.difference(incoming_names)

    # delete missing hosts from our model
    for host_name in missing:
        Host.objects.filter(native_name=host_name).delete()

    # create new hosts in our model
    for host_name in new:
        Host.objects.create(
            native_name=host_name,
            fqdn=[item[1] for item in incoming if item[0] == host_name][0])


def get_nova_host_list():
    """Retrieve a list of hosts from nova."""
    from goldstone.utils import get_nova_client

    nova_access = get_nova_client()
    nova_client = nova_access['client']
    nova_client.client.authenticate()
    return nova_client.hosts.list()


def parse_host_name(host_name):
    """Where possible, generate the fqdn and simple hostnames for the param.

    :type host_name: str
    :param host_name: an ip address, fqdn, or simple host name
    :rtype tuple
    :return simple name, fqdn

    """
    from goldstone.utils import is_ip_addr, partition_hostname

    fqdn = None

    if not is_ip_addr(host_name):
        parts = partition_hostname(host_name)

        if parts['domainname'] is not None:
            fqdn = host_name
            host_name = parts['hostname']

    return host_name, fqdn
