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
from django.db import models
from django.utils.encoding import force_str
from mptt.models import MPTTModel, TreeForeignKey
from polymorphic import PolymorphicModel
from django.db.models import CharField, IntegerField, Model, TextField
from django_extensions.db.fields import UUIDField, CreationDateTimeField, \
    ModificationDateTimeField
from goldstone.utils import utc_now
import sys
import networkx

# Aliases to make the Resource Graph definitions less verbose.
MAX = settings.RT_ATTRIBUTE.MAX
MIN = settings.RT_ATTRIBUTE.MIN
TYPE = settings.RT_ATTRIBUTE.TYPE

APPLIES_TO = settings.RT_EDGE.APPLIES_TO
ASSIGNED_TO = settings.RT_EDGE.ASSIGNED_TO
CONTAINS = settings.RT_EDGE.CONTAINS
MEMBER_OF = settings.RT_EDGE.MEMBER_OF
OWNS = settings.RT_EDGE.OWNS


class PolyResource(PolymorphicModel):
    """The base type for resources in Goldstone."""

    id = UUIDField(version=1, auto=True, primary_key=True)
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
    of these may simply be convenience methods for calling underlying networkx
    methods.

    """

    def __init__(self):
        """Initialize the object.

        We expect the child classes will load self.graph.

        """

        self.graph = networkx.DiGraph()

    def out_edges(self):
        pass

    def in_edges(self):
        pass

    def neighbors(self):
        pass

    def predecessors(self):
        pass

    def successors(self):
        pass


#
# These nodes are for the Resource Instance graph.
#

class Agent(PolyResource):
    port = IntegerField(
        editable=True,
        blank=True,
        default=5514)


class Hypervisor(PolyResource):
    vcpus = IntegerField(
        editable=True,
        blank=True,
        default=8)
    mem = IntegerField(
        editable=True,
        blank=True,
        default=8192)


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

    pass


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


#
# These classes represent entities within a Glance service.
#

class Image(PolyResource):
    """An OpenStack Image."""

    pass


class ResourceTypes(DirectedGraph):
    """A directed graph of the resources used within an OpenStack cloud."""

    # These are the nodes in the graph. Each entry is a type.
    NODES = [
        # Keystone
        User, Domain, Group, Token, Credential, Role, Region, Endpoint,
        Service, Project,
        # Nova
        AvailabilityZone, FlavorExtraSpec, RootCert, Aggregate, Flavor,
        Keypair, Host, Hypervisor, Cloudpipe, ServerGroup, Server,
        ServerMetadata, Interface,
        ]

    # These are the edges in the graph. Each one is an (f, t, d) 3-tuple:
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
        (Keypair, Server, {TYPE: ATTACHED_TO, MIN: 0, MAX: sys.maxint}),
        (NovaQuotaClass, NovaQuotaSet, {TYPE: DEFINES,
                                        MIN: 0,
                                        MAX: sys.maxint}),
        (Server, Interface, {TYPE: OWNS, MIN: 0, MAX: sys.maxint}),
        (Server, ServerGroup, {TYPE: MEMBER_OF, MIN: 0, MAX: sys.maxint}),
        (Server, ServerMetadata, {TYPE: OWNS, MIN: 0, MAX: sys.maxint}),
        # From Glance nodes
        (Image, Server, {TYPE: DEFINES, MIN: 0, MAX: sys.maxint}),
        ]

    def __init__(self):
        """Initialize the object.

        :return: self.graph: A graph of the resource types within an OpenStack
                 cloud.

        """

        super(ResourceTypes, self).__init__()

        # Add the nodes
        for entry in self.NODES:
            self.graph.add_node(entry)

        # Add the edges.
        for source, dest, attribute in self.EDGES:
            self.graph.add_edge(source, dest, attribute)
