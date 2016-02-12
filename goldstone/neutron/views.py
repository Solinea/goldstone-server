"""Neutron app views.

This module contains all views for the OpenStack Neutron application.

"""
# Copyright 2015-2016 Solinea, Inc.
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

from __future__ import unicode_literals
from goldstone.core.utils import JsonReadOnlyView

from goldstone.neutron.models import AgentData, ExtensionData, RouterData, \
    NetworkData, QuotaData, SubnetData, SubnetPoolData, FloatingIPData, \
    PortData, SecurityGroupData, SecurityGroupRuleData


class AgentsDataView(JsonReadOnlyView):
    """Return neutron agent data.

    ---

    GET:
        parameters:
           - name: region
             description: The desired region.
             paramType: query

    """

    model = AgentData
    key = 'agents'


class ExtensionsDataView(JsonReadOnlyView):
    """Return neutron extension data.

    ---

    GET:
        parameters:
           - name: region
             description: The desired region.
             paramType: query

    """

    model = ExtensionData
    key = 'extensions'


class RouterDataView(JsonReadOnlyView):
    """Return neutron router data.

    ---

    GET:
        parameters:
           - name: region
             description: The desired region.
             paramType: query

    """

    model = RouterData
    key = 'routers'


class NetworkDataView(JsonReadOnlyView):
    """Return neutron network data.

    ---

    GET:
        parameters:
           - name: region
             description: The desired region.
             paramType: query

    """

    model = NetworkData
    key = 'networks'


class QuotaDataView(JsonReadOnlyView):
    """Return neutron quota data.

    ---

    GET:
        parameters:
           - name: region
             description: The desired region.
             paramType: query

    """

    model = QuotaData
    key = 'quotas'


class SubnetDataView(JsonReadOnlyView):
    """Return neutron subnet data.

    ---

    GET:
        parameters:
           - name: region
             description: The desired region.
             paramType: query

    """

    model = SubnetData
    key = 'subnets'


class SubnetPoolDataView(JsonReadOnlyView):
    """Return neutron subnet pool data.

    ---

    GET:
        parameters:
           - name: region
             description: The desired region.
             paramType: query

    """

    model = SubnetPoolData
    key = 'subnetpools'


class FloatingIPDataView(JsonReadOnlyView):
    """Return neutron floating IP data.

    ---

    GET:
        parameters:
           - name: region
             description: The desired region.
             paramType: query

    """

    model = FloatingIPData
    key = 'floatingips'


class PortDataView(JsonReadOnlyView):
    """Return neutron port data.

    ---

    GET:
        parameters:
           - name: region
             description: The desired region.
             paramType: query

    """

    model = PortData
    key = 'ports'


class SecurityGroupDataView(JsonReadOnlyView):
    """Return neutron security group data.

    ---

    GET:
        parameters:
           - name: region
             description: The desired region.
             paramType: query

    """

    model = SecurityGroupData
    key = 'securitygroups'


class SecurityGroupRuleDataView(JsonReadOnlyView):
    """Return neutron security group rule data.

    ---

    GET:
        parameters:
           - name: region
             description: The desired region.
             paramType: query

    """

    model = SecurityGroupRuleData
    key = 'securitygrouprules'
