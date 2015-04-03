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
from goldstone.glogging.models import LogData, LogEvent
from goldstone.models import es_conn, daily_index
# Get_glance_client is defined here for easy unit test mocking.
from goldstone.utils import utc_now, get_glance_client, get_nova_client

from elasticsearch_dsl.query import Q, QueryString
import networkx
import sys

# Aliases to make the Resource Graph definitions less verbose.
MAX = settings.R_ATTRIBUTE.MAX
MIN = settings.R_ATTRIBUTE.MIN
TO = settings.R_ATTRIBUTE.TO
TYPE = settings.R_ATTRIBUTE.TYPE
MATCHING_FN = settings.R_ATTRIBUTE.MATCHING_FN
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

    @staticmethod
    def clouddata():
        """Return information on this resource type's cloud instances.

        N.B. We can't know when nested client methods are evaluated, so we
        make the complete call here.

        :return: One or more information collections about cloud instances of
                 this type
        :rtype: Iterable or generator of dict

        """

        nova_client = get_nova_client()["client"]
        nova_client.client.authenticate()

        return [x.to_dict() for x in nova_client.availability_zones.list()]

    @staticmethod
    def identity(thing):
        """Return thing's uniquely identifying value.

        In order to match a cloud instance with a Resource Graph node, we need
        to examine the values that uniquely identify them, for a given
        PolyResource subclass.

        :param thing: A representation of a cloud instance, or a resource graph
                      node.
        :type thing: Depending upon the PolyResource subclass, this is a dict
                     or a user-defined object. Usually, it'll be the type of
                     the entries in the value retured by clouddata().
        :return: The value of whatever uniquely identifies an instance of this
                 type.
        :rtype: Depends on the PolyResource subclass, anything, but probably
                str

        """

        return thing.get("zoneName")


class FlavorExtraSpec(PolyResource):
    """An OpenStack Flavor ExtraSpec."""

    @staticmethod
    def clouddata():
        """Return information on this resource type's cloud instances.

        N.B. We can't know when nested client methods are evaluated, so we
        make the complete call here.

        :return: One or more information collections about cloud instances of
                 this type
        :rtype: Iterable or generator of dict

        """

        nova_client = get_nova_client()["client"]
        nova_client.client.authenticate()

        return [x.get_keys() for x in nova_client.flavors.list()]

    @staticmethod
    def identity(thing):
        """Return thing's uniquely identifying value.

        In order to match a cloud instance with a Resource Graph node, we need
        to examine the values that uniquely identify them, for a given
        PolyResource subclass.

        :param thing: A representation of a cloud instance, or a resource graph
                      node.
        :type thing: Depending upon the PolyResource subclass, this is a dict
                     or a user-defined object. Usually, it'll be the type of
                     the entries in the value retured by clouddata().
        :return: The value of whatever uniquely identifies an instance of this
                 type.
        :rtype: Depends on the PolyResource subclass, anything, but probably
                str

        """

        return thing.get("id")


class Aggregate(PolyResource):
    """An OpenStack Aggregate."""

    @staticmethod
    def clouddata():
        """Return information on this resource type's cloud instances.

        N.B. We can't know when nested client methods are evaluated, so we
        make the complete call here.

        :return: One or more information collections about cloud instances of
                 this type
        :rtype: Iterable or generator of dict

        """

        nova_client = get_nova_client()["client"]
        nova_client.client.authenticate()

        return [x.to_dict() for x in nova_client.aggregates.list()]

    @staticmethod
    def identity(thing):
        """Return thing's uniquely identifying value.

        In order to match a cloud instance with a Resource Graph node, we need
        to examine the values that uniquely identify them, for a given
        PolyResource subclass.

        :param thing: A representation of a cloud instance, or a resource graph
                      node.
        :type thing: Depending upon the PolyResource subclass, this is a dict
                     or a user-defined object. Usually, it'll be the type of
                     the entries in the value retured by clouddata().
        :return: The value of whatever uniquely identifies an instance of this
                 type.
        :rtype: Depends on the PolyResource subclass, anything, but probably
                str

        """

        return thing.get("id")


class Flavor(PolyResource):
    """An OpenStack Flavor."""

    @staticmethod
    def clouddata():
        """Return information on this resource type's cloud instances.

        N.B. We can't know when nested client methods are evaluated, so we
        make the complete call here.

        :return: One or more information collections about cloud instances of
                 this type
        :rtype: Iterable or generator of dict

        """

        nova_client = get_nova_client()["client"]
        nova_client.client.authenticate()

        return [x.to_dict() for x in nova_client.flavors.list()]

    @staticmethod
    def identity(thing):
        """Return thing's uniquely identifying value.

        In order to match a cloud instance with a Resource Graph node, we need
        to examine the values that uniquely identify them, for a given
        PolyResource subclass.

        :param thing: A representation of a cloud instance, or a resource graph
                      node.
        :type thing: Depending upon the PolyResource subclass, this is a dict
                     or a user-defined object. Usually, it'll be the type of
                     the entries in the value retured by clouddata().
        :return: The value of whatever uniquely identifies an instance of this
                 type.
        :rtype: Depends on the PolyResource subclass, anything, but probably
                str

        """

        return thing.get("id")


