"""Models for implementing directed resource graphs in Goldstone."""
# Copyright 2015 Solinea, Inc.
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
from polymorphic import PolymorphicModel
from django.db.models import CharField, IntegerField
from django_extensions.db.fields import UUIDField, CreationDateTimeField, \
    ModificationDateTimeField
from goldstone.utils import utc_now
import sys
import networkx

# Aliases to make the Resource Graph definitions less verbose.
MAX = settings.RT_ATTRIBUTE.MAX
MIN = settings.RT_ATTRIBUTE.MIN
TYPE = settings.RT_ATTRIBUTE.TYPE

ALLOCATED_TO = settings.RT_EDGE.ALLOCATED_TO
APPLIES_TO = settings.RT_EDGE.APPLIES_TO
ASSIGNED_TO = settings.RT_EDGE.ASSIGNED_TO
ATTACHED_TO = settings.RT_EDGE.ATTACHED_TO
CONSUMES = settings.RT_EDGE.CONSUMES
CONTAINS = settings.RT_EDGE.CONTAINS
DEFINES = settings.RT_EDGE.DEFINES
INSTANCE_OF = settings.RT_EDGE.INSTANCE_OF
MANAGES = settings.RT_EDGE.MANAGES
MEMBER_OF = settings.RT_EDGE.MEMBER_OF
OWNS = settings.RT_EDGE.OWNS
ROUTES_TO = settings.RT_EDGE.ROUTES_TO
SUBSCRIBED_TO = settings.RT_EDGE.SUBSCRIBED_TO
USES = settings.RT_EDGE.USES


class PolyResource(PolymorphicModel):
    """The base type for resources in Goldstone."""

    uuid = UUIDField(version=1, auto=True, primary_key=True)
    name = CharField(max_length=64, unique=True)
    created = CreationDateTimeField(editable=False,
                                    blank=True,
                                    default=utc_now)
    updated = ModificationDateTimeField(editable=True, blank=True)

    def _hashable(self):
        """Return a JSON representation of this row."""
        from rest_framework.renderers import JSONRenderer
        from .serializers import PolyResourceSerializer

        return JSONRenderer().render(PolyResourceSerializer(self).data)


class DirectedGraph(object):
    """The base class for Resource Type and Resource Instance graphs.

    This defines the navigational methods needed by the child classes. Some
    of these may simply be convenience methods for calling networkx methods.

    """

    def __init__(self):
        """Initialize the object.

        The child classes must call this before its initialization.

        """

        self.graph = networkx.DiGraph()

    def out_edges(self, nbunch):
        """Return the outgoing edges from a node or nodes.

        :param nbunch: Graph node(s)
        :type nbunch: A node in the graph, or list of nodes
        :return: All the outgoing edges from the node(s)
        :rtype: list of (from, to, attributes)

        """

        return self.graph.out_edges(nbunch, data=True)

    def in_edges(self, nbunch):
        """Return the incoming edges to a node or nodes.

        :param nbunch: Graph node(s)
        :type nbunch: A node in the graph, or list of nodes
        :return: All the incoming edges to the node(s)
        :rtype: list of (from, to, attributes)

        """

        return self.graph.in_edges(nbunch, data=True)

    def successors(self, node):
        """Return the adjacent sucessor nodes of a node.

        :param node: A graph node
        :return: All of the immediately adjacent successor nodes
        :rtype: list of nodes

        """

        return self.graph.successors(node)

    def predecessors(self, node):
        """Return the adjacent predecessor nodes of a node.

        :param node: A graph node
        :return: All of the immediately adjacent predecessor nodes
        :rtype: list of nodes

        """

        return self.graph.predecessors(node)

    def edges(self, edgetype):
        """Return all of the edges that are of type <edgetype>.

        :param edgetype: A type of edge
        :type edgetype: For Resource Type graphs, RT_EDGE. For Resource
                        Instance graphs, ??????
        :return: A list of edges, all of which will be of type <edgetype>.
        :rtype: list of (from, to, attributes)

        """

        # We do the list comprehension this way so that the right thing happens
        # if the attribute dict doesn't have a "type" key.

        return \
            [x for x in self.graph.edges(data=True)
             if x[2].get(TYPE) == edgetype]


#
# These nodes are for the Resource Instance graph.
#

class Agent(PolyResource):

    port = IntegerField(editable=True, blank=True, default=5514)


class KeystoneDomain(PolyResource):
    """ reflection of a domain in keystone"""

    pass


