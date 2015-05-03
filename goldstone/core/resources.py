"""Resource type and resource instance graph classes."""
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
from django.conf import settings
import networkx
from .models import User, Domain, Group, Token, Credential, Role, Region, \
    Endpoint, Service, Project, AvailabilityZone, FlavorExtraSpec, Aggregate, \
    Flavor, Keypair, Host, Hypervisor, Cloudpipe, ServerGroup, Server, \
    Interface, NovaLimits, Image, QuotaSet, QOSSpec, Snapshot, VolumeType, \
    Volume, Limits, MeteringLabelRule, MeteringLabel, NeutronQuota, \
    RemoteGroup, SecurityRules, SecurityGroup, Port, LBVIP, LBPool, \
    HealthMonitor, FloatingIP, FloatingIPPool, FixedIP, LBMember, Subnet, \
    Network, Router

# These are the types of resources in an OpenStack cloud.
RESOURCE_TYPES = [User, Domain, Group, Token, Credential, Role, Region,
                  Endpoint, Service, Project, AvailabilityZone,
                  FlavorExtraSpec, Aggregate, Flavor, Keypair, Host,
                  Hypervisor, Cloudpipe, ServerGroup, Server, Interface,
                  NovaLimits, Image, QuotaSet, QOSSpec, Snapshot, VolumeType,
                  Volume, Limits, MeteringLabelRule, MeteringLabel,
                  NeutronQuota, RemoteGroup, SecurityRules, SecurityGroup,
                  Port, LBVIP, LBPool, HealthMonitor, FloatingIP,
                  FloatingIPPool, FixedIP, LBMember, Subnet, Network, Router]

# Aliases to make the Resource Graph definitions less verbose.
TO = settings.R_ATTRIBUTE.TO
TYPE = settings.R_ATTRIBUTE.TYPE
EDGE_ATTRIBUTES = settings.R_ATTRIBUTE.EDGE_ATTRIBUTES


class GraphNode(object):
    """Resource graph nodes."""

    # The Goldstone UUID of the table row represented by this node.
    uuid = None

    # This node's Resource Type.
    resourcetype = None

    # This node's attributes (e.g., from a get_xxxxx_client() call).
    attributes = {}

    def __init__(self, **kwargs):
        """Initialize the object."""

        self.uuid = kwargs.get("uuid")
        self.resourcetype = kwargs.get("resourcetype")
        self.attributes = kwargs.get("attributes", {})


class Graph(object):
    """The base class for Resource Type and Resource graphs.

    This defines the navigational methods needed by the child classes. Some
    of these may simply be convenience methods for calling networkx methods.

    """

    def __init__(self):
        """Initialize the object.

        A child class must call this before its initialization.

        """

        self.graph = networkx.MultiDiGraph()

    def edges(self, edgetype):
        """Return all of the edges that are of type <edgetype>.

        :param edgetype: A type of edge
        :type edgetype: For Resource Type graphs, R_EDGE. For Resource
                        Instance graphs, ??????
        :return: A list of edges, all of which will be of type <edgetype>.
        :rtype: list of (from, to, attributes)

        """

        # N.B. We don't want to throw an exception if the attribute dict
        # doesn't have a "type" key.
        return [x for x in self.graph.edges(data=True)
                if x[2].get(TYPE) == edgetype]


class ResourceTypes(Graph):
    """A graph of an OpenStack cloud's resource types."""

    def __init__(self):
        """Initialize the object.

        :return: self.graph: A graph of the resource types within an OpenStack
                 cloud.

        """

        super(ResourceTypes, self).__init__()

        # Every resource type with >= one outgoing edge must define an
        # outgoing_edges() class method.
        #
        # Each entry in the value of outgoing_edges() is a control_dict.  Each
        # control_dict is:
        #
        #   TO: The destination type
        #   EDGE_ATTTRIBUTES: This edge's attributes:
        #       TYPE: The type of this edge
        #       MIN: A resource graph node has a minimum number of this edge
        #            type
        #       MAX: A resource graph node has a maximum number of this edge
        #            type
        #       MATCHING_FN: Callable(from_attr_dict, to_attr_dict).  If
        #                    there's a match between the from_node's and
        #                    to_node's attribute dicts, we draw a Resource
        #                    graph edge. Note: This must be prepared for absent
        #                    ekeys, and not throw exceptions.
        #
        # For every control_dict in every outgoing_edges list of every
        # resource type...
        for source_type in RESOURCE_TYPES:
            for control_dict in source_type.outgoing_edges():
                # (If an edge connects nodes not yet in the graph, the
                # nodes are automatically added.)
                self.graph.add_edge(source_type,
                                    control_dict[TO],
                                    attr_dict=control_dict[EDGE_ATTRIBUTES])

    @classmethod
    def get_type(cls, unique_id):
        """Return the type that matches a unique id.

        :param unique_id: A unique id
        :type unique_id: str
        :return: The matching type
        :rtype: Class, or None

        """

        result = [x for x in RESOURCE_TYPES if x.unique_id() == unique_id]
        return result[0] if result else None

    @property
    def edgetypes(self):       # pylint: disable=R0201
        """Return a list of the graph's edge types."""

        return settings.R_EDGE.keys()

resource_types = ResourceTypes()          # pylint: disable=C0103


class Resources(Graph):
    """A graph of the resources used within an OpenStack cloud."""

    def __init__(self):
        """Initialize the object."""

        super(Resources, self).__init__()

    def get_uuid(self, uuid):
        """Return the instance with this UUID.

        :param UUID: A resource graph UUID
        :type UUID: str
        :return: A node
        :rtype: GraphNode or None

        """

        for entry in self.graph.nodes():
            if entry.uuid == uuid:
                return entry

        return None

    def nodes_of_type(self, nodetype):
        """Return all the instances that are of type <nodetype>.

        :param nodetype: The Resource Type that is desired
        :type nodetype: A node in ResourceTypes
        :return: All the nodes in the Resources graph that have a type equal to
                 <nodetype>
        :rtype: list of node

        """

        return [x for x in self.graph.nodes() if x.resourcetype == nodetype]

    @staticmethod
    def locate(nodelist, source_fn, source_value):
        """Return a nodelist entry whose source_fn value matches source_value.

        N.B. This returns the first matching node, and does not check for
        multiple matches.

        :param nodelist: The nodes through which to search
        :type nodelist: Iterable of GraphNode
        :keyword source_fn: A function that takes one parameter, which is
                            applied to a node's attributes
        :type source_fn: Callable
        :keyword source_value: A value to match against.
        :type source_value: Anything. But probably a str
        :return: A nodelist entry that matched
        :rtype: GraphNode or None

        """

        for node in nodelist:
            if source_fn(node.attributes) == source_value:
                return node

        return None

    @property
    def edgetypes(self):         # pylint: disable=R0201
        """Return a list of the graph's edge types."""

        return settings.RI_EDGE.keys()


# Here's Goldstone's Resource Instance graph.
resources = Resources()       # pylint: disable=C0103