class Keypair(PolyResource):
    """An OpenStack Keypair."""

    @staticmethod
    def clouddata():
        """Return information on this resource type's cloud instances.

        N.B. We can't know when nested client methods are evaluated, so we
        make the complete call here.

        :return: One or more information collections about cloud instances of
                 this type
        :rtype: Iterable or generator of dict

        """

        nova_client = get_nova_client()["client"]
        nova_client.client.authenticate()

        return [x.to_dict()["keypair"] for x in nova_client.keypairs.list()]

    @staticmethod
    def identity(thing):
        """Return thing's uniquely identifying value.

        In order to match a cloud instance with a Resource Graph node, we need
        to examine the values that uniquely identify them, for a given
        PolyResource subclass.

        :param thing: A representation of a cloud instance, or a resource graph
                      node.
        :type thing: Depending upon the PolyResource subclass, this is a dict
                     or a user-defined object. Usually, it'll be the type of
                     the entries in the value retured by clouddata().
        :return: The value of whatever uniquely identifies an instance of this
                 type.
        :rtype: Depends on the PolyResource subclass, anything, but probably
                str

        """

        return thing.get("fingerprint")


class Host(PolyResource):
    """An Openstack host"""

    fqdn = CharField(max_length=255,
                     unique=True,
                     help_text="A fully-qualified domain name")

    @staticmethod
    def _parse_host_name(host_name):
        """Where possible, generate the fqdn and simple hostnames for host.

        :param host_name: An IP address, fqdn, or simple host name
        :type host_name: str
        :return: (simple name, fqdn)
        :rtype: tuple

        """
        from goldstone.utils import is_ip_addr, partition_hostname

        fqdn = None

        if not is_ip_addr(host_name):
            parts = partition_hostname(host_name)

            if parts['domainname'] is not None:
                fqdn = host_name
                host_name = parts['hostname']

        return host_name, fqdn

    @staticmethod
    def clouddata():
        """Return information on this resource type's cloud instances.

        N.B. We can't know when nested client methods are evaluated, so we
        make the complete call here.

        :return: One or more information collections about cloud instances of
                 this type
        :rtype: Iterable or generator of dict

        """

        nova_client = get_nova_client()["client"]
        nova_client.client.authenticate()
        hosts = [x.to_dict() for x in nova_client.hosts.list()]

        # Nova has no problem showing you multiple instance of the same host.
        # If a host shows up multiple times in the list, it probably has
        # multiple service running on it.  We'll de-dupe this, and preserve the
        # Availability Zone for each one.
        result = []

        for host in hosts:
            parsed_name = Host._parse_host_name(host["host_name"])[0]

            if all(x["host_name"] != parsed_name for x in result):
                # This is a new entry for the result set.
                host["host_name"] = parsed_name
                del host["service"]
                result.append(host)

        return result

    @staticmethod
    def identity(thing):
        """Return thing's uniquely identifying value.

        In order to match a cloud instance with a Resource Graph node, we need
        to examine the values that uniquely identify them, for a given
        PolyResource subclass.

        :param thing: A representation of a cloud instance, or a resource graph
                      node.
        :type thing: Depending upon the PolyResource subclass, this is a dict
                     or a user-defined object. Usually, it'll be the type of
                     the entries in the value retured by clouddata().
        :return: The value of whatever uniquely identifies an instance of this
                 type.
        :rtype: Depends on the PolyResource subclass, anything, but probably
                str

        """

        return thing.get("host_name")


class Hypervisor(PolyResource):
    """An OpenStack Hypervisor."""

    virt_cpus = IntegerField(editable=True, blank=True, default=8)
    memory = IntegerField(editable=True, blank=True, default=8192)

    @staticmethod
    def clouddata():
        """Return information on this resource type's cloud instances.

        N.B. We can't know when nested client methods are evaluated, so we
        make the complete call here.

        :return: One or more information collections about cloud instances of
                 this type
        :rtype: Iterable or generator of dict

        """

        nova_client = get_nova_client()["client"]
        nova_client.client.authenticate()

        return [x.to_dict() for x in nova_client.hypervisors.list()]

    @staticmethod
    def identity(thing):
        """Return thing's uniquely identifying value.

        In order to match a cloud instance with a Resource Graph node, we need
        to examine the values that uniquely identify them, for a given
        PolyResource subclass.

        :param thing: A representation of a cloud instance, or a resource graph
                      node.
        :type thing: Depending upon the PolyResource subclass, this is a dict
                     or a user-defined object. Usually, it'll be the type of
                     the entries in the value retured by clouddata().
        :return: The value of whatever uniquely identifies an instance of this
                 type.
        :rtype: Depends on the PolyResource subclass, anything, but probably
                str

        """

        return thing.get("id")