class KeystoneProject(PolyResource):
    """ reflection of a project in keystone"""

    pass


class KeystoneUser(PolyResource):
    """ reflection of a user in keystone"""

    pass


class KeystoneRole(PolyResource):
    """ reflection of a project in keystone"""

    pass


class NovaRegion(PolyResource):
    """ reflection of a hypervisor in nova"""

    pass


class NovaHost(PolyResource):
    """ reflection of a hypervisor in nova"""

    pass


class NovaHypervisor(PolyResource):
    """ reflection of a hypervisor in nova"""

    pass


class NovaServer(PolyResource):
    """ reflection of a server (VM) in nova"""

    pass


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


class AdminProject(PolyResource):
    """An OpenStack Admin project."""

    pass


class Project(PolyResource):
    """An OpenStack project."""

    pass


#
# These classes represent entities within a Nova service.
#

class AvailabilityZone(PolyResource):
    """An OpenStack Availability Zone."""

    pass


class FlavorExtraSpec(PolyResource):
    """An OpenStack Flavor ExtraSpec."""

    pass


class RootCert(PolyResource):
    """An OpenStack RootCert."""

    pass


class Aggregate(PolyResource):
    """An OpenStack Aggregate."""

    pass


class Flavor(PolyResource):
    """An OpenStack Flavor."""

    pass


class Keypair(PolyResource):
    """An OpenStack Keypair."""

    pass


class Host(PolyResource):
    """An Openstack host"""

    fqdn = CharField(max_length=255,
                     unique=True,
                     help_text="A fully-qualified domain name")


class Hypervisor(PolyResource):
    """An OpenStack Hypervisor."""

    virt_cpus = IntegerField(editable=True, blank=True, default=8)
    memory = IntegerField(editable=True, blank=True, default=8192)


class Cloudpipe(PolyResource):
    """An OpenStack Cloudpipe."""

    pass


class ServerGroup(PolyResource):
    """An OpenStack Server Group."""

    pass


class Server(PolyResource):
    """An OpenStack Server."""

    pass


class ServerMetadata(PolyResource):
    """An OpenStack Server Metadata."""

    pass


class Interface(PolyResource):
    """An OpenStack Interface."""

    pass


class NovaQuotaClass(PolyResource):
    """An OpenStack Quota Class within a Nova service."""

    pass


class NovaQuotaSet(PolyResource):
    """An OpenStack Quota Set within a Nova service."""

    pass


class NovaLimits(PolyResource):
    """An OpenStack Limits within a Nova service."""

    pass


#
# These classes represent entities within a Glance service.
#

class Image(PolyResource):
    """An OpenStack Image."""

    pass


#
# These classes represent entities within a Neutron service.
#

class MeteringLableRule(PolyResource):
    """An OpenStack Metering Lable Rule."""

    pass


class MeteringLabel(PolyResource):
    """An OpenStack Metering Label."""

    pass


class NeutronQuota(PolyResource):
    """An OpenStack Neutron Quota."""

    pass


class RemoteGroup(PolyResource):
    """An OpenStack Remote Group."""

    pass


class SecurityRules(PolyResource):
    """An OpenStack Security Rules."""

    pass


class SecurityGroup(PolyResource):
    """An OpenStack Security Group."""

    pass


class Port(PolyResource):
    """An OpenStack Port."""

    pass


class LBVIP(PolyResource):
    """An OpenStack load balancer VIP address."""

    pass


class LBPool(PolyResource):
    """An OpenStack load balancer pool."""

    pass


class HealthMonitor(PolyResource):
    """An OpenStack Health Monitor."""

    pass


class FloatingIP(PolyResource):
    """An OpenStack Floating IP address."""

    pass


class FloatingIPPool(PolyResource):
    """An OpenStack Floating IP address pool."""

    pass


class FixedIP(PolyResource):
    """An OpenStack Fixed IP address."""

    pass


class LBMember(PolyResource):
    """An OpenStack load balancer member."""

    pass


class Subnet(PolyResource):
    """An OpenStack subnet."""

    pass


class Network(PolyResource):
    """An OpenStack network."""

    pass


class Router(PolyResource):
    """An OpenStack router."""

    pass


