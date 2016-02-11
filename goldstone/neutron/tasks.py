"""Neutron app tasks."""
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

from goldstone.celery import app as celery_app
from .models import AgentData, ExtensionData, SubnetPoolData, RouterData, \
    NetworkData, SubnetData, FloatingIPData, PortData, SecurityGroupData, \
    SecurityGroupRuleData, QuotaData


def _update_neutron_records(rec_type, region, database, items):
    from goldstone.utils import to_es_date
    import arrow

    body = {"@timestamp": to_es_date(arrow.utcnow().datetime),
            "region": region,
            rec_type: items.values()[0]}
    try:
        database.post(body)
    except Exception:           # pylint: disable=W0703
        logging.exception("failed to index neutron %s", rec_type)


@celery_app.task()
def discover_neutron_topology():
    from goldstone.keystone.utils import get_region
    from goldstone.neutron.utils import get_client

    client = get_client()
    reg = get_region()

    _update_neutron_records("agents",
                            reg,
                            AgentData(),
                            client.list_agents())
    _update_neutron_records("extensions",
                            reg,
                            ExtensionData(),
                            client.list_extensions())
    _update_neutron_records("floatingips",
                            reg,
                            FloatingIPData(),
                            client.list_floatingips())
    _update_neutron_records("networks",
                            reg,
                            NetworkData(),
                            client.list_networks())
    _update_neutron_records("ports",
                            reg,
                            PortData(),
                            client.list_ports())
    _update_neutron_records("quotas",
                            reg,
                            QuotaData(),
                            client.list_quotas())
    _update_neutron_records("routers",
                            reg,
                            RouterData(),
                            client.list_routers())
    _update_neutron_records("securitygroups",
                            reg,
                            SecurityGroupData(),
                            client.list_security_groups())
    _update_neutron_records("securitygrouprules",
                            reg,
                            SecurityGroupRuleData(),
                            client.list_security_group_rules())
    _update_neutron_records("subnetpools",
                            reg,
                            SubnetPoolData(),
                            client.list_subnetpools())
    _update_neutron_records("subnets",
                            reg,
                            SubnetData(),
                            client.list_subnets())
