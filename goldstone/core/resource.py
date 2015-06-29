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
from datetime import timedelta, datetime
from django.conf import settings
import logging
import networkx
from .models import User, Domain, Group, Token, Credential, Role, Region, \
    Endpoint, Service, Project, AvailabilityZone, Aggregate, \
    Flavor, Keypair, Host, Hypervisor, Cloudpipe, ServerGroup, Server, \
    Interface, NovaLimits, Image, QuotaSet, QOSSpec, Snapshot, VolumeType, \
    Volume, Limits, MeteringLabelRule, MeteringLabel, NeutronQuota, \
    RemoteGroup, SecurityRules, SecurityGroup, Port, LBVIP, LBPool, \
    HealthMonitor, FloatingIP, FloatingIPPool, FixedIP, LBMember, Subnet, \
    Network, Router

# These are the types of resources in an OpenStack cloud.
RESOURCE_TYPES = [User, Domain, Group, Token, Credential, Role, Region,
                  Endpoint, Service, Project, AvailabilityZone,
                  Aggregate, Flavor, Keypair, Host,
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

logger = logging.getLogger(__name__)


class Graph(object):
    """The base class for Resource Type and Instance graphs.

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


class Types(Graph):
    """A graph of an OpenStack cloud's resource types."""

    def __init__(self):
        """Initialize the object.

        :return: self.graph: A graph of the resource types within an OpenStack
                 cloud.

        """

        super(Types, self).__init__()

        # Every resource type has an outgoing_edges() class method.
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

        for entry in RESOURCE_TYPES:
            if entry.unique_class_id() == unique_id:
                return entry

        return None

    @property
    def edgetypes(self):       # pylint: disable=R0201
        """Return a list of the graph's edge types."""

        return settings.R_EDGE.keys()


# This is Goldstone's resource type graph.
types = Types()                      # pylint: disable=C0103


class Instances(Graph):
    """An in-memory navigable graph of the resources used within an OpenStack
    cloud.

    The correct way to import the graph is:

         from goldstone.core import resource
         foo = resource.instances...

    If you use, "from resources import instances," instances is added to the
    local namespace, and it won't work as you expect.

    The persistent data is held in the db, which is periodically updated by a
    celery task. This lazy-evaluates when to update the in-memory graph from
    the db data.

    """

    # How often to refresh the graph from the database.
    PERIOD = timedelta(minutes=15)

    def __init__(self):
        """Initialize the object.

        We deliberately do not call the parent class' __init__, because it
        creates self.graph. This class uses lazy evaluation of the graph
        object, and self.graph is a property here!

        """

        # The internal graph object
        self._graph = None

        # When the graph object was last updated.
        self._timestamp = datetime.now()

    @staticmethod
    def unpack():
        """Return a graph object representing the persistent graph data.

        Unpacking the graph will be so fast that the probability of a graph
        state shear (with the celery task that updates the graph) should be
        very small. If it happens in practice, a simple solution would be to
        lock the db table.

        """
        from .models import PolyResource

        def get_uuid(uuid):
            """Return the graph node having this UUID.

            :param UUID: A resource graph UUID
            :type UUID: str
            :return: A node
            :rtype: GraphNode or None

            """

            for entry in graph.nodes():
                if entry.uuid == uuid:
                    return entry

            return None

        # Start with an empty graph.
        graph = networkx.MultiDiGraph()

        # Collect the table nodes once.
        nodes = PolyResource.objects.all()

        # Create all the nodes.
        for node in nodes:
            graph.add_node(GraphNode(uuid=node.uuid,
                                     resourcetype=type(node),
                                     attributes=node.cloud_attributes))

        # Create all the edges.
        for node in nodes:
            for edge in node.edges:
                # Get the source and destination nodes in the graph.
                source_node = get_uuid(node.uuid)
                dest_node = get_uuid(edge[0])

                # If either aren't there, we have a database inconsistency. Log
                # it as evidence of a db shear, and skip this edge.
                if not source_node or not dest_node:
                    logger.warning("Missing source or destination node in "
                                   "unpacked graph state: source uuid %s, "
                                   "source native_id %s, source native_name "
                                   "%s, source edges %s, source created %s",
                                   node.uuid,
                                   node.native_id,
                                   node.native_name,
                                   node.edges,
                                   node.created)
                    continue

                # Create the edge.
                graph.add_edge(source_node, dest_node, attr_dict=edge[1])

        return graph

    @property
    def graph(self):
        """Return a lazy-evaluated graph object.

        The graph is unpacked from the database if it's never been unpacked, or
        if was last unpacked more than N time units ago. The next effect is,
        the unpack expense doesn't happen until it's needed, and the object is
        periodically refreshed if the in-memory object lives long enough.

        """

        if self._graph is None or \
           self._timestamp + self.PERIOD < datetime.now():
            # Unpack the graph from the database, and reset the timestamp.
            self._graph = self.unpack()
            self._timestamp = datetime.now()

        return self._graph

    def get_uuid(self, uuid):
        """Return the node having this UUID.

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
        :type nodetype: A node in Types
        :return: All the nodes in the Instances graph that have a type equal to
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
instances = Instances()                         # pylint: disable=C0103


class GraphNode(object):
    """A Resource graph node."""

    # This node's Goldstone UUID.
    uuid = None

    # This node's Resource Type.
    resourcetype = None

    # This node's attributes. E.g., from get_xxxxx_client().
    attributes = {}

    def __init__(self, **kwargs):
        """Initialize the object."""

        self.uuid = kwargs.get("uuid")
        self.resourcetype = kwargs.get("resourcetype")
        self.attributes = kwargs.get("attributes", {})
