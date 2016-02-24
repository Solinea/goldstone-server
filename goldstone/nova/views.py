"""Nova app views.

This module contains all views for the OpenStack Nova application.

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
from __future__ import unicode_literals

import logging

from .models import AgentsData, AggregatesData, AvailZonesData, \
    CloudpipesData, NetworksData, SecGroupsData, ServersData, ServicesData, \
    FlavorsData, FloatingIpPoolsData, HostsData, HypervisorsData
from goldstone.core.utils import JsonReadOnlyView

logger = logging.getLogger(__name__)


# Our API documentation extracts this docstring, hence the use of markup.
class AgentsDataView(JsonReadOnlyView):
    """Return Agents data.

    ---

    GET:
        parameters:
           - name: region
             description: The desired region.
             paramType: query
           - name: zone
             description: The desired zone.
             paramType: query

    """

    model = AgentsData
    key = 'agents'


# Our API documentation extracts this docstring, hence the use of markup.
class AggregatesDataView(JsonReadOnlyView):
    """Return Aggregates data.

    ---

    GET:
        parameters:
           - name: region
             description: The desired region.
             paramType: query
           - name: zone
             description: The desired zone.
             paramType: query

    """

    model = AggregatesData
    key = 'aggregates'
    zone_key = 'availability_zone'


# Our API documentation extracts this docstring, hence the use of markup.
class AvailZonesDataView(JsonReadOnlyView):
    """Return Availability Zones data.

    ---

    GET:
        parameters:
           - name: region
             description: The desired region.
             paramType: query
           - name: zone
             description: The desired zone.
             paramType: query

    """

    model = AvailZonesData
    key = 'availability_zones'


# Our API documentation extracts this docstring, hence the use of markup.
class CloudpipesDataView(JsonReadOnlyView):
    """Return Cloudpipes data.

    ---

    GET:
        parameters:
           - name: region
             description: The desired region.
             paramType: query
           - name: zone
             description: The desired zone.
             paramType: query

    """

    model = CloudpipesData
    key = 'cloudpipes'


# Our API documentation extracts this docstring, hence the use of markup.
class FlavorsDataView(JsonReadOnlyView):
    """Return Flavors data.

    ---

    GET:
        parameters:
           - name: region
             description: The desired region.
             paramType: query
           - name: zone
             description: The desired zone.
             paramType: query

    """

    model = FlavorsData
    key = 'flavors'


# Our API documentation extracts this docstring, hence the use of markup.
class FloatingIpPoolsDataView(JsonReadOnlyView):
    """Return Floating IP Pool data.

    ---

    GET:
        parameters:
           - name: region
             description: The desired region.
             paramType: query
           - name: zone
             description: The desired zone.
             paramType: query

    """

    model = FloatingIpPoolsData
    key = 'floating_ip_pools'


# Our API documentation extracts this docstring, hence the use of markup.
class HostsDataView(JsonReadOnlyView):
    """Return hosts data.

    ---

    GET:
        parameters:
           - name: region
             description: The desired region.
             paramType: query
           - name: zone
             description: The desired zone.
             paramType: query

    """

    model = HostsData
    key = 'hosts'
    zone_key = 'zone'


# Our API documentation extracts this docstring, hence the use of markup.
class HypervisorsDataView(JsonReadOnlyView):
    """Return Hypervisor data.

    ---

    GET:
        parameters:
           - name: region
             description: The desired region.
             paramType: query
           - name: zone
             description: The desired zone.
             paramType: query

    """

    model = HypervisorsData
    key = 'hypervisors'


# Our API documentation extracts this docstring, hence the use of markup.
class NetworksDataView(JsonReadOnlyView):
    """Return Networks data.

    ---

    GET:
        parameters:
           - name: region
             description: The desired region.
             paramType: query
           - name: zone
             description: The desired zone.
             paramType: query

    """

    model = NetworksData
    key = 'networks'


# Our API documentation extracts this docstring, hence the use of markup.
class SecGroupsDataView(JsonReadOnlyView):
    """Return SecurityGroups data.

    ---

    GET:
        parameters:
           - name: region
             description: The desired region.
             paramType: query
           - name: zone
             description: The desired zone.
             paramType: query

    """

    model = SecGroupsData
    key = 'secgroups'


# Our API documentation extracts this docstring, hence the use of markup.
class ServersDataView(JsonReadOnlyView):
    """Return Servers data.

    ---

    GET:
        parameters:
           - name: region
             description: The desired region.
             paramType: query
           - name: zone
             description: The desired zone.
             paramType: query
    """

    model = ServersData
    key = 'servers'
    zone_key = 'OS-EXT-AZ:availability_zone'


# Our API documentation extracts this docstring, hence the use of markup.
class ServicesDataView(JsonReadOnlyView):
    """Return Services data.

    ---

    GET:
        parameters:
           - name: region
             description: The desired region.
             paramType: query
           - name: zone
             description: The desired zone.
             paramType: query

    """

    model = ServicesData
    key = 'services'
    zone_key = 'zone'
