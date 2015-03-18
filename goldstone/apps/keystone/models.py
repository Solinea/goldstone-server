"""Keystone models."""
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
from goldstone.apps.core.models import PolyResource
from goldstone.models import TopologyData
import sys


class EndpointsData(TopologyData):
    _DOC_TYPE = 'keystone_endpoint_list'
    _INDEX_PREFIX = 'goldstone-'


class RolesData(TopologyData):
    _DOC_TYPE = 'keystone_role_list'
    _INDEX_PREFIX = 'goldstone-'


class ServicesData(TopologyData):
    _DOC_TYPE = 'keystone_service_list'
    _INDEX_PREFIX = 'goldstone-'


class TenantsData(TopologyData):
    _DOC_TYPE = 'keystone_tenant_list'
    _INDEX_PREFIX = 'goldstone-'


class UsersData(TopologyData):
    _DOC_TYPE = 'keystone_user_list'
    _INDEX_PREFIX = 'goldstone-'


#
# This is the beginning of the new polymorphic resource model support
#
# These classes represent entities within a Keystone service.
#

class User(PolyResource):
    """An OpenStack user."""

    pass


class Domain(PolyResource):
    """An OpenStack domain."""

    pass


class Group(PolyResource):
    """An OpenStack group."""

    pass


class Token(PolyResource):
    """An OpenStack token."""

    pass


class Credential(PolyResource):
    """An OpenStack credential."""

    pass


class Role(PolyResource):
    """An OpenStack role."""

    pass


class Region(PolyResource):
    """An OpenStack region."""

    pass


class Endpoint(PolyResource):
    """An OpenStack endpoint."""

    pass


class Service(PolyResource):
    """An OpenStack service."""

    pass


class Project(PolyResource):
    """An OpenStack project."""

    pass

# Aliases to make the Resource Graph definitions, below, less verbose.
TYPE = settings.RT_ATTRIBUTE.TYPE
MIN = settings.RT_ATTRIBUTE.MIN
MAX = settings.RT_ATTRIBUTE.MAX
CONTAINS = settings.RT_EDGE.CONTAINS
ASSIGNED_TO = settings.RT_EDGE.ASSIGNED_TO
APPLIES_TO = settings.RT_EDGE.APPLIES_TO


class KeystoneResourceTypes(object):
    """A class of the directed graph of resources used within a Keystone
    service."""

    # This defines the resource types within Keystone.
    #
    # "nodes": A list of nodes. Each entry should be a type.
    #
    # "edges": A list of 3-tuples. Each (f, t, d) tuple is:
    #   - f: The "from" node
    #   - t: The "to" node
    #   - d: The attribute dictionary.
    RESOURCE_TYPES = {
        "nodes": [User, Domain, Group, Token, Credential, Role, Region,
                  Endpoint, Service, Project],
        "edges":
        [(Domain, User, {TYPE: CONTAINS, MIN: 0, MAX: sys.maxint}),
         (Domain, Group, {TYPE: CONTAINS, MIN: 0, MAX: sys.maxint}),
         (Domain, Project, {TYPE: CONTAINS, MIN: 0, MAX: sys.maxint}),
         (User, Group, {TYPE: ASSIGNED_TO, MIN: 0, MAX: sys.maxint}),
         (User, Project, {TYPE: ASSIGNED_TO, MIN: 0, MAX: 1}),
         (User, Credential, {TYPE: CONTAINS, MIN: 0, MAX: sys.maxint}),
         (Token, User, {TYPE: ASSIGNED_TO, MIN: 0, MAX: sys.maxint}),
         (Credential, Project, {TYPE: ASSIGNED_TO, MIN: 1, MAX: 1}),
         (Role, User, {TYPE: ASSIGNED_TO, MIN: 0, MAX: sys.maxint}),
         (Role, Group, {TYPE: ASSIGNED_TO, MIN: 0, MAX: sys.maxint}),
         (Role, Domain, {TYPE: APPLIES_TO, MIN: 0, MAX: sys.maxint}),
         (Role, Project, {TYPE: APPLIES_TO, MIN: 0, MAX: sys.maxint}),
         (Region, Endpoint, {TYPE: CONTAINS, MIN: 0, MAX: sys.maxint}),
         (Endpoint, Service, {TYPE: ASSIGNED_TO, MIN: 1, MAX: 1}),
         ]}

    def __init__(self):
        """Initialize the object.

        :return: self.graph: A graph of the resource types within Keystone

        """
        import networkx

        self.graph = networkx.DiGraph()

        # Add the nodes
        for entry in self.RESOURCE_TYPES["nodes"]:
            self.graph.add_node(entry)

        # Add the edges.
        for source, dest, attribute in self.RESOURCE_TYPES["edges"]:
            self.graph.add_edge(source, dest, attribute)