class Cloudpipe(PolyResource):
    """An OpenStack Cloudpipe."""

    @staticmethod
    def clouddata():
        """Return information on this resource type's cloud instances.

        N.B. We can't know when nested client methods are evaluated, so we
        make the complete call here.

        :return: One or more information collections about cloud instances of
                 this type
        :rtype: Iterable or generator of dict

        """

        nova_client = get_nova_client()["client"]
        nova_client.client.authenticate()

        return [x.to_dict() for x in nova_client.cloudpipe.list()]

    @staticmethod
    def identity(thing):
        """Return thing's uniquely identifying value.

        In order to match a cloud instance with a Resource Graph node, we need
        to examine the values that uniquely identify them, for a given
        PolyResource subclass.

        :param thing: A representation of a cloud instance, or a resource graph
                      node.
        :type thing: Depending upon the PolyResource subclass, this is a dict
                     or a user-defined object. Usually, it'll be the type of
                     the entries in the value retured by clouddata().
        :return: The value of whatever uniquely identifies an instance of this
                 type.
        :rtype: Depends on the PolyResource subclass, anything, but probably
                str

        """

        return thing.get("id")


class ServerGroup(PolyResource):
    """An OpenStack Server Group."""

    @staticmethod
    def clouddata():
        """Return information on this resource type's cloud instances.

        N.B. We can't know when nested client methods are evaluated, so we
        make the complete call here.

        :return: One or more information collections about cloud instances of
                 this type
        :rtype: Iterable or generator of dict

        """

        nova_client = get_nova_client()["client"]
        nova_client.client.authenticate()

        return [x.to_dict() for x in nova_client.server_groups.list()]

    @staticmethod
    def identity(thing):
        """Return thing's uniquely identifying value.

        In order to match a cloud instance with a Resource Graph node, we need
        to examine the values that uniquely identify them, for a given
        PolyResource subclass.

        :param thing: A representation of a cloud instance, or a resource graph
                      node.
        :type thing: Depending upon the PolyResource subclass, this is a dict
                     or a user-defined object. Usually, it'll be the type of
                     the entries in the value retured by clouddata().
        :return: The value of whatever uniquely identifies an instance of this
                 type.
        :rtype: Depends on the PolyResource subclass, anything, but probably
                str

        """

        return thing.get("id")


class Server(PolyResource):
    """An OpenStack Server."""

    @staticmethod
    def clouddata():
        """Return information on this resource type's cloud instances.

        N.B. We can't know when nested client methods are evaluated, so we
        make the complete call here.

        :return: One or more information collections about cloud instances of
                 this type
        :rtype: Iterable or generator of dict

        """

        nova_client = get_nova_client()["client"]
        nova_client.client.authenticate()

        return [x.to_dict()
                for x in
                nova_client.servers.list(search_opts={"all_tenants": 1})]

    @staticmethod
    def identity(thing):
        """Return thing's uniquely identifying value.

        In order to match a cloud instance with a Resource Graph node, we need
        to examine the values that uniquely identify them, for a given
        PolyResource subclass.

        :param thing: A representation of a cloud instance, or a resource graph
                      node.
        :type thing: Depending upon the PolyResource subclass, this is a dict
                     or a user-defined object. Usually, it'll be the type of
                     the entries in the value retured by clouddata().
        :return: The value of whatever uniquely identifies an instance of this
                 type.
        :rtype: Depends on the PolyResource subclass, anything, but probably
                str

        """

        return thing.get("id")


