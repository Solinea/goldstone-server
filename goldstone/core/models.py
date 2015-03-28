"""Core models."""
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
from django.db.models import CharField, IntegerField
from django_extensions.db.fields import UUIDField, CreationDateTimeField, \
    ModificationDateTimeField
from polymorphic import PolymorphicModel
from goldstone.apps.drfes.models import DailyIndexDocType
from goldstone.apps.logging.models import LogData, LogEvent
from goldstone.utils import utc_now, get_keystone_client, get_nova_client

from elasticsearch_dsl.query import Q, QueryString
import networkx
import sys

# Aliases to make the Resource Graph definitions less verbose.
MAX = settings.R_ATTRIBUTE.MAX
MIN = settings.R_ATTRIBUTE.MIN
TO = settings.R_ATTRIBUTE.TO
TYPE = settings.R_ATTRIBUTE.TYPE
USE_CLIENT = settings.R_ATTRIBUTE.USE_CLIENT
MATCHING_ATTRIBUTES = settings.R_ATTRIBUTE.MATCHING_ATTRIBUTES
EDGE_ATTRIBUTES = settings.R_ATTRIBUTE.EDGE_ATTRIBUTES

ALLOCATED_TO = settings.R_EDGE.ALLOCATED_TO
APPLIES_TO = settings.R_EDGE.APPLIES_TO
ASSIGNED_TO = settings.R_EDGE.ASSIGNED_TO
ATTACHED_TO = settings.R_EDGE.ATTACHED_TO
CONSUMES = settings.R_EDGE.CONSUMES
CONTAINS = settings.R_EDGE.CONTAINS
DEFINES = settings.R_EDGE.DEFINES
INSTANCE_OF = settings.R_EDGE.INSTANCE_OF
MANAGES = settings.R_EDGE.MANAGES
MEMBER_OF = settings.R_EDGE.MEMBER_OF
OWNS = settings.R_EDGE.OWNS
ROUTES_TO = settings.R_EDGE.ROUTES_TO
SUBSCRIBED_TO = settings.R_EDGE.SUBSCRIBED_TO
USES = settings.R_EDGE.USES


#
# Goldstone Agent Metrics and Reports
#

class MetricData(DailyIndexDocType):
    """Search interface for an agent generated metric."""

    INDEX_PREFIX = 'goldstone_metrics-'

    class Meta:
        doc_type = 'core_metric'


class ReportData(DailyIndexDocType):

    INDEX_PREFIX = 'goldstone_reports-'

    class Meta:
        doc_type = 'core_report'


class PolyResource(PolymorphicModel):
    """The base type for resources.

    These are stored in the database.

    """

    # This object's Goldstone UUID.
    uuid = UUIDField(version=1, auto=True, primary_key=True)

    # This object's OpenStack UUID. Depending upon the service, it may be
    # missing, or not unique.
    cloud_id = CharField(max_length=128, blank=True)

    name = CharField(max_length=64)

    created = CreationDateTimeField(editable=False,
                                    blank=True,
                                    default=utc_now)
    updated = ModificationDateTimeField(editable=True, blank=True)

    def logs(self):
        """Return a search object for logs related to this resource.

        The default implementation just looks for the name of the resource
        in any of the fields.

        """

        query = Q(QueryString(query=self.name))
        return LogData.search().query(query)

    def events(self):
        """Return a search object for events related to this resource.

        The default implementation looks for logging event types with this
        resource name appearing in any field.

        """

        # this protects our hostname from being tokenized
        escaped_name = r'"' + self.name + r'"'

        name_query = Q(QueryString(query=escaped_name, default_field="_all"))
        return LogEvent.search().query(name_query)

    # TODO: Uncomment these when they're implemented in the subclasses, or
    # delete them to avoid pylint warnings.
    #
    # def fresh_config(self):
    #     """Return configuration from source system for this resource."""

    #     raise NotImplementedError("Override this method in a subclass")

    # def historical_config(self):
    #     """Return configuration from ES for this resource."""

    #     raise NotImplementedError("Override this method in a subclass")


class GraphNode(object):
    """Nodes within Resource Type and Resource graphs."""

    # The Goldstone UUID of the database table row represented by this node.
    uuid = None

    # The Resource Type of this node.
    resourcetype = None

    # The attributes (e.g., from a get_xxxxx_client() call) of this node.
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
        :type edgetype: For Resource Type graphs, R_EDGE. For Resource
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


#
# These classes represent entities within a Keystone service.
#

class User(PolyResource):
    """An OpenStack user."""


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