class ResourceTypes(DirectedGraph):
    """A directed graph of the resource types used within an OpenStack
    cloud."""

    # These are the edges in the graph. If an edge connects nodes not yet in
    # the graph, the nodes are automatically added.
    #
    # Each one is an (f, t, d) 3-tuple:
    #   - f: The "from" node
    #   - t: The "to" node
    #   - d: The attribute dictionary.
    EDGES = [
        # From Keystone nodes
        (AdminProject, NovaQuotaClass, {TYPE: OWNS, MIN: 0, MAX: sys.maxint}),
        (AdminProject, Project, {TYPE: INSTANCE_OF, MIN: 1, MAX: 1}),
        (Credential, Project, {TYPE: ASSIGNED_TO, MIN: 1, MAX: 1}),
        (Domain, Group, {TYPE: CONTAINS, MIN: 0, MAX: sys.maxint}),
        (Domain, Project, {TYPE: CONTAINS, MIN: 0, MAX: sys.maxint}),
        (Domain, User, {TYPE: CONTAINS, MIN: 0, MAX: sys.maxint}),
        (Endpoint, Service, {TYPE: ASSIGNED_TO, MIN: 1, MAX: 1}),
        (Project, Image, {TYPE: MEMBER_OF, MIN: 0, MAX: sys.maxint}),
        (Project, Keypair, {TYPE: OWNS, MIN: 0, MAX: sys.maxint}),
        (Project, NovaLimits, {TYPE: OWNS, MIN: 1, MAX: 1}),
        (Project, NovaQuotaSet, {TYPE: SUBSCRIBED_TO,
                                 MIN: 0,
                                 MAX: sys.maxint}),
        (Project, RootCert, {TYPE: OWNS, MIN: 0, MAX: 1}),
        (Project, Server, {TYPE: OWNS, MIN: 1, MAX: sys.maxint}),
        (Project, MeteringLabel, {TYPE: OWNS, MIN: 0, MAX: sys.maxint}),
        (Project, NeutronQuota, {TYPE: SUBSCRIBED_TO, MIN: 1, MAX: 1}),
        (Project, Network, {TYPE: USES, MIN: 0, MAX: sys.maxint}),
        (Project, Network, {TYPE: OWNS, MIN: 0, MAX: sys.maxint}),
        (Project, Subnet, {TYPE: OWNS, MIN: 0, MAX: sys.maxint}),
        (Project, LBMember, {TYPE: OWNS, MIN: 0, MAX: sys.maxint}),
        (Project, HealthMonitor, {TYPE: OWNS, MIN: 0, MAX: sys.maxint}),
        (Project, LBVIP, {TYPE: OWNS, MIN: 0, MAX: sys.maxint}),
        (Project, Port, {TYPE: OWNS, MIN: 0, MAX: sys.maxint}),
        (Project, SecurityRules, {TYPE: OWNS, MIN: 0, MAX: sys.maxint}),
        (Region, AvailabilityZone, {TYPE: OWNS, MIN: 1, MAX: sys.maxint}),
        (Region, Endpoint, {TYPE: CONTAINS, MIN: 0, MAX: sys.maxint}),
        (Role, Domain, {TYPE: APPLIES_TO, MIN: 0, MAX: sys.maxint}),
        (Role, Group, {TYPE: ASSIGNED_TO, MIN: 0, MAX: sys.maxint}),
        (Role, Project, {TYPE: APPLIES_TO, MIN: 0, MAX: sys.maxint}),
        (Role, User, {TYPE: ASSIGNED_TO, MIN: 0, MAX: sys.maxint}),
        (Token, User, {TYPE: ASSIGNED_TO, MIN: 0, MAX: sys.maxint}),
        (User, Credential, {TYPE: CONTAINS, MIN: 0, MAX: sys.maxint}),
        (User, Group, {TYPE: ASSIGNED_TO, MIN: 0, MAX: sys.maxint}),
        (User, NovaQuotaSet, {TYPE: SUBSCRIBED_TO, MIN: 0, MAX: sys.maxint}),
        (User, Project, {TYPE: ASSIGNED_TO, MIN: 0, MAX: 1}),
        # From Nova nodes
        (AvailabilityZone, Aggregate, {TYPE: OWNS, MIN: 0, MAX: sys.maxint}),
        (AvailabilityZone, Host, {TYPE: OWNS, MIN: 0, MAX: sys.maxint}),
        (Cloudpipe, Server, {TYPE: INSTANCE_OF, MIN: 1, MAX: 1}),
        (Flavor, FlavorExtraSpec, {TYPE: OWNS, MIN: 0, MAX: sys.maxint}),
        (Flavor, Server, {TYPE: DEFINES, MIN: 0, MAX: sys.maxint}),
        (Host, Aggregate, {TYPE: MEMBER_OF, MIN: 0, MAX: sys.maxint}),
        (Host, Hypervisor, {TYPE: OWNS, MIN: 0, MAX: 1}),
        (Hypervisor, Server, {TYPE: OWNS, MIN: 0, MAX: sys.maxint}),
        (Interface, Port, {TYPE: ATTACHED_TO, MIN: 0, MAX: 1}),
        (Keypair, Server, {TYPE: ATTACHED_TO, MIN: 0, MAX: sys.maxint}),
        (NovaQuotaClass, NovaQuotaSet, {TYPE: DEFINES,
                                        MIN: 0,
                                        MAX: sys.maxint}),
        (Server, Interface, {TYPE: OWNS, MIN: 0, MAX: sys.maxint}),
        (Server, ServerGroup, {TYPE: MEMBER_OF, MIN: 0, MAX: sys.maxint}),
        (Server, ServerMetadata, {TYPE: OWNS, MIN: 0, MAX: sys.maxint}),
        # From Glance nodes
        (Image, Server, {TYPE: DEFINES, MIN: 0, MAX: sys.maxint}),
        # From Neutron nodes
        (FloatingIPPool, FixedIP, {TYPE: ROUTES_TO, MIN: 0, MAX: sys.maxint}),
        (FloatingIPPool, FloatingIP, {TYPE: OWNS, MIN: 0, MAX: sys.maxint}),
        (HealthMonitor, LBPool, {TYPE: APPLIES_TO, MIN: 0, MAX: sys.maxint}),
        (LBMember, LBPool, {TYPE: MEMBER_OF, MIN: 0, MAX: sys.maxint}),
        (LBMember, Subnet, {TYPE: ATTACHED_TO, MIN: 0, MAX: 1}),
        (LBVIP, LBPool, {TYPE: MEMBER_OF, MIN: 0, MAX: 1}),
        (LBVIP, Port, {TYPE: ATTACHED_TO, MIN: 0, MAX: 1}),
        (LBVIP, Subnet, {TYPE: ALLOCATED_TO, MIN: 0, MAX: 1}),
        (MeteringLableRule, MeteringLabel, {TYPE: APPLIES_TO, MIN: 1, MAX: 1}),
        (Port, FixedIP, {TYPE: CONSUMES, MIN: 0, MAX: sys.maxint}),
        (Port, FloatingIP, {TYPE: CONSUMES, MIN: 0, MAX: sys.maxint}),
        (Port, SecurityGroup, {TYPE: MEMBER_OF, MIN: 0, MAX: sys.maxint}),
        (Router, Network, {TYPE: ATTACHED_TO, MIN: 0, MAX: 1}),
        (Router, Port, {TYPE: ATTACHED_TO, MIN: 0, MAX: sys.maxint}),
        (SecurityRules, RemoteGroup, {TYPE: APPLIES_TO, MIN: 0, MAX: 1}),
        (SecurityRules, SecurityGroup, {TYPE: MEMBER_OF, MIN: 1, MAX: 1}),
        (Subnet, FixedIP, {TYPE: OWNS, MIN: 0, MAX: sys.maxint}),
        (Subnet, Network, {TYPE: MEMBER_OF, MIN: 1, MAX: 1}),
        ]

    def __init__(self):
        """Initialize the object.

        :return: self.graph: A graph of the resource types within an OpenStack
                 cloud.

        """

        super(ResourceTypes, self).__init__()

        # Add the nodes and edges.
        for source, dest, attribute in self.EDGES:
            self.graph.add_edge(source, dest, attribute)

    @property
    def edgetypes(self):
        """Return a list of the graph's edge types."""

        return settings.RT_EDGE.keys()


class ResourceInstances(DirectedGraph):
    """A directed graph of the resources used within a specific OpenStack
    cloud."""

    def __init__(self):
        """Initialize the object."""

        super(ResourceInstances, self).__init__()

    def instances(self, nodetype):
        """Return all the instances that are of type <nodetype>.

        :param nodetype: The Resource Type that is desired
        :type nodetype: A node in ResourceTypes
        :return: All the nodes in the Resource Instances graph that have a type
                 type equal to <nodetype>
        :rtype: list of ResourceInstances nodes

        """

        pass

    @property
    def edgetypes(self):
        """Return a list of the graph's edge types."""

        return settings.RI_EDGE.keys()