class Interface(PolyResource):
    """An OpenStack Interface."""

    @staticmethod
    def clouddata():
        """Return information on this resource type's cloud instances.

        N.B. We can't know when nested client methods are evaluated, so we
        make the complete call here.

        :return: One or more information collections about cloud instances of
                 this type
        :rtype: Iterable or generator of dict

        """

        nova_client = get_nova_client()["client"]
        nova_client.client.authenticate()

        # Each server has an interface list. Since we're interested in the
        # Interfaces themselves, we flatten the list, and de-dup it.
        raw = [x.to_dict() for x in y.interface_list()
               for y in
               nova_client.servers.list(search_opts={"all_tenants": 1})]

        mac_addresses = set()
        result = []

        for entry in result:
            # This entry is a duplicate of a previous entry if its MAC address
            # matches.
            if entry["mac_addr"] not in mac_addresses:
                result.append(entry)
                mac_addresses.add(entry["mac_addr"])

        return result

    @staticmethod
    def identity(thing):
        """Return thing's uniquely identifying value.

        In order to match a cloud instance with a Resource Graph node, we need
        to examine the values that uniquely identify them, for a given
        PolyResource subclass.

        :param thing: A representation of a cloud instance, or a resource graph
                      node.
        :type thing: Depending upon the PolyResource subclass, this is a dict
                     or a user-defined object. Usually, it'll be the type of
                     the entries in the value retured by clouddata().
        :return: The value of whatever uniquely identifies an instance of this
                 type.
        :rtype: Depends on the PolyResource subclass, anything, but probably
                str

        """

        return thing.get("mac_addr")


class NovaLimits(PolyResource):
    """An OpenStack Limits within a Nova service."""

    @staticmethod
    def clouddata():
        """Return information on this resource type's cloud instances.

        N.B. We can't know when nested client methods are evaluated, so we
        make the complete call here.

        :return: One or more information collections about cloud instances of
                 this type
        :rtype: Iterable or generator of dict

        """

        nova_client = get_nova_client()["client"]
        nova_client.client.authenticate()

        return [x.to_dict() for x in nova_client.limits.list()]

    @staticmethod
    def identity(thing):
        """Return thing's uniquely identifying value.

        In order to match a cloud instance with a Resource Graph node, we need
        to examine the values that uniquely identify them, for a given
        PolyResource subclass.

        :param thing: A representation of a cloud instance, or a resource graph
                      node.
        :type thing: Depending upon the PolyResource subclass, this is a dict
                     or a user-defined object. Usually, it'll be the type of
                     the entries in the value retured by clouddata().
        :return: The value of whatever uniquely identifies an instance of this
                 type.
        :rtype: Depends on the PolyResource subclass, anything, but probably
                str

        """

        return thing.get("id")


#
# These classes represent entities within a Glance service.
#

class Image(PolyResource):
    """An OpenStack Image."""

    @staticmethod
    def clouddata():
        """Return information on this resource type's cloud instances.

        N.B. We can't know when nested client methods are evaluated, so we
        make the complete call here.

        :return: One or more information collections about cloud instances of
                 this type
        :rtype: Iterable or generator of dict

        """

        return list(get_glance_client()["client"].images.list())

    @staticmethod
    def identity(thing):
        """Return thing's uniquely identifying value.

        In order to match a cloud instance with a Resource Graph node, we need
        to examine the values that uniquely identify them, for a given
        PolyResource subclass.

        :param thing: A representation of a cloud instance, or a resource graph
                      node.
        :type thing: Depending upon the PolyResource subclass, this is a dict
                     or a user-defined object. Usually, it'll be the type of
                     the entries in the value retured by clouddata().
        :return: The value of whatever uniquely identifies an instance of this
                 type.
        :rtype: Depends on the PolyResource subclass, anything, but probably
                str

        """

        return thing.get("id")


#
# These classes represent entities within a Cinder service.
#

class QuotaClass(PolyResource):
    """An OpenStack Image."""

    @staticmethod
    def clouddata():
        """Return information on this resource type's cloud instances.

        N.B. We can't know when nested client methods are evaluated, so we
        make the complete call here.

        :return: One or more infomration collections about cloud instances of
                 this type
        :rtype: Iterable or generator of dict

        """

        return list(get_glance_client()["client"].images.list())

    @staticmethod
    def identity(thing):
        """Return thing's uniquely identifying value.

        In order to match a cloud instance with a Resource Graph node, we need
        to examine the values that uniquely identify them, for a given
        PolyResource subclass.

        :param thing: A representation of a cloud instance, or a resource graph
                      node.
        :type thing: Depending upon the PolyResource subclass, this is a dict
                     or a user-defined object. Usually, it'll be the type of
                     the entries in the value retured by clouddata().
        :return: The value of whatever uniquely identifies an instance of this
                 type.
        :rtype: Depends on the PolyResource subclass, anything, but probably
                str

        """

        return thing.get("id")