class ResourceTypes(Graph):
    """A graph of the resource types used within an OpenStack cloud."""

    # These are the graph edges. (If an edge connects nodes not yet in the
    # graph, the nodes are automatically added.)
    #
    # Each entry is from_type: control_list.
    # Each control_list is [control_dict, control_dict, ... ].
    # Each control_dict is:
    #   TO: The destination type
    #   EDGE_ATTTRIBUTES: This edge's attributes:
    #       TYPE: The type of this edge
    #       MIN: An instance must have a minimum number of this edge type
    #       MAX: An instance must have a maximum number of this edge type
    #       USE_CLIENT: Use this callable to get cloud information.
    #       MATCHING_ATTRIBUTES: A list of keys to match in the results from
    #                            USE_CLIENT(), in descending priority order.
    EDGES = {
        # From Glance nodes
        Image: [{TO: Server,
                 EDGE_ATTRIBUTES: {TYPE: DEFINES, MIN: 0, MAX: sys.maxint}}],

        # From Keystone nodes
        Credential: [{TO: Project,
                      EDGE_ATTRIBUTES: {TYPE: ASSIGNED_TO, MIN: 1, MAX: 1}}],
        Domain: [{TO: Group,
                  EDGE_ATTRIBUTES: {TYPE: CONTAINS, MIN: 0, MAX: sys.maxint}},
                 {TO: Project,
                  EDGE_ATTRIBUTES: {TYPE: CONTAINS, MIN: 0, MAX: sys.maxint}},
                 {TO: User,
                  EDGE_ATTRIBUTES: {TYPE: CONTAINS, MIN: 0, MAX: sys.maxint}}],
        Endpoint: [{TO: Service,
                    EDGE_ATTRIBUTES: {TYPE: ASSIGNED_TO, MIN: 1, MAX: 1}}],
        Project: [{TO: Image,
                   EDGE_ATTRIBUTES: {TYPE: MEMBER_OF,
                                     MIN: 0,
                                     MAX: sys.maxint,
                                     USE_CLIENT: get_keystone_client,
                                     MATCHING_ATTRIBUTES: ["id"]}},
                  {TO: Keypair,
                   EDGE_ATTRIBUTES: {TYPE: OWNS, MIN: 0, MAX: sys.maxint}},
                  {TO: NovaLimits,
                   EDGE_ATTRIBUTES: {TYPE: OWNS, MIN: 1, MAX: 1}},
                  {TO: NovaQuotaSet,
                   EDGE_ATTRIBUTES: {TYPE: SUBSCRIBED_TO,
                                     MIN: 0,
                                     MAX: sys.maxint}},
                  {TO: RootCert,
                   EDGE_ATTRIBUTES: {TYPE: OWNS, MIN: 0, MAX: 1}},
                  {TO: Server,
                   EDGE_ATTRIBUTES: {TYPE: OWNS, MIN: 1, MAX: sys.maxint}},
                  {TO: MeteringLabel,
                   EDGE_ATTRIBUTES: {TYPE: OWNS, MIN: 0, MAX: sys.maxint}},
                  {TO: NeutronQuota,
                   EDGE_ATTRIBUTES: {TYPE: SUBSCRIBED_TO, MIN: 1, MAX: 1}},
                  {TO: Network,
                   EDGE_ATTRIBUTES: {TYPE: USES, MIN: 0, MAX: sys.maxint}},
                  {TO: Network,
                   EDGE_ATTRIBUTES: {TYPE: OWNS, MIN: 0, MAX: sys.maxint}},
                  {TO: Subnet,
                   EDGE_ATTRIBUTES: {TYPE: OWNS, MIN: 0, MAX: sys.maxint}},
                  {TO: LBMember,
                   EDGE_ATTRIBUTES: {TYPE: OWNS, MIN: 0, MAX: sys.maxint}},
                  {TO: HealthMonitor,
                   EDGE_ATTRIBUTES: {TYPE: OWNS, MIN: 0, MAX: sys.maxint}},
                  {TO: LBVIP,
                   EDGE_ATTRIBUTES: {TYPE: OWNS, MIN: 0, MAX: sys.maxint}},
                  {TO: Port,
                   EDGE_ATTRIBUTES: {TYPE: OWNS, MIN: 0, MAX: sys.maxint}},
                  {TO: SecurityRules,
                   EDGE_ATTRIBUTES: {TYPE: OWNS, MIN: 0, MAX: sys.maxint}}],
        Region: [{TO: AvailabilityZone,
                  EDGE_ATTRIBUTES: {TYPE: OWNS, MIN: 1, MAX: sys.maxint}},
                 {TO: Endpoint,
                  EDGE_ATTRIBUTES: {TYPE: CONTAINS, MIN: 0, MAX: sys.maxint}}],
        Role: [{TO: Domain,
                EDGE_ATTRIBUTES: {TYPE: APPLIES_TO, MIN: 0, MAX: sys.maxint}},
               {TO: Group,
                EDGE_ATTRIBUTES: {TYPE: ASSIGNED_TO, MIN: 0, MAX: sys.maxint}},
               {TO: Project,
                EDGE_ATTRIBUTES: {TYPE: APPLIES_TO, MIN: 0, MAX: sys.maxint}},
               {TO: User,
                EDGE_ATTRIBUTES: {TYPE: ASSIGNED_TO,
                                  MIN: 0,
                                  MAX: sys.maxint}}],
        Token: [{TO: User,
                 EDGE_ATTRIBUTES: {TYPE: ASSIGNED_TO,
                                   MIN: 0,
                                   MAX: sys.maxint}}],
        User: [{TO: Credential,
                EDGE_ATTRIBUTES: {TYPE: CONTAINS, MIN: 0, MAX: sys.maxint}},
               {TO: Group,
                EDGE_ATTRIBUTES: {TYPE: ASSIGNED_TO, MIN: 0, MAX: sys.maxint}},
               {TO: NovaQuotaSet,
                EDGE_ATTRIBUTES: {TYPE: SUBSCRIBED_TO,
                                  MIN: 0,
                                  MAX: sys.maxint}},
               {TO: Project,
                EDGE_ATTRIBUTES: {TYPE: ASSIGNED_TO, MIN: 0, MAX: 1}}],

        # From Neutron nodes
        FloatingIPPool: [{TO: FixedIP,
                          EDGE_ATTRIBUTES: {TYPE: ROUTES_TO,
                                            MIN: 0,
                                            MAX: sys.maxint}},
                         {TO: FloatingIP,
                          EDGE_ATTRIBUTES: {TYPE: OWNS,
                                            MIN: 0,
                                            MAX: sys.maxint}}],
        HealthMonitor: [{TO: LBPool,
                         EDGE_ATTRIBUTES: {TYPE: APPLIES_TO,
                                           MIN: 0,
                                           MAX: sys.maxint}}],
        LBMember: [{TO: LBPool,
                    EDGE_ATTRIBUTES: {TYPE: MEMBER_OF,
                                      MIN: 0,
                                      MAX: sys.maxint}},
                   {TO: Subnet,
                    EDGE_ATTRIBUTES: {TYPE: ATTACHED_TO, MIN: 0, MAX: 1}}],
        LBVIP: [{TO: LBPool,
                 EDGE_ATTRIBUTES: {TYPE: MEMBER_OF, MIN: 0, MAX: 1}},
                {TO: Port,
                 EDGE_ATTRIBUTES: {TYPE: ATTACHED_TO, MIN: 0, MAX: 1}},
                {TO: Subnet,
                 EDGE_ATTRIBUTES: {TYPE: ALLOCATED_TO, MIN: 0, MAX: 1}}],
        MeteringLableRule: [{TO: MeteringLabel,
                             EDGE_ATTRIBUTES: {TYPE: APPLIES_TO,
                                               MIN: 1,
                                               MAX: 1}}],
        Port: [{TO: FixedIP,
                EDGE_ATTRIBUTES: {TYPE: CONSUMES, MIN: 0, MAX: sys.maxint}},
               {TO: FloatingIP,
                EDGE_ATTRIBUTES: {TYPE: CONSUMES, MIN: 0, MAX: sys.maxint}},
               {TO: SecurityGroup,
                EDGE_ATTRIBUTES: {TYPE: MEMBER_OF, MIN: 0, MAX: sys.maxint}}],
        Router: [{TO: Network,
                  EDGE_ATTRIBUTES: {TYPE: ATTACHED_TO, MIN: 0, MAX: 1}},
                 {TO: Port,
                  EDGE_ATTRIBUTES: {TYPE: ATTACHED_TO,
                                    MIN: 0,
                                    MAX: sys.maxint}}],
        SecurityRules: [{TO: RemoteGroup,
                         EDGE_ATTRIBUTES: {TYPE: APPLIES_TO, MIN: 0, MAX: 1}},
                        {TO: SecurityGroup,
                         EDGE_ATTRIBUTES: {TYPE: MEMBER_OF, MIN: 1, MAX: 1}}],
        Subnet: [{TO: FixedIP,
                  EDGE_ATTRIBUTES: {TYPE: OWNS, MIN: 0, MAX: sys.maxint}},
                 {TO: Network,
                  EDGE_ATTRIBUTES: {TYPE: MEMBER_OF, MIN: 1, MAX: 1}}],

        # From Nova nodes
        AvailabilityZone: [{TO: Aggregate,
                            EDGE_ATTRIBUTES: {TYPE: OWNS,
                                              MIN: 0,
                                              MAX: sys.maxint}},
                           {TO: Host,
                            EDGE_ATTRIBUTES: {TYPE: OWNS,
                                              MIN: 0,
                                              MAX: sys.maxint}}],
        Cloudpipe: [{TO: Server,
                     EDGE_ATTRIBUTES: {TYPE: INSTANCE_OF, MIN: 1, MAX: 1}}],
        Flavor: [{TO: FlavorExtraSpec,
                  EDGE_ATTRIBUTES: {TYPE: OWNS, MIN: 0, MAX: sys.maxint}},
                 {TO: Server,
                  EDGE_ATTRIBUTES: {TYPE: DEFINES, MIN: 0, MAX: sys.maxint}}],
        Host: [{TO: Aggregate,
                EDGE_ATTRIBUTES: {TYPE: MEMBER_OF, MIN: 0, MAX: sys.maxint}},
               {TO: Hypervisor,
                EDGE_ATTRIBUTES: {TYPE: OWNS, MIN: 0, MAX: 1}}],
        Hypervisor: [{TO: Server,
                      EDGE_ATTRIBUTES: {TYPE: OWNS, MIN: 0, MAX: sys.maxint}}],
        Interface: [{TO: Port,
                     EDGE_ATTRIBUTES: {TYPE: ATTACHED_TO, MIN: 0, MAX: 1}}],
        Keypair: [{TO: Server,
                   EDGE_ATTRIBUTES: {TYPE: ATTACHED_TO,
                                     MIN: 0,
                                     MAX: sys.maxint}}],
        NovaQuotaClass: [{TO: NovaQuotaSet,
                          EDGE_ATTRIBUTES: {TYPE: DEFINES,
                                            MIN: 0,
                                            MAX: sys.maxint}}],
        Server: [{TO: Interface,
                  EDGE_ATTRIBUTES: {TYPE: OWNS,
                                    MIN: 0,
                                    MAX: sys.maxint,
                                    USE_CLIENT: get_nova_client,
                                    MATCHING_ATTRIBUTES: ["id"]}},
                 {TO: ServerGroup,
                  EDGE_ATTRIBUTES: {TYPE: MEMBER_OF, MIN: 0, MAX: sys.maxint}},
                 {TO: ServerMetadata,
                  EDGE_ATTRIBUTES: {TYPE: OWNS, MIN: 0, MAX: sys.maxint}}],
        }

    def __init__(self):
        """Initialize the object.

        :return: self.graph: A graph of the resource types within an OpenStack
                 cloud.

        """

        super(ResourceTypes, self).__init__()

        # For every control_dict for every "from" type...
        for source, control_list in self.EDGES.iteritems():
            for control_dict in control_list:
                self.graph.add_edge(source,
                                    control_dict[TO],
                                    attr_dict=control_dict[EDGE_ATTRIBUTES])

    @property
    def edgetypes(self):
        """Return a list of the graph's edge types."""

        return settings.R_EDGE.keys()

resource_types = ResourceTypes()          # pylint: disable=C0103


class Resources(Graph):
    """A graph of the resources used within an OpenStack cloud."""

    def __init__(self):
        """Initialize the object."""

        super(Resources, self).__init__()

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
    def locate(nodelist, **kwargs):
        """Return the nodelist entry whose attributes match one of the kwargs.

        N.B. This returns the first node found that matches one of the keyword
        args. It does not check for nor return multiple matches.

        :param nodelist: The nodes through which to search
        :type nodelist: Iterable of GraphNode
        :keyword kwargs: keyword arguments.
        :type kwargs: dict
        :return: A node from nodelist that has an "attributes" key that
                 matches one of the kwargs key-value pairs
        :rtype: GraphNode or None

        """

        # For every keyword argument pair...
        for key, value in kwargs.iteritems():
            # Is there a nodelist entry with this attribute value?
            for node in nodelist:
                if node.attributes.get(key) == value:
                    # Yes!
                    return node

        return None

    @property
    def edgetypes(self):
        """Return a list of the graph's edge types."""

        return settings.RI_EDGE.keys()


# Here's Goldstone's Resource Instance graph.
resources = Resources()       # pylint: disable=C0103
