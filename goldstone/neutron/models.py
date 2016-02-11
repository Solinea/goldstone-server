"""Neutron app models."""
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
from goldstone.models import TopologyData


class AgentData(TopologyData):
    """Return data from ES about routers"""
    _DOC_TYPE = 'neutron_agent_list'
    _INDEX_PREFIX = 'goldstone-'


class ExtensionData(TopologyData):
    """Return data from ES about routers"""
    _DOC_TYPE = 'neutron_extension_list'
    _INDEX_PREFIX = 'goldstone-'


class RouterData(TopologyData):
    """Return data from ES about routers"""
    _DOC_TYPE = 'neutron_router_list'
    _INDEX_PREFIX = 'goldstone-'


class NetworkData(TopologyData):
    """Return data from ES about networks"""
    _DOC_TYPE = 'neutron_network_list'
    _INDEX_PREFIX = 'goldstone-'


class QuotaData(TopologyData):
    """Return data from ES about networks"""
    _DOC_TYPE = 'neutron_quota_list'
    _INDEX_PREFIX = 'goldstone-'


class SubnetData(TopologyData):
    """Return data from ES about subnets"""
    _DOC_TYPE = 'neutron_subnet_list'
    _INDEX_PREFIX = 'goldstone-'


class SubnetPoolData(TopologyData):
    """Return data from ES about subnets"""
    _DOC_TYPE = 'neutron_subnetpool_list'
    _INDEX_PREFIX = 'goldstone-'


class FloatingIPData(TopologyData):
    """Return data from ES about floating IP data"""
    _DOC_TYPE = 'neutron_floatingip_list'
    _INDEX_PREFIX = 'goldstone-'


class PortData(TopologyData):
    """Return data from ES about port data"""
    _DOC_TYPE = 'neutron_port_list'
    _INDEX_PREFIX = 'goldstone-'


class SecurityGroupData(TopologyData):
    """Return data from ES about security groups"""
    _DOC_TYPE = 'neutron_securitygroup_list'
    _INDEX_PREFIX = 'goldstone-'


class SecurityGroupRuleData(TopologyData):
    """Return data from ES about security rules"""
    _DOC_TYPE = 'neutron_securitygrouprule_list'
    _INDEX_PREFIX = 'goldstone-'