class QuotaSet(PolyResource):
    """An OpenStack Image."""

    @staticmethod
    def clouddata():
        """Return information on this resource type's cloud instances.

        N.B. We can't know when nested client methods are evaluated, so we
        make the complete call here.

        :return: One or more infomration collections about cloud instances of
                 this type
        :rtype: Iterable or generator of dict

        """

        return list(get_glance_client()["client"].images.list())

    @staticmethod
    def identity(thing):
        """Return thing's uniquely identifying value.

        In order to match a cloud instance with a Resource Graph node, we need
        to examine the values that uniquely identify them, for a given
        PolyResource subclass.

        :param thing: A representation of a cloud instance, or a resource graph
                      node.
        :type thing: Depending upon the PolyResource subclass, this is a dict
                     or a user-defined object. Usually, it'll be the type of
                     the entries in the value retured by clouddata().
        :return: The value of whatever uniquely identifies an instance of this
                 type.
        :rtype: Depends on the PolyResource subclass, anything, but probably
                str

        """

        return thing.get("id")


class QOSSpec(PolyResource):
    """An OpenStack Image."""

    @staticmethod
    def clouddata():
        """Return information on this resource type's cloud instances.

        N.B. We can't know when nested client methods are evaluated, so we
        make the complete call here.

        :return: One or more infomration collections about cloud instances of
                 this type
        :rtype: Iterable or generator of dict

        """

        return list(get_glance_client()["client"].images.list())

    @staticmethod
    def identity(thing):
        """Return thing's uniquely identifying value.

        In order to match a cloud instance with a Resource Graph node, we need
        to examine the values that uniquely identify them, for a given
        PolyResource subclass.

        :param thing: A representation of a cloud instance, or a resource graph
                      node.
        :type thing: Depending upon the PolyResource subclass, this is a dict
                     or a user-defined object. Usually, it'll be the type of
                     the entries in the value retured by clouddata().
        :return: The value of whatever uniquely identifies an instance of this
                 type.
        :rtype: Depends on the PolyResource subclass, anything, but probably
                str

        """

        return thing.get("id")


class Snapshot(PolyResource):
    """An OpenStack Image."""

    @staticmethod
    def clouddata():
        """Return information on this resource type's cloud instances.

        N.B. We can't know when nested client methods are evaluated, so we
        make the complete call here.

        :return: One or more infomration collections about cloud instances of
                 this type
        :rtype: Iterable or generator of dict

        """

        return list(get_glance_client()["client"].images.list())

    @staticmethod
    def identity(thing):
        """Return thing's uniquely identifying value.

        In order to match a cloud instance with a Resource Graph node, we need
        to examine the values that uniquely identify them, for a given
        PolyResource subclass.

        :param thing: A representation of a cloud instance, or a resource graph
                      node.
        :type thing: Depending upon the PolyResource subclass, this is a dict
                     or a user-defined object. Usually, it'll be the type of
                     the entries in the value retured by clouddata().
        :return: The value of whatever uniquely identifies an instance of this
                 type.
        :rtype: Depends on the PolyResource subclass, anything, but probably
                str

        """

        return thing.get("id")


class VolumeType(PolyResource):
    """An OpenStack Image."""

    @staticmethod
    def clouddata():
        """Return information on this resource type's cloud instances.

        N.B. We can't know when nested client methods are evaluated, so we
        make the complete call here.

        :return: One or more infomration collections about cloud instances of
                 this type
        :rtype: Iterable or generator of dict

        """

        return list(get_glance_client()["client"].images.list())

    @staticmethod
    def identity(thing):
        """Return thing's uniquely identifying value.

        In order to match a cloud instance with a Resource Graph node, we need
        to examine the values that uniquely identify them, for a given
        PolyResource subclass.

        :param thing: A representation of a cloud instance, or a resource graph
                      node.
        :type thing: Depending upon the PolyResource subclass, this is a dict
                     or a user-defined object. Usually, it'll be the type of
                     the entries in the value retured by clouddata().
        :return: The value of whatever uniquely identifies an instance of this
                 type.
        :rtype: Depends on the PolyResource subclass, anything, but probably
                str

        """

        return thing.get("id")


class Volume(PolyResource):
    """An OpenStack Image."""

    @staticmethod
    def clouddata():
        """Return information on this resource type's cloud instances.

        N.B. We can't know when nested client methods are evaluated, so we
        make the complete call here.

        :return: One or more infomration collections about cloud instances of
                 this type
        :rtype: Iterable or generator of dict

        """

        return list(get_glance_client()["client"].images.list())

    @staticmethod
    def identity(thing):
        """Return thing's uniquely identifying value.

        In order to match a cloud instance with a Resource Graph node, we need
        to examine the values that uniquely identify them, for a given
        PolyResource subclass.

        :param thing: A representation of a cloud instance, or a resource graph
                      node.
        :type thing: Depending upon the PolyResource subclass, this is a dict
                     or a user-defined object. Usually, it'll be the type of
                     the entries in the value retured by clouddata().
        :return: The value of whatever uniquely identifies an instance of this
                 type.
        :rtype: Depends on the PolyResource subclass, anything, but probably
                str

        """

        return thing.get("id")


class Limits(PolyResource):
    """An OpenStack Image."""

    @staticmethod
    def clouddata():
        """Return information on this resource type's cloud instances.

        N.B. We can't know when nested client methods are evaluated, so we
        make the complete call here.

        :return: One or more infomration collections about cloud instances of
                 this type
        :rtype: Iterable or generator of dict

        """

        return list(get_glance_client()["client"].images.list())

    @staticmethod
    def identity(thing):
        """Return thing's uniquely identifying value.

        In order to match a cloud instance with a Resource Graph node, we need
        to examine the values that uniquely identify them, for a given
        PolyResource subclass.

        :param thing: A representation of a cloud instance, or a resource graph
                      node.
        :type thing: Depending upon the PolyResource subclass, this is a dict
                     or a user-defined object. Usually, it'll be the type of
                     the entries in the value retured by clouddata().
        :return: The value of whatever uniquely identifies an instance of this
                 type.
        :rtype: Depends on the PolyResource subclass, anything, but probably
                str

        """

        return thing.get("id")


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

    @staticmethod
    def clouddata():
        """Return information on this resource type's cloud instances.

        N.B. We can't know when nested client methods are evaluated, so we
        make the complete call here.

        :return: One or more information collections about cloud instances of
                 this type
        :rtype: Iterable or generator of dict

        """
        from goldstone.utils import get_cloud
        from goldstone.neutron.utils import get_neutron_client
        # from neutronclient.v2_0 import client as neclient

        # Get the one and only one Cloud row in the system
        row = get_cloud()

        client = get_neutron_client(row.username,
                                    row.password,
                                    row.tenant_name,
                                    row.auth_url)

        return client.list_ports()["ports"]

    @staticmethod
    def identity(thing):
        """Return thing's uniquely identifying value.

        In order to match a cloud instance with a Resource Graph node, we need
        to examine the values that uniquely identify them, for a given
        PolyResource subclass.

        :param thing: A representation of a cloud instance, or a resource graph
                      node.
        :type thing: Depending upon the PolyResource subclass, this is a dict
                     or a user-defined object. Usually, it'll be the type of
                     the entries in the value retured by clouddata().
        :return: The value of whatever uniquely identifies an instance of this
                 type.
        :rtype: Depends on the PolyResource subclass, anything, but probably
                str

        """

        return thing.get("id")


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
    #       MIN: A resource graph node has a minimum number of this edge type
    #       MAX: A resource graph node has a maximum number of this edge type
    #       MATCHING_FN: Callable(from_attr_dict, to_attr_dict).  If there's a
    #                    match between the from_node's and to_node's attribute
    #                    dicts, we draw a Resource graph edge. Note: This
    #                    must be prepared for absent keys, and not throw
    #                    exceptions.
    EDGES = {
        # From Glance nodes
        Image: [{TO: Server,
                 EDGE_ATTRIBUTES:
                 {TYPE: DEFINES,
                  MIN: 0,
                  MAX: sys.maxint,
                  MATCHING_FN:
                  lambda f, t: f.get("id") and f.get("id") == t.get("id")}}],

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
                   EDGE_ATTRIBUTES:
                   {TYPE: MEMBER_OF,
                    MIN: 0,
                    MAX: sys.maxint,
                    MATCHING_FN:
                    lambda f, t: f.get("id") and f.get("id") == t.get("id")}},
                  {TO: Keypair,
                   EDGE_ATTRIBUTES:
                   {TYPE: OWNS,
                    MIN: 0,
                    MAX: sys.maxint,
                    MATCHING_FN:
                    lambda f, t: f.get("id") and f.get("id") == t.get("id")}},
                  {TO: NovaLimits,
                   EDGE_ATTRIBUTES:
                   {TYPE: OWNS,
                    MIN: 1,
                    MAX: 1,
                    MATCHING_FN:
                    lambda f, t: f.get("id") and f.get("id") == t.get("id")}},
                  {TO: Server,
                   EDGE_ATTRIBUTES:
                   {TYPE: OWNS,
                    MIN: 1,
                    MAX: sys.maxint,
                    MATCHING_FN:
                    lambda f, t: f.get("id") and f.get("id") == t.get("id")}},
                  {TO: MeteringLabel,
                   EDGE_ATTRIBUTES:
                   {TYPE: OWNS,
                    MIN: 0,
                    MAX: sys.maxint,
                    MATCHING_FN:
                    lambda f, t: f.get("id") and f.get("id") == t.get("id")}},
                  {TO: NeutronQuota,
                   EDGE_ATTRIBUTES:
                   {TYPE: SUBSCRIBED_TO,
                    MIN: 1,
                    MAX: 1,
                    MATCHING_FN:
                    lambda f, t: f.get("id") and f.get("id") == t.get("id")}},
                  {TO: Network,
                   EDGE_ATTRIBUTES:
                   {TYPE: USES,
                    MIN: 0,
                    MAX: sys.maxint,
                    MATCHING_FN:
                    lambda f, t: f.get("id") and f.get("id") == t.get("id")}},
                  {TO: Network,
                   EDGE_ATTRIBUTES:
                   {TYPE: OWNS,
                    MIN: 0,
                    MAX: sys.maxint,
                    MATCHING_FN:
                    lambda f, t: f.get("id") and f.get("id") == t.get("id")}},
                  {TO: Subnet,
                   EDGE_ATTRIBUTES:
                   {TYPE: OWNS,
                    MIN: 0,
                    MAX: sys.maxint,
                    MATCHING_FN:
                    lambda f, t: f.get("id") and f.get("id") == t.get("id")}},
                  {TO: LBMember,
                   EDGE_ATTRIBUTES:
                   {TYPE: OWNS,
                    MIN: 0,
                    MAX: sys.maxint,
                    MATCHING_FN:
                    lambda f, t: f.get("id") and f.get("id") == t.get("id")}},
                  {TO: HealthMonitor,
                   EDGE_ATTRIBUTES:
                   {TYPE: OWNS,
                    MIN: 0,
                    MAX: sys.maxint,
                    MATCHING_FN:
                    lambda f, t: f.get("id") and f.get("id") == t.get("id")}},
                  {TO: LBVIP,
                   EDGE_ATTRIBUTES:
                   {TYPE: OWNS,
                    MIN: 0,
                    MAX: sys.maxint,
                    MATCHING_FN:
                    lambda f, t: f.get("id") and f.get("id") == t.get("id")}},
                  {TO: Port,
                   EDGE_ATTRIBUTES:
                   {TYPE: OWNS,
                    MIN: 0,
                    MAX: sys.maxint,
                    MATCHING_FN:
                    lambda f, t: f.get("id") and f.get("id") == t.get("id")}},
                  {TO: SecurityRules,
                   EDGE_ATTRIBUTES:
                   {TYPE: OWNS,
                    MIN: 0,
                    MAX: sys.maxint,
                    MATCHING_FN:
                    lambda f, t: f.get("id") and f.get("id") == t.get("id")}},
                  {TO: QuotaSet,
                   EDGE_ATTRIBUTES:
                   {TYPE: SUBSCRIBED_TO,
                    MIN: 0,
                    MAX: sys.maxint,
                    MATCHING_FN:
                    lambda f, t: f.get("id") and f.get("id") == t.get("id")}},
                  {TO: QOSSpec,
                   EDGE_ATTRIBUTES:
                   {TYPE: OWNS,
                    MIN: 0,
                    MAX: sys.maxint,
                    MATCHING_FN:
                    lambda f, t: f.get("id") and f.get("id") == t.get("id")}},
                  {TO: Snapshot,
                   EDGE_ATTRIBUTES:
                   {TYPE: OWNS,
                    MIN: 0,
                    MAX: sys.maxint,
                    MATCHING_FN:
                    lambda f, t: f.get("id") and f.get("id") == t.get("id")}},
                  {TO: Volume,
                   EDGE_ATTRIBUTES:
                   {TYPE: MEMBER_OF,
                    MIN: 0,
                    MAX: sys.maxint,
                    MATCHING_FN:
                    lambda f, t: f.get("id") and f.get("id") == t.get("id")}},
                  {TO: Limits,
                   EDGE_ATTRIBUTES:
                   {TYPE: OWNS,
                    MIN: 0,
                    MAX: sys.maxint,
                    MATCHING_FN:
                    lambda f, t: f.get("id") and f.get("id") == t.get("id")}},
                  ],
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
               {TO: Project,
                EDGE_ATTRIBUTES: {TYPE: ASSIGNED_TO, MIN: 0, MAX: 1}},
               {TO: QuotaSet,
                EDGE_ATTRIBUTES:
                {TYPE: SUBSCRIBED_TO,
                 MIN: 0,
                 MAX: sys.maxint}}],

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
        AvailabilityZone: [
            {TO: Aggregate,
             EDGE_ATTRIBUTES:
             {TYPE: OWNS,
              MIN: 0,
              MAX: sys.maxint,
              MATCHING_FN:
              lambda f, t:
              f.get("zoneName") and
              f.get("zoneName") == t.get("availability_zone")}},
            {TO: Host,
             EDGE_ATTRIBUTES:
             {TYPE: OWNS,
              MIN: 0,
              MAX: sys.maxint,
              MATCHING_FN:
              lambda f, t:
              f.get("zoneName") and f.get("zoneName") == t.get("zone")}}],
        Cloudpipe: [
            {TO: Server,
             EDGE_ATTRIBUTES:
             {TYPE: INSTANCE_OF,
              MIN: 1,
              MAX: 1,
              MATCHING_FN:
              lambda f, t: f.get("id") and f.get("id") == t.get("id")}}],
        Flavor: [
            {TO: FlavorExtraSpec,
             EDGE_ATTRIBUTES:
             {TYPE: OWNS,
              MIN: 0,
              MAX: sys.maxint,
              MATCHING_FN:
              lambda f, t:
              f.get("id") and f.get("id") == t.get("id")}},
            {TO: Server,
             EDGE_ATTRIBUTES:
             {TYPE: DEFINES,
              MIN: 0,
              MAX: sys.maxint,
              MATCHING_FN:
              lambda f, t:
              f.get("id") and f.get("id") == t.get("flavor", {}).get("id")}}],
        Host: [
            {TO: Aggregate,
             EDGE_ATTRIBUTES:
             {TYPE: MEMBER_OF,
              MIN: 0,
              MAX: sys.maxint,
              MATCHING_FN:
              lambda f, t: f.get("host_name") and
              f.get("host_name") in t.get("hosts", [])}},
            {TO: Hypervisor,
             EDGE_ATTRIBUTES:
             {TYPE: OWNS,
              MIN: 0,
              MAX: 1,
              MATCHING_FN:
              lambda f, t:
              f.get("host_name") and
              f.get("host_name") == t.get("hypervisor_hostname")}}],
        Hypervisor: [
            {TO: Server,
             EDGE_ATTRIBUTES:
             {TYPE: OWNS,
              MIN: 0,
              MAX: sys.maxint,
              MATCHING_FN:
              lambda f, t:
              f.get("id") and
              f.get("id") == t.get("OS-EXT-SRV-ATTR:hypervisor_hostname")}},
        ],
        Interface: [
            {TO: Port,
             EDGE_ATTRIBUTES:
             {TYPE: ATTACHED_TO,
              MIN: 0,
              MAX: 1,
              MATCHING_FN:
              lambda f, t:
              f.get("mac_addr") and f.get("mac_addr") == t["mac_address"]}}],
        Keypair: [{TO: Server,
                   EDGE_ATTRIBUTES: {TYPE: ATTACHED_TO,
                                     MIN: 0,
                                     MAX: sys.maxint,
                                     # Any keypair can be used on any server.
                                     MATCHING_FN:
                                     lambda f, t:
                                     f.get("fingerprint") is not None and
                                     t is not None}}],
        Server: [{TO: Interface,
                  EDGE_ATTRIBUTES: {TYPE: OWNS,
                                    MIN: 0,
                                    MAX: sys.maxint,
                                    MATCHING_FN:
                                    lambda f, t:
                                    f.get("addresses") and
                                    t.get("mac_addr") and
                                    t.get("mac_addr") in
                                    [y["OS-EXT-IPS-MAC:mac_addr"]
                                     for x in f.get("addresses").values()
                                     for y in x]}},
                 {TO: ServerGroup,
                  EDGE_ATTRIBUTES: {TYPE: MEMBER_OF,
                                    MIN: 0,
                                    MAX: sys.maxint,
                                    MATCHING_FN: lambda f, t:
                                    f.get("hostId") and
                                    f.get("hostId") in t["members"]}},
                                    MATCHING_FN: lambda f, t: False}},
                 # TODO: FILL THIS IN FOR THIS TICKET!!!!!!!!
                 {TO: Volume,
                  EDGE_ATTRIBUTES: {TYPE: ATTACHED_TO,
                                    MIN: 0,
                                    MAX: sys.maxint,
                                    # Deferred for now. Suspect some code will
                                    # need to be ripped up to find this edge,
                                    # because metadata hang off of server
                                    # objects.
                                    MATCHING_FN: lambda f, t: False}},
                 ],
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
    def edgetypes(self):       # pylint: disable=R0201
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
    def locate(nodelist, source_fn, source_value):
        """Return a nodelist entry whose source_fn value matches source_value.

        N.B. This returns the first node found that matches. It does not check
        for nor return multiple matches.

        :param nodelist: The nodes through which to search
        :type nodelist: Iterable of GraphNode
        :keyword source_fn: A function that takes one parameter, which is
                            to a node's attributes
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
