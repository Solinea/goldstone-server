"""Core models."""
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
from django.core.urlresolvers import reverse
from django.db.models import CharField, IntegerField
from django_extensions.db.fields import UUIDField, CreationDateTimeField, \
    ModificationDateTimeField
from elasticsearch_dsl import String, Date, Integer, A
from elasticsearch_dsl.query import Q, QueryString      # pylint: disable=E0611
from goldstone.drfes.models import DailyIndexDocType
from goldstone.glogging.models import LogData, LogEvent
from picklefield.fields import PickledObjectField
from polymorphic import PolymorphicModel

# Get_glance_client is defined here for easy unit test mocking.
from goldstone.utils import get_glance_client, get_nova_client, \
    get_cinder_client, get_keystone_client, get_cloud

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
MEMBER_OF = settings.R_EDGE.MEMBER_OF
OWNS = settings.R_EDGE.OWNS
ROUTES_TO = settings.R_EDGE.ROUTES_TO
SUBSCRIBED_TO = settings.R_EDGE.SUBSCRIBED_TO
TOPOLOGICALLY_OWNS = settings.R_EDGE.TOPOLOGICALLY_OWNS
USES = settings.R_EDGE.USES


def _hash(*args):
    """Return a unique hash of the arguments.

    :param args: Values for generating the unique hash. We convert each one to
                 a string before adding it to the hash
    :type args: tuple
    :rtype: str

    """
    from hashlib import sha256

    result = sha256()
    for arg in args:
        result.update(str(arg))

    return result.hexdigest()


#
# Goldstone Agent Metrics and Reports
#

class MetricData(DailyIndexDocType):
    """Search interface for an agent generated metric."""

    INDEX_PREFIX = 'goldstone_metrics-'

    class Meta:          # pylint: disable=C0111,W0232,C1001
        doc_type = 'core_metric'

    @classmethod
    def stats_agg(cls):
        """Return extended statistics."""

        return A('extended_stats', field='value')

    @classmethod
    def units_agg(cls):
        """Return term units."""

        return A('terms', field='unit')


class ReportData(DailyIndexDocType):
    """Report data model."""

    INDEX_PREFIX = 'goldstone_reports-'

    class Meta:          # pylint: disable=C0111,W0232,C1001
        doc_type = 'core_report'


class EventData(DailyIndexDocType):
    """The model for logstash events data."""

    # The indexes we look for start with this string.
    INDEX_PREFIX = 'events'

    # Time sorting is on this key in the log.
    SORT = '-timestamp'

    class Meta:          # pylint: disable=C0111,W0232,C1001
        # Return all document types.
        doc_type = ''


class ApiPerfData(DailyIndexDocType):
    """API performance record model."""

    INDEX_PREFIX = 'goldstone-'
    SORT = '-@timestamp'

    # Field declarations.
    response_status = Integer()
    creation_time = Date()
    component = String()
    uri = String()
    response_length = Integer()
    response_time = Integer()

    class Meta:          # pylint: disable=C0111,W0232,C1001
        doc_type = 'api_stats'

    @classmethod
    def stats_agg(cls):
        """Return extended statistics."""

        return A('extended_stats', field='response_time')

    @classmethod
    def range_agg(cls):
        """Return range information."""

        return A('range',
                 field='response_status',
                 keyed=True,
                 ranges=[{"from": 200, "to": 299},
                         {"from": 300, "to": 399},
                         {"from": 400, "to": 499},
                         {"from": 500, "to": 599}])


######################################
# Resource graph types and instances #
######################################

def utc_now():
    """Return a timezone-aware current UTC datetime.

    This is needed for a model field's default. It's called every time a row is
    created, and lambdas can't be used because they can't be serialized by
    migrations.

    """
    import arrow

    return arrow.utcnow().datetime


class PolyResource(PolymorphicModel):
    """The base type for resources.

    These are stored in the database.

    """

    # This object's Goldstone UUID.
    uuid = UUIDField(version=1, auto=True, primary_key=True)

    # This object's unique id within its OpenStack cloud. This may be an
    # OpenStack-generated string, or a value we generate from the object's
    # attributes.
    native_id = CharField(max_length=128)

    native_name = CharField(max_length=64)

    # This instance's outgoing edges, as [(dest_uuid, attribute_dict),
    # (dest_uuid, attribute_dict), ...]
    edges = PickledObjectField(default=[])

    # This node's cloud attributes.
    cloud_attributes = PickledObjectField(default={})

    created = CreationDateTimeField(editable=False,
                                    blank=True,
                                    default=utc_now)

    updated = ModificationDateTimeField(editable=True, blank=True)

    class Meta:               # pylint: disable=C0111,W0232,C1001
        verbose_name = "polyresource"

    @classmethod
    def unique_class_id(cls):
        """Return this class' (not object!) unique id."""

        return str(cls)

    @classmethod
    def clouddata(cls):          # pylint: disable=R0201
        """Return information about all the objects of this type within the
        OpenStack cloud.

        :return: Attributes about each instance of this type. Included in each
                 entry are native ids (either returned from the OpenStack
                 client, or generated by Goldstone), resource names (extracted
                 from the resource graph), and resource types (ditto).

        :rtype: list of dict

        """

        return []

    @classmethod
    def resource_name_key(cls):
        """Return the key to use within a clouddata() entry to retrieve an
        instance's name.

        :rtype: str

        """

        return "name"

    @classmethod
    def resource_type_name_key(cls):
        """Return the key to use within a clouddata() entry to retrieve the
        name of an instance's type.

        :rtype: str

        """

        return "type_name"

    @classmethod
    def native_id_key(cls):
        """Return the key to use within a clouddata() entry to retrieve an
        instance's native id.

        Clouddata() returns a list of dicts. Each dict represents an instance
        within the cloud, and contains a native id which will be unique within
        the cloud. If OpenStack defines a unique id, then it's given it a name
        (i.e., key) within the instances' attributes. Otherwise, we create the
        native id ourselves.

        Semantically, this is a class property, but Python doesn't have class
        properties, so it's a method.

        :rtype: str

        """

        return "id"

    @classmethod
    def native_id_from_attributes(cls, attributes):
        """Return an instance's native id from its OpenStack attributes.

        :param attributes: An instance's attributes, e.g., from an
                           xxxxx_client() call
        :type attributes: dict

        """

        return attributes[cls.native_id_key()]

    @classmethod
    def type_outgoing_edges(cls):      # pylint: disable=R0201
        """Return the edges leaving this type.

        :return: Entries in the form of:
                 TO: The destination type
                 MATCHING_FN: Callable(from_attr_dict, to_attr_dict).  If
                              there's a match between the from_node's and
                              to_node's attribute dicts, we draw a Resource
                              graph edge. Note: This must be prepared for
                              absent keys, and not throw exceptions.
                 EDGE_ATTTRIBUTES: This edge's attributes:
                     TYPE: The type of this edge
                     MIN: A resource graph node has a minimum number of this
                          edge ntype
                     MAX: A resource graph node has a maximum number of this
                          edge type
        :rtype: list of dict

        """

        return []

    @classmethod
    def resource_list_url(cls):
        """Return a relative URL for the the client's "resource list" display.

        This is currently defined only for leaf nodes. There's no reason why it
        couldn't include non-leaf nodes in the future.

        :rtype: str

        """

        return ''

    @classmethod
    def integration(cls):
        """Return the lowercase name of this node's integration. (nova,
        keystone, etc.)

        """

        return ''

    def label(self):
        """Return the name of this node's resource type.

        This should be lowercase plural.

        """

        return ''

    def update_edges(self):
        """Update this persistent instance's edges with what's in the
        persistent resource graph."""

        outgoing = []

        # For every possible edge from this node's type...
        for edge in self.type_outgoing_edges():
            # Get the target neighbor's type and matching function.
            neighbor_type = edge[TO]
            match_fn = edge[MATCHING_FN]

            # For all nodes of the desired type...
            for candidate in neighbor_type.objects.all():
                if match_fn(self.cloud_attributes, candidate.cloud_attributes):
                    # We have a match! Create an edge to this candidate.
                    outgoing.append((candidate.uuid, edge[EDGE_ATTRIBUTES]))

        # Save the edges.
        self.edges = outgoing
        self.save()

    def logs(self):
        """Return a search object for logs related to this resource.

        The default implementation just looks for the name of the resource
        in any of the fields.

        """

        query = Q(QueryString(query=self.native_name))
        return LogData.search().query(query)

    def events(self):
        """Return a search object for events related to this resource.

        The default implementation looks for logging event types with this
        resource name appearing in any field.

        """

        # this protects our hostname from being tokenized
        escaped_name = r'"' + self.native_name + r'"'

        name_query = Q(QueryString(query=escaped_name, default_field="_all"))
        return LogEvent.search().query(name_query)


############################################
# These classes represent add-on entities. #
############################################

class Addon(PolyResource):
    """The root node for user-installed Goldstone add-ons."""

    @classmethod
    def clouddata(cls):
        """See the parent class' method's docstring."""

        return [x.cloud_attributes for x in Addon.objects.all()]

    @classmethod
    def integration(cls):
        """See the parent class' method's docstring."""

        return "add-on"

    def label(self):
        """See the parent class' method's docstring."""

        return "add-ons"


###################################################
# These classes represent a Keystone integration. #
###################################################

class Keystone(PolyResource):
    """An OpenStack integration.

    This is a "virtual node". It exists to enhance the readability of the
    topology graph in the Goldstone client.

    """

    @classmethod
    def clouddata(cls):
        """See the parent class' method's docstring.

        Since this is a virtual node, the persistent resource graph objects are
        the, "nodes in the cloud."

        """

        return [x.cloud_attributes for x in Keystone.objects.all()]

    @classmethod
    def type_outgoing_edges(cls):      # pylint: disable=R0201
        """Return the edges leaving this type."""

        return [{TO: Endpoint,
                 MATCHING_FN: lambda f, t: True,
                 EDGE_ATTRIBUTES:
                 {TYPE: TOPOLOGICALLY_OWNS, MIN: 0, MAX: sys.maxint}},
                {TO: Role,
                 MATCHING_FN: lambda f, t: True,
                 EDGE_ATTRIBUTES:
                 {TYPE: TOPOLOGICALLY_OWNS, MIN: 0, MAX: sys.maxint}},
                {TO: User,
                 MATCHING_FN: lambda f, t: True,
                 EDGE_ATTRIBUTES:
                 {TYPE: TOPOLOGICALLY_OWNS, MIN: 0, MAX: sys.maxint}},
                {TO: Service,
                 MATCHING_FN: lambda f, t: "keystone" in t.get("name", ''),
                 EDGE_ATTRIBUTES:
                 {TYPE: TOPOLOGICALLY_OWNS, MIN: 0, MAX: sys.maxint}},
                ]

    @classmethod
    def integration(cls):
        """See the parent class' method's docstring."""

        return "keystone"

    def label(self):
        """See the parent class' method's docstring."""

        return "keystone"


class User(PolyResource):
    """An OpenStack user."""

    @classmethod
    def clouddata(cls):
        """See the parent class' method's docstring.

        Because this is a topological leaf node, the returned list contains one
        entry.

        """

        keystone_client = get_keystone_client()['client']

        if keystone_client.users.list():
            return [{"name": "users",
                     cls.native_id_key(): "users",
                     cls.resource_type_name_key(): cls.unique_class_id()}]
        else:
            return []

    @classmethod
    def type_outgoing_edges(cls):      # pylint: disable=R0201
        """Return the edges leaving this type."""

        return [{TO: Credential,
                 MATCHING_FN:
                 lambda f, t: f.get("id") and f["id"] == t["user_id"],
                 EDGE_ATTRIBUTES: {TYPE: CONTAINS, MIN: 0, MAX: sys.maxint}},
                {TO: Credential,
                 MATCHING_FN:
                 lambda f, t: f.get("id") and f["id"] == t["user_id"],
                 EDGE_ATTRIBUTES:
                 {TYPE: TOPOLOGICALLY_OWNS, MIN: 0, MAX: sys.maxint}},
                {TO: Domain,
                 MATCHING_FN:
                 lambda f, t:
                 f.get("domain_id") and f["domain_id"] == t["id"],
                 EDGE_ATTRIBUTES:
                 {TYPE: ASSIGNED_TO, MIN: 0, MAX: sys.maxint}},
                {TO: Group,
                 MATCHING_FN:
                 lambda f, t:
                 f.get("domain_id") and f["domain_id"] == t["domain_id"],
                 EDGE_ATTRIBUTES:
                 {TYPE: ASSIGNED_TO, MIN: 0, MAX: sys.maxint}},
                {TO: Project,
                 MATCHING_FN:
                 lambda f, t:
                 f.get("default_project_id") and
                 f["default_project_id"] == t["id"],
                 EDGE_ATTRIBUTES: {TYPE: ASSIGNED_TO, MIN: 0, MAX: 1}},
                {TO: QuotaSet,
                 MATCHING_FN: lambda f, t: False,
                 EDGE_ATTRIBUTES: {TYPE: SUBSCRIBED_TO,
                                   MIN: 0,
                                   MAX: sys.maxint}},
                ]

    @classmethod
    def resource_list_url(cls):
        """See the parent class' method's docstring."""

        return reverse("keystone-users") + "/?region={region}"

    @classmethod
    def integration(cls):
        """See the parent class' method's docstring."""

        return "keystone"

    def label(self):
        """See the parent class' method's docstring."""

        return "users"


class Domain(PolyResource):
    """An OpenStack domain."""

    @classmethod
    def clouddata(cls):
        """See the parent class' method's docstring."""

        keystone_client = get_keystone_client()['client']

        result = []

        for entry in keystone_client.domains.list():
            this_entry = entry.to_dict()

            # Add the name of the resource type.
            this_entry[cls.resource_type_name_key()] = cls.unique_class_id()

            result.append(this_entry)

        return result

    @classmethod
    def type_outgoing_edges(cls):      # pylint: disable=R0201
        """Return the edges leaving this type."""

        return [{TO: Group,
                 MATCHING_FN:
                 lambda f, t: f.get("id") and f["id"] == t["domain_id"],
                 EDGE_ATTRIBUTES: {TYPE: CONTAINS, MIN: 0, MAX: sys.maxint}},
                {TO: Group,
                 MATCHING_FN:
                 lambda f, t: f.get("id") and f["id"] == t["domain_id"],
                 EDGE_ATTRIBUTES:
                 {TYPE: TOPOLOGICALLY_OWNS, MIN: 0, MAX: sys.maxint}},
                {TO: Project,
                 MATCHING_FN:
                 lambda f, t: f.get("id") and f["id"] == t["domain_id"],
                 EDGE_ATTRIBUTES: {TYPE: CONTAINS, MIN: 0, MAX: sys.maxint}},
                {TO: Project,
                 MATCHING_FN:
                 lambda f, t: f.get("id") and f["id"] == t["domain_id"],
                 EDGE_ATTRIBUTES:
                 {TYPE: TOPOLOGICALLY_OWNS, MIN: 0, MAX: sys.maxint}},
                ]

    @classmethod
    def integration(cls):
        """See the parent class' method's docstring."""

        return "keystone"

    def label(self):
        """See the parent class' method's docstring."""

        return "domains"


class Group(PolyResource):
    """An OpenStack group."""

    @classmethod
    def clouddata(cls):
        """See the parent class' method's docstring."""

        keystone_client = get_keystone_client()['client']

        result = []

        for entry in keystone_client.groups.list():
            this_entry = entry.to_dict()

            # Add the name of the resource type.
            this_entry[cls.resource_type_name_key()] = cls.unique_class_id()

            result.append(this_entry)

        return result

    @classmethod
    def type_outgoing_edges(cls):      # pylint: disable=R0201
        """Return the edges leaving this type."""

        return [{TO: Domain,
                 MATCHING_FN:
                 lambda f, t: f.get("domain_id") and f["domain_id"] == t["id"],
                 EDGE_ATTRIBUTES: {TYPE: MEMBER_OF, MIN: 0, MAX: sys.maxint}},
                ]

    @classmethod
    def integration(cls):
        """See the parent class' method's docstring."""

        return "keystone"

    def label(self):
        """See the parent class' method's docstring."""

        return "groups"


class Token(PolyResource):
    """An OpenStack token."""

    @classmethod
    def type_outgoing_edges(cls):      # pylint: disable=R0201
        """Return the edges leaving this type."""

        return [{TO: User,
                 EDGE_ATTRIBUTES: {TYPE: ASSIGNED_TO,
                                   MIN: 0,
                                   MAX: sys.maxint}},
                ]

    @classmethod
    def integration(cls):
        """See the parent class' method's docstring."""

        return "keystone"

    def label(self):
        """See the parent class' method's docstring."""

        return "tokens"


class Credential(PolyResource):
    """An OpenStack credential."""

    @classmethod
    def type_outgoing_edges(cls):      # pylint: disable=R0201
        """Return the edges leaving this type."""

        return [{TO: Project,
                 EDGE_ATTRIBUTES: {TYPE: ASSIGNED_TO, MIN: 1, MAX: 1}},
                ]

    @classmethod
    def integration(cls):
        """See the parent class' method's docstring."""

        return "keystone"

    def label(self):
        """See the parent class' method's docstring."""

        return "credentials"


class Role(PolyResource):
    """An OpenStack role.

    Because this is a topological leaf node, the returned list contains one
    entry.

    """

    @classmethod
    def clouddata(cls):
        """See the parent class' method's docstring."""

        keystone_client = get_keystone_client()['client']

        if keystone_client.users.list():
            return [{"name": "roles",
                     cls.native_id_key(): "roles",
                     cls.resource_type_name_key(): cls.unique_class_id()}]
        else:
            return []

    @classmethod
    def resource_list_url(cls):
        """See the parent class' method's docstring."""

        return reverse("keystone-roles") + "/?region={region}"

    @classmethod
    def integration(cls):
        """See the parent class' method's docstring."""

        return "keystone"

    def label(self):
        """See the parent class' method's docstring."""

        return "roles"


class Region(PolyResource):
    """An OpenStack region."""

    @classmethod
    def clouddata(cls):
        """See the parent class' method's docstring."""

        keystone_client = get_keystone_client()['client']

        result = []

        for entry in keystone_client.regions.list():
            this_entry = entry.to_dict()

            # Add the name of the resource type.
            this_entry[cls.resource_type_name_key()] = cls.unique_class_id()

            result.append(this_entry)

        return result

    @classmethod
    def type_outgoing_edges(cls):      # pylint: disable=R0201
        """Return the edges leaving this type."""

        return [{TO: Keystone,
                 MATCHING_FN:
                 lambda f, t: f.get("id") and f["id"] == t["id"],
                 EDGE_ATTRIBUTES: {TYPE: TOPOLOGICALLY_OWNS, MIN: 1, MAX: 1}},
                {TO: Cinder,
                 MATCHING_FN:
                 lambda f, t: f.get("id") and f["id"] == t["id"],
                 EDGE_ATTRIBUTES: {TYPE: TOPOLOGICALLY_OWNS, MIN: 1, MAX: 1}},
                {TO: Nova,
                 MATCHING_FN:
                 lambda f, t: f.get("id") and f["id"] == t["id"],
                 EDGE_ATTRIBUTES: {TYPE: TOPOLOGICALLY_OWNS, MIN: 1, MAX: 1}},
                {TO: Neutron,
                 MATCHING_FN:
                 lambda f, t: f.get("id") and f["id"] == t["id"],
                 EDGE_ATTRIBUTES: {TYPE: TOPOLOGICALLY_OWNS, MIN: 1, MAX: 1}},
                {TO: Glance,
                 MATCHING_FN:
                 lambda f, t: f.get("id") and f["id"] == t["id"],
                 EDGE_ATTRIBUTES: {TYPE: TOPOLOGICALLY_OWNS, MIN: 1, MAX: 1}},
                {TO: Addon,
                 # Any add-on can be used in any region...
                 MATCHING_FN: lambda f, t: True,
                 EDGE_ATTRIBUTES: {TYPE: TOPOLOGICALLY_OWNS, MIN: 1, MAX: 1}},
                ]

    @classmethod
    def integration(cls):
        """See the parent class' method's docstring."""

        return "keystone"

    def label(self):
        """See the parent class' method's docstring."""

        return "regions"


class Endpoint(PolyResource):
    """An OpenStack endpoint."""

    @classmethod
    def clouddata(cls):
        """See the parent class' method's docstring.

        Because this is a topological leaf node, the returned list contains one
        entry per interface.

        """

        keystone_client = get_keystone_client()['client']

        # Note: Endpoints may have identical service_ids for the public,
        # private, and admin interfaces. The endpoint's dict will contain an
        # "interface" key, and we look for it.
        result = []
        seen_interfaces = set()

        for entry in keystone_client.endpoints.list():
            # this_entry = entry.to_dict()
            # interface = this_entry["interface"]
            interface = entry.interface

            if interface not in seen_interfaces:
                # We haven't seen this interface before.  Add it.
                seen_interfaces.add(interface)

                result.append({"name": "endpoints " + interface,
                               cls.native_id_key(): "endpoints " + interface,
                               "zone": interface,
                               cls.resource_type_name_key():
                               cls.unique_class_id()})

        return result

    @classmethod
    def resource_list_url(cls):
        """See the parent class' method's docstring."""

        return reverse("keystone-endpoints") + "/?region={region}&zone={zone}"

    @classmethod
    def integration(cls):
        """See the parent class' method's docstring."""

        return "keystone"

    def label(self):
        """See the parent class' method's docstring."""

        zone = self.cloud_attributes.get("zone")    # pylint: disable=E1101
        return "%s endpoints" % zone if zone else "endpoints"


class Service(PolyResource):
    """An OpenStack service.

    This type represents Keystone, Cinder, and Nova services.

    """

    @classmethod
    def clouddata(cls):
        """See the parent class' method's docstring.

        Because this is a topological leaf node, the returned list contains one
        entry per Keystone, Cinder, or Nova, if services exist for them.

        """

        # Set up to loop over the clients.
        keystone_client = get_keystone_client()['client']
        cinder_client = get_cinder_client()['client']
        nova_client = get_nova_client()['client']

        clients = [[keystone_client, "keystone services"],
                   [nova_client, "nova services"],
                   [cinder_client, "cinder services"]]

        result = []

        for client, client_name in clients:
            if client.services.list():
                # Services exist for this client.  Make a leaf node.
                result.append({"name": client_name,
                               cls.native_id_key(): client_name,
                               cls.resource_type_name_key():
                               cls.unique_class_id()})

        return result

    @classmethod
    def resource_list_url(cls):
        """See the parent class' method's docstring."""

        return "/{parent_integration}/" + cls().label() + "/?region={region}"

    @classmethod
    def integration(cls):
        """See the parent class' method's docstring."""

        return "keystone"

    def label(self):
        """See the parent class' method's docstring."""

        return "services"


class Project(PolyResource):
    """An OpenStack project.

    Note: We have no API endpoint for drilling down into interfaces yet.

    """

    @classmethod
    def clouddata(cls):
        """See the parent class' method's docstring."""

        keystone_client = get_keystone_client()['client']

        result = []

        for entry in keystone_client.projects.list():
            this_entry = entry.to_dict()

            # Add the name of the resource type.
            this_entry[cls.resource_type_name_key()] = cls.unique_class_id()

            result.append(this_entry)

        return result

    @classmethod
    def type_outgoing_edges(cls):      # pylint: disable=R0201
        """Return the edges leaving this type."""

        return [{TO: Image,
                 MATCHING_FN:
                 lambda f, t: f.get("id") and f.get("id") == t.get("id"),
                 EDGE_ATTRIBUTES: {TYPE: MEMBER_OF, MIN: 0, MAX: sys.maxint}},
                {TO: Keypair,
                 MATCHING_FN:
                 lambda f, t: f.get("id") and f.get("id") == t.get("id"),
                 EDGE_ATTRIBUTES: {TYPE: OWNS, MIN: 0, MAX: sys.maxint}},
                {TO: Keypair,
                 MATCHING_FN:
                 lambda f, t: f.get("id") and f.get("id") == t.get("id"),
                 EDGE_ATTRIBUTES:
                 {TYPE: TOPOLOGICALLY_OWNS, MIN: 0, MAX: sys.maxint}},
                {TO: NovaLimits,
                 MATCHING_FN:
                 lambda f, t: f.get("id") and f.get("id") == t.get("id"),
                 EDGE_ATTRIBUTES: {TYPE: OWNS, MIN: 1, MAX: 1}},
                {TO: Server,
                 MATCHING_FN:
                 lambda f, t: f.get("id") and f.get("id") == t.get("id"),
                 EDGE_ATTRIBUTES: {TYPE: OWNS, MIN: 1, MAX: sys.maxint}},
                {TO: MeteringLabel,
                 MATCHING_FN:
                 lambda f, t: f.get("id") and f.get("id") == t.get("id"),
                 EDGE_ATTRIBUTES: {TYPE: OWNS, MIN: 0, MAX: sys.maxint}},
                {TO: NeutronQuota,
                 MATCHING_FN:
                 lambda f, t: f.get("id") and f.get("id") == t.get("id"),
                 EDGE_ATTRIBUTES: {TYPE: SUBSCRIBED_TO, MIN: 1, MAX: 1}},
                {TO: Network,
                 MATCHING_FN:
                 lambda f, t: f.get("id") and f.get("id") == t.get("id"),
                 EDGE_ATTRIBUTES: {TYPE: USES, MIN: 0, MAX: sys.maxint}},
                {TO: Network,
                 MATCHING_FN:
                 lambda f, t: f.get("id") and f.get("id") == t.get("id"),
                 EDGE_ATTRIBUTES: {TYPE: OWNS, MIN: 0, MAX: sys.maxint}},
                {TO: Subnet,
                 MATCHING_FN:
                 lambda f, t: f.get("id") and f.get("id") == t.get("id"),
                 EDGE_ATTRIBUTES: {TYPE: OWNS, MIN: 0, MAX: sys.maxint}},
                {TO: LBMember,
                 MATCHING_FN:
                 lambda f, t: f.get("id") and f.get("id") == t.get("id"),
                 EDGE_ATTRIBUTES: {TYPE: OWNS, MIN: 0, MAX: sys.maxint}},
                {TO: HealthMonitor,
                 MATCHING_FN:
                 lambda f, t: f.get("id") and f.get("id") == t.get("id"),
                 EDGE_ATTRIBUTES: {TYPE: OWNS, MIN: 0, MAX: sys.maxint}},
                {TO: LBVIP,
                 MATCHING_FN:
                 lambda f, t: f.get("id") and f.get("id") == t.get("id"),
                 EDGE_ATTRIBUTES: {TYPE: OWNS, MIN: 0, MAX: sys.maxint}},
                {TO: Port,
                 MATCHING_FN:
                 lambda f, t: f.get("id") and f.get("id") == t.get("id"),
                 EDGE_ATTRIBUTES: {TYPE: OWNS, MIN: 0, MAX: sys.maxint}},
                {TO: SecurityRules,
                 MATCHING_FN:
                 lambda f, t: f.get("id") and f.get("id") == t.get("id"),
                 EDGE_ATTRIBUTES: {TYPE: OWNS, MIN: 0, MAX: sys.maxint}},
                {TO: QuotaSet,
                 MATCHING_FN:
                 lambda f, t: f.get("id") and f.get("id") == t.get("id"),
                 EDGE_ATTRIBUTES:
                 {TYPE: SUBSCRIBED_TO, MIN: 0, MAX: sys.maxint}},
                {TO: QOSSpec,
                 MATCHING_FN:
                 lambda f, t: f.get("id") and f.get("id") == t.get("id"),
                 EDGE_ATTRIBUTES: {TYPE: OWNS, MIN: 0, MAX: sys.maxint}},
                {TO: Snapshot,
                 MATCHING_FN:
                 lambda f, t: f.get("id") and f.get("id") == t.get("id"),
                 EDGE_ATTRIBUTES: {TYPE: OWNS, MIN: 0, MAX: sys.maxint}},
                {TO: Volume,
                 MATCHING_FN:
                 lambda f, t: f.get("id") and f.get("id") == t.get("id"),
                 EDGE_ATTRIBUTES: {TYPE: MEMBER_OF, MIN: 0, MAX: sys.maxint}},
                {TO: Volume,
                 MATCHING_FN:
                 lambda f, t: f.get("id") and f.get("id") == t.get("id"),
                 EDGE_ATTRIBUTES:
                 {TYPE: TOPOLOGICALLY_OWNS, MIN: 0, MAX: sys.maxint}},
                {TO: Limits,
                 MATCHING_FN:
                 lambda f, t: f.get("id") and f.get("id") == t.get("id"),
                 EDGE_ATTRIBUTES: {TYPE: OWNS, MIN: 0, MAX: sys.maxint}},
                ]

    @classmethod
    def integration(cls):
        """See the parent class' method's docstring."""

        return "keystone"

    def label(self):
        """See the parent class' method's docstring."""

        return "projects"


###############################################
# These classes represent a Nova integration. #
###############################################

class Nova(PolyResource):
    """An OpenStack integration.

    This is a "virtual node". It exists to enhance the readability of the
    topology graph in the Goldstone client.

    """

    @classmethod
    def clouddata(cls):
        """See the parent class' method's docstring.

        Since this is a virtual node, the persistent resource graph objects are
        the, "nodes in the cloud."

        """

        return [x.cloud_attributes for x in Nova.objects.all()]

    @classmethod
    def type_outgoing_edges(cls):      # pylint: disable=R0201
        """Return the edges leaving this type."""

        return [{TO: Flavor,
                 MATCHING_FN: lambda f, t: True,
                 EDGE_ATTRIBUTES:
                 {TYPE: TOPOLOGICALLY_OWNS, MIN: 0, MAX: sys.maxint}},
                {TO: Service,
                 MATCHING_FN: lambda f, t: "nova" in t.get("name", ''),
                 EDGE_ATTRIBUTES:
                 {TYPE: TOPOLOGICALLY_OWNS, MIN: 0, MAX: sys.maxint}},
                {TO: Server,
                 MATCHING_FN: lambda f, t: True,
                 EDGE_ATTRIBUTES:
                 {TYPE: TOPOLOGICALLY_OWNS, MIN: 0, MAX: sys.maxint}},
                {TO: Host,
                 MATCHING_FN: lambda f, t: True,
                 EDGE_ATTRIBUTES:
                 {TYPE: TOPOLOGICALLY_OWNS, MIN: 0, MAX: sys.maxint}},
                {TO: Hypervisor,
                 MATCHING_FN: lambda f, t: True,
                 EDGE_ATTRIBUTES:
                 {TYPE: TOPOLOGICALLY_OWNS, MIN: 0, MAX: sys.maxint}},
                {TO: AvailabilityZone,
                 MATCHING_FN:
                 lambda f, t: f.get("id") and f["id"] == t["zoneName"],
                 EDGE_ATTRIBUTES:
                 {TYPE: TOPOLOGICALLY_OWNS, MIN: 1, MAX: sys.maxint}},
                {TO: Cloudpipe,
                 MATCHING_FN:
                 lambda f, t: f.get("id") and f["id"] == t["zoneName"],
                 EDGE_ATTRIBUTES:
                 {TYPE: TOPOLOGICALLY_OWNS, MIN: 1, MAX: sys.maxint}},
                ]

    @classmethod
    def integration(cls):
        """See the parent class' method's docstring."""

        return "nova"

    def label(self):
        """See the parent class' method's docstring."""

        return "nova"


class AvailabilityZone(PolyResource):
    """An OpenStack Availability Zone."""

    @classmethod
    def clouddata(cls):
        """See the parent class' method's docstring."""

        nova_client = get_nova_client()["client"]
        nova_client.client.authenticate()

        result = []

        for entry in nova_client.availability_zones.list():
            this_entry = entry.to_dict()

            # The resource's name is at key "zoneName", so we have to copy it
            # to where the client expects it. And add the name of the resource
            # type.
            this_entry[cls.resource_name_key()] = this_entry.get("zoneName",
                                                                 "None")
            this_entry[cls.resource_type_name_key()] = cls.unique_class_id()

            result.append(this_entry)

        return result

    @classmethod
    def native_id_key(cls):
        """See the parent class' method's docstring."""

        return "zoneName"

    @classmethod
    def type_outgoing_edges(cls):      # pylint: disable=R0201
        """Return the edges leaving this type."""

        return [
            {TO: Aggregate,
             MATCHING_FN:
             lambda f, t:
             f.get("zoneName") and
             f.get("zoneName") == t.get("availability_zone"),
             EDGE_ATTRIBUTES: {TYPE: OWNS, MIN: 0, MAX: sys.maxint}},
            {TO: Aggregate,
             MATCHING_FN:
             lambda f, t:
             f.get("zoneName") and
             f.get("zoneName") == t.get("availability_zone"),
             EDGE_ATTRIBUTES:
             {TYPE: TOPOLOGICALLY_OWNS, MIN: 0, MAX: sys.maxint}},
            {TO: Host,
             MATCHING_FN:
             lambda f, t:
             f.get("zoneName") and f.get("zoneName") == t.get("zone"),
             EDGE_ATTRIBUTES: {TYPE: OWNS, MIN: 0, MAX: sys.maxint}},
            {TO: Host,
             MATCHING_FN:
             lambda f, t:
             f.get("zoneName") and f.get("zoneName") == t.get("zone"),
             EDGE_ATTRIBUTES:
             {TYPE: TOPOLOGICALLY_OWNS, MIN: 0, MAX: sys.maxint}},
            ]

    @classmethod
    def integration(cls):
        """See the parent class' method's docstring."""

        return "nova"

    def label(self):
        """See the parent class' method's docstring."""

        return "availability zones"


class Aggregate(PolyResource):
    """An OpenStack Aggregate."""

    @classmethod
    def clouddata(cls):
        """See the parent class' method's docstring."""

        nova_client = get_nova_client()["client"]
        nova_client.client.authenticate()

        result = []

        # For every Aggregate in the cloud...
        for entry in nova_client.aggregates.list():
            # Make a dict for this entry, and concoct a unique id for it.
            this_entry = entry.to_dict()
            this_entry[cls.native_id_key()] = \
                cls.native_id_from_attributes(this_entry)

            # Add the name of the resource type.
            this_entry[cls.resource_type_name_key()] = cls.unique_class_id()

            result.append(this_entry)

        return result

    @classmethod
    def native_id_key(cls):
        """See the parent class' method's docstring."""

        return "unique_cloud_id"

    @classmethod
    def native_id_from_attributes(cls, attributes):
        """See the parent class' method's docstring."""

        return _hash(cls.unique_class_id(), attributes.get("id", ''))

    @classmethod
    def integration(cls):
        """See the parent class' method's docstring."""

        return "nova"

    def label(self):
        """See the parent class' method's docstring."""

        return "aggregates"


class Flavor(PolyResource):
    """An OpenStack Flavor."""

    @classmethod
    def clouddata(cls):
        """See the parent class' method's docstring.

        Because this is a topological leaf node, the returned list contains one
        entry.

        """

        nova_client = get_nova_client()["client"]
        nova_client.client.authenticate()

        if nova_client.flavors.list():
            return [{"name": "flavors",
                     cls.native_id_key(): "flavors",
                     cls.resource_type_name_key(): cls.unique_class_id()}]
        else:
            return []

    @classmethod
    def native_id_key(cls):
        """See the parent class' method's docstring."""

        return "unique_cloud_id"

    @classmethod
    def native_id_from_attributes(cls, attributes):
        """See the parent class' method's docstring."""

        return _hash(cls.unique_class_id(), attributes.get("id", ''))

    @classmethod
    def type_outgoing_edges(cls):      # pylint: disable=R0201
        """Return the edges leaving this type."""

        return [
            {TO: Server,
             MATCHING_FN:
             lambda f, t:
             f.get("id") and f.get("id") == t.get("flavor", {}).get("id"),
             EDGE_ATTRIBUTES: {TYPE: DEFINES, MIN: 0, MAX: sys.maxint}},
            {TO: Server,
             MATCHING_FN:
             lambda f, t:
             f.get("id") and f.get("id") == t.get("flavor", {}).get("id"),
             EDGE_ATTRIBUTES:
             {TYPE: TOPOLOGICALLY_OWNS, MIN: 0, MAX: sys.maxint}},
            ]

    @classmethod
    def resource_list_url(cls):
        """See the parent class' method's docstring."""

        return reverse("nova-flavors") + "/?region={region}"

    @classmethod
    def integration(cls):
        """See the parent class' method's docstring."""

        return "nova"

    def label(self):
        """See the parent class' method's docstring."""

        return "flavors"


class Keypair(PolyResource):
    """An OpenStack Keypair."""

    @classmethod
    def clouddata(cls):
        """See the parent class' method's docstring."""

        nova_client = get_nova_client()["client"]
        nova_client.client.authenticate()

        result = []

        for entry in nova_client.keypairs.list():
            this_entry = entry.to_dict()["keypair"]

            # Add the name of the resource type.
            this_entry[cls.resource_type_name_key()] = cls.unique_class_id()

            result.append(this_entry)

        return result

    @classmethod
    def native_id_key(cls):
        """See the parent class' method's docstring."""

        return "fingerprint"

    @classmethod
    def type_outgoing_edges(cls):      # pylint: disable=R0201
        """Return the edges leaving this type."""

        return [{TO: Server,
                 # Any keypair can be used on any server.
                 MATCHING_FN:
                 lambda f, t:
                 f.get("fingerprint") is not None and t is not None,
                 EDGE_ATTRIBUTES:
                 {TYPE: ATTACHED_TO, MIN: 0, MAX: sys.maxint}},
                ]

    @classmethod
    def integration(cls):
        """See the parent class' method's docstring."""

        return "nova"

    def label(self):
        """See the parent class' method's docstring."""

        return "keypairs"


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

    @classmethod
    def clouddata(cls):
        """See the parent class' method's docstring."""

        nova_client = get_nova_client()["client"]
        nova_client.client.authenticate()
        hosts = [x.to_dict() for x in nova_client.hosts.list()]

        # Nova has no problem showing you multiple instance of the same host.
        # If a host shows up multiple times in the list, it probably has
        # multiple service running on it.  We'll de-dupe this, and preserve the
        # Availability Zone for each one.
        result = []

        # For every found host...
        for host in hosts:
            parsed_name = Host._parse_host_name(host["host_name"])[0]

            if all(x["host_name"] != parsed_name for x in result):
                # This is a new entry for the result set. Set the host_name
                # value, and concoct a unique id for it.
                host["host_name"] = parsed_name
                host[cls.native_id_key()] = cls.native_id_from_attributes(host)

                # The resource's name is at key "host_name", so we have to copy
                # it to where the client expects it. And add the name of the
                # resource type.
                host[cls.resource_name_key()] = host.get("host_name", "None")
                host[cls.resource_type_name_key()] = cls.unique_class_id()

                # We don't want or need this key.
                del host["service"]

                result.append(host)

        return result

    @classmethod
    def native_id_key(cls):
        """See the parent class' method's docstring."""

        return "unique_cloud_id"

    @classmethod
    def native_id_from_attributes(cls, attributes):
        """See the parent class' method's docstring."""

        return _hash(cls.unique_class_id(), attributes.get("host_name", ''))

    @classmethod
    def type_outgoing_edges(cls):      # pylint: disable=R0201
        """Return the edges leaving this type."""

        return [
            {TO: Aggregate,
             MATCHING_FN:
             lambda f, t:
             f.get("host_name") and f.get("host_name") in t.get("hosts", []),
             EDGE_ATTRIBUTES: {TYPE: MEMBER_OF, MIN: 0, MAX: sys.maxint}},
            {TO: Hypervisor,
             MATCHING_FN:
             lambda f, t:
             f.get("host_name") and
             f.get("host_name") == t.get("hypervisor_hostname"),
             EDGE_ATTRIBUTES: {TYPE: OWNS, MIN: 0, MAX: 1}},
            {TO: Hypervisor,
             MATCHING_FN:
             lambda f, t:
             f.get("host_name") and
             f.get("host_name") == t.get("hypervisor_hostname"),
             EDGE_ATTRIBUTES:
             {TYPE: TOPOLOGICALLY_OWNS, MIN: 0, MAX: 1}},
            ]

    @classmethod
    def resource_list_url(cls):
        """See the parent class' method's docstring."""

        # Unclear what the zone argument should be. Until this is resolved,
        # don't use it.
        # return reverse("nova-hosts") + "/?region={region}&zone={zone}"
        return reverse("nova-hosts") + "/?region={region}"

    @classmethod
    def integration(cls):
        """See the parent class' method's docstring."""

        return "nova"

    def label(self):
        """See the parent class' method's docstring."""

        return "hosts"


class Hypervisor(PolyResource):
    """An OpenStack Hypervisor."""

    virt_cpus = IntegerField(editable=True, blank=True, default=8)
    memory = IntegerField(editable=True, blank=True, default=8192)

    @classmethod
    def clouddata(cls):
        """See the parent class' method's docstring."""

        nova_client = get_nova_client()["client"]
        nova_client.client.authenticate()

        result = []

        # For every Hypervisor in the cloud...
        for entry in nova_client.hypervisors.list():
            # Make a dict for this entry, and concoct a unique id for it.
            this_entry = entry.to_dict()
            this_entry[cls.native_id_key()] = \
                cls.native_id_from_attributes(this_entry)

            # Indicate that the hypervisor has no name, and add the name of the
            # resource type.
            this_entry[cls.resource_name_key()] = "None"
            this_entry[cls.resource_type_name_key()] = cls.unique_class_id()

            result.append(this_entry)

        return result

    @classmethod
    def native_id_key(cls):
        """See the parent class' method's docstring."""

        return "unique_cloud_id"

    @classmethod
    def native_id_from_attributes(cls, attributes):
        """See the parent class' method's docstring."""

        return _hash(cls.unique_class_id(), attributes.get("id", ''))

    @classmethod
    def type_outgoing_edges(cls):      # pylint: disable=R0201
        """Return the edges leaving this type."""

        return [{TO: Server,
                 MATCHING_FN:
                 lambda f, t:
                 f.get("id") and
                 f.get("id") == t.get("OS-EXT-SRV-ATTR:hypervisor_hostname"),
                 EDGE_ATTRIBUTES: {TYPE: OWNS, MIN: 0, MAX: sys.maxint}},
                {TO: Server,
                 MATCHING_FN:
                 lambda f, t:
                 f.get("id") and
                 f.get("id") == t.get("OS-EXT-SRV-ATTR:hypervisor_hostname"),
                 EDGE_ATTRIBUTES:
                 {TYPE: TOPOLOGICALLY_OWNS, MIN: 0, MAX: sys.maxint}},
                ]

    @classmethod
    def resource_list_url(cls):
        """See the parent class' method's docstring."""

        return reverse("nova-hypervisors") + "/?region={region}"

    @classmethod
    def integration(cls):
        """See the parent class' method's docstring."""

        return "nova"

    def label(self):
        """See the parent class' method's docstring."""

        return "hypervisors"


class Cloudpipe(PolyResource):
    """An OpenStack Cloudpipe."""

    @classmethod
    def clouddata(cls):
        """See the parent class' method's docstring."""

        nova_client = get_nova_client()["client"]
        nova_client.client.authenticate()

        result = []

        for entry in nova_client.cloudpipe.list():
            this_entry = entry.to_dict()

            # Indicate that the cloudpipe has no name, and add the name of the
            # resource type.
            this_entry[cls.resource_name_key()] = "None"
            this_entry[cls.resource_type_name_key()] = cls.unique_class_id()

            result.append(this_entry)

        return result

    @classmethod
    def native_id_key(cls):
        """See the parent class' method's docstring."""

        return "project_id"

    @classmethod
    def type_outgoing_edges(cls):      # pylint: disable=R0201
        """Return the edges leaving this type."""

        return [
            {TO: Server,
             MATCHING_FN:
             lambda f, t: f.get("id") and f.get("id") == t.get("id"),
             EDGE_ATTRIBUTES: {TYPE: INSTANCE_OF, MIN: 1, MAX: 1}},
            ]

    @classmethod
    def integration(cls):
        """See the parent class' method's docstring."""

        return "nova"

    def label(self):
        """See the parent class' method's docstring."""

        return "cloudpipes"


class ServerGroup(PolyResource):
    """An OpenStack Server Group."""

    @classmethod
    def clouddata(cls):
        """See the parent class' method's docstring."""

        nova_client = get_nova_client()["client"]
        nova_client.client.authenticate()

        result = []

        # For every ServerGroup...
        for entry in nova_client.server_groups.list():
            this_entry = entry.to_dict()

            # Add the name of the resource type.
            this_entry[cls.resource_type_name_key()] = cls.unique_class_id()

            result.append(this_entry)

        return result

    @classmethod
    def integration(cls):
        """See the parent class' method's docstring."""

        return "nova"

    def label(self):
        """See the parent class' method's docstring."""

        return "server groups"


class Server(PolyResource):
    """An OpenStack Server."""

    @classmethod
    def clouddata(cls):
        """See the parent class' method's docstring.

        Because this is a topological leaf node, the returned list contains one
        entry per availability_zone.

        """

        nova_client = get_nova_client()["client"]
        nova_client.client.authenticate()

        result = []
        seen_zones = set()

        for entry in nova_client.servers.list(search_opts={"all_tenants": 1}):
            zone = entry.to_dict()["OS-EXT-AZ:availability_zone"]

            if zone not in seen_zones:
                # We haven't seen this zone before.  Add it.
                seen_zones.add(zone)

                result.append({"name": "servers " + zone,
                               cls.native_id_key(): "servers " + zone,
                               "zone": zone,
                               cls.resource_type_name_key():
                               cls.unique_class_id()})

        return result

    @classmethod
    def type_outgoing_edges(cls):      # pylint: disable=R0201
        """Return the edges leaving this type."""

        return [{TO: Interface,
                 MATCHING_FN:
                 lambda f, t:
                 f.get("addresses") and t.get("mac_addr") and
                 t.get("mac_addr") in
                 [y["OS-EXT-IPS-MAC:mac_addr"]
                  for x in f.get("addresses").values() for y in x],
                 EDGE_ATTRIBUTES: {TYPE: OWNS, MIN: 0, MAX: sys.maxint}},
                {TO: Interface,
                 MATCHING_FN:
                 lambda f, t:
                 f.get("addresses") and t.get("mac_addr") and
                 t.get("mac_addr") in
                 [y["OS-EXT-IPS-MAC:mac_addr"]
                  for x in f.get("addresses").values() for y in x],
                 EDGE_ATTRIBUTES:
                 {TYPE: TOPOLOGICALLY_OWNS, MIN: 0, MAX: sys.maxint}},
                {TO: ServerGroup,
                 MATCHING_FN:
                 lambda f, t:
                 f.get("hostId") and f.get("hostId") in t["members"],
                 EDGE_ATTRIBUTES: {TYPE: MEMBER_OF, MIN: 0, MAX: sys.maxint}},
                {TO: Volume,
                 MATCHING_FN:
                 lambda f, t:
                 f.get("links") and t.get("links") and
                 any(volentry.get("href") and
                     volentry["href"] in [x["href"] for x in f["links"]]
                     for volentry in t["links"]),
                 EDGE_ATTRIBUTES:
                 {TYPE: ATTACHED_TO, MIN: 0, MAX: sys.maxint}},
                ]

    @classmethod
    def resource_list_url(cls):
        """See the parent class' method's docstring."""

        return reverse("nova-servers") + "/?region={region}&zone={zone}"

    @classmethod
    def integration(cls):
        """See the parent class' method's docstring."""

        return "nova"

    def label(self):
        """See the parent class' method's docstring."""

        zone = self.cloud_attributes.get("zone")    # pylint: disable=E1101
        return "%s servers" % zone if zone else "servers"


class Interface(PolyResource):
    """An OpenStack Interface.

    Note: We have no API endpoint for drilling down into interfaces yet.

    """

    @classmethod
    def clouddata(cls):
        """See the parent class' method's docstring."""

        nova_client = get_nova_client()["client"]
        nova_client.client.authenticate()

        # Each server has an interface list. Since we're interested in the
        # Interfaces themselves, we flatten the list, and de-dup it.
        raw = [x.to_dict()
               for y in
               nova_client.servers.list(search_opts={"all_tenants": 1})
               for x in y.interface_list()]

        mac_addresses = set()
        result = []

        for entry in raw:
            if entry["mac_addr"] not in mac_addresses:
                # We haven't seen this MAC address before. Give it a "None"
                # name, add its resource type, and add it to the result.
                entry[cls.resource_name_key()] = "None"
                entry[cls.resource_type_name_key()] = cls.unique_class_id()

                result.append(entry)

                # Remember we've seen this MAC address.
                mac_addresses.add(entry["mac_addr"])

        return result

    @classmethod
    def native_id_key(cls):
        """See the parent class' method's docstring."""

        return "mac_addr"

    @classmethod
    def type_outgoing_edges(cls):      # pylint: disable=R0201
        """Return the edges leaving this type."""

        return [{TO: Port,
                 MATCHING_FN:
                 lambda f, t: f.get("mac_addr") and
                 f.get("mac_addr") == t["mac_address"],
                 EDGE_ATTRIBUTES: {TYPE: ATTACHED_TO, MIN: 0, MAX: 1}},
                ]

    @classmethod
    def integration(cls):
        """See the parent class' method's docstring."""

        return "nova"

    def label(self):
        """See the parent class' method's docstring."""

        return "interfaces"


class NovaLimits(PolyResource):
    """An OpenStack Limits within a Nova integration."""

    @classmethod
    def clouddata(cls):
        """See the parent class' method's docstring."""

        nova_client = get_nova_client()["client"]
        nova_client.client.authenticate()

        result = []

        for entry in nova_client.limits.list():
            this_entry = entry.to_dict()

            # This has no name, and add the name of the resource type.
            this_entry[cls.resource_name_key()] = "None"
            this_entry[cls.resource_type_name_key()] = cls.unique_class_id()

            result.append(this_entry)

        return result

    @classmethod
    def integration(cls):
        """See the parent class' method's docstring."""

        return "nova"

    def label(self):
        """See the parent class' method's docstring."""

        return "limits"


#################################################
# These classes represent a Glance integration. #
#################################################

class Glance(PolyResource):
    """An OpenStack integration.

    This is a "virtual node". It exists to enhance the readability of the
    topology graph in the Goldstone client.

    """

    @classmethod
    def clouddata(cls):
        """See the parent class' method's docstring.

        Since this is a virtual node, the persistent resource graph objects are
        the, "nodes in the cloud."

        """

        return [x.cloud_attributes for x in Glance.objects.all()]

    @classmethod
    def type_outgoing_edges(cls):      # pylint: disable=R0201
        """Return the edges leaving this type."""

        return [{TO: Image,
                 MATCHING_FN: lambda f, t: True,
                 EDGE_ATTRIBUTES:
                 {TYPE: TOPOLOGICALLY_OWNS, MIN: 0, MAX: sys.maxint}},
                ]

    @classmethod
    def integration(cls):
        """See the parent class' method's docstring."""

        return "glance"

    def label(self):
        """See the parent class' method's docstring."""

        return "glance"


class Image(PolyResource):
    """An OpenStack Image."""

    @classmethod
    def clouddata(cls):
        """See the parent class' method's docstring.

        Because this is a topological leaf node, the returned list contains one
        entry.

        """

        glance_client = get_glance_client()["client"]

        if glance_client.images.list():
            return [{"name": "images",
                     cls.native_id_key(): "images",
                     cls.resource_type_name_key(): cls.unique_class_id()}]
        else:
            return []

    @classmethod
    def type_outgoing_edges(cls):      # pylint: disable=R0201
        """Return the edges leaving this type."""

        return [{TO: Server,
                 MATCHING_FN:
                 lambda f, t: f.get("id") and f.get("id") == t.get("id"),
                 EDGE_ATTRIBUTES: {TYPE: DEFINES, MIN: 0, MAX: sys.maxint}},
                ]

    @classmethod
    def resource_list_url(cls):
        """See the parent class' method's docstring."""

        return reverse("glance-images") + "/?region={region}"

    @classmethod
    def integration(cls):
        """See the parent class' method's docstring."""

        return "glance"

    def label(self):
        """See the parent class' method's docstring."""

        return "images"


#################################################
# These classes represent a Cinder integration. #
#################################################

class Cinder(PolyResource):
    """An OpenStack integration.

    This is a "virtual node". It exists to enhance the readability of the
    topology graph in the Goldstone client.

    """

    @classmethod
    def clouddata(cls):
        """See the parent class' method's docstring.

        Since this is a virtual node, the persistent resource graph objects are
        the, "nodes in the cloud."

        """

        return [x.cloud_attributes for x in Cinder.objects.all()]

    @classmethod
    def type_outgoing_edges(cls):      # pylint: disable=R0201
        """Return the edges leaving this type."""

        return [{TO: VolumeType,
                 MATCHING_FN: lambda f, t: True,
                 EDGE_ATTRIBUTES:
                 {TYPE: TOPOLOGICALLY_OWNS, MIN: 0, MAX: sys.maxint}},
                {TO: Snapshot,
                 MATCHING_FN: lambda f, t: True,
                 EDGE_ATTRIBUTES:
                 {TYPE: TOPOLOGICALLY_OWNS, MIN: 0, MAX: sys.maxint}},
                {TO: Transfer,
                 MATCHING_FN: lambda f, t: True,
                 EDGE_ATTRIBUTES:
                 {TYPE: TOPOLOGICALLY_OWNS, MIN: 0, MAX: sys.maxint}},
                {TO: Service,
                 MATCHING_FN: lambda f, t: "cinder" in t.get("name", ''),
                 EDGE_ATTRIBUTES:
                 {TYPE: TOPOLOGICALLY_OWNS, MIN: 0, MAX: sys.maxint}},
                ]

    @classmethod
    def integration(cls):
        """See the parent class' method's docstring."""

        return "cinder"

    def label(self):
        """See the parent class' method's docstring."""

        return "cinder"


class QuotaSet(PolyResource):
    """An OpenStack Quota Set."""

    @classmethod
    def native_id_key(cls):
        """See the parent class' method's docstring."""

        return "unique_cloud_id"

    @classmethod
    def integration(cls):
        """See the parent class' method's docstring."""

        return "cinder"

    def label(self):
        """See the parent class' method's docstring."""

        return "quota sets"


class QOSSpec(PolyResource):
    """An OpenStack Quality Of Service Specification."""

    @classmethod
    def clouddata(cls):
        """See the parent class' method's docstring."""

        result = []

        for entry in get_cinder_client()["client"].qos_specs.list():
            # Make a dict for this entry.
            this_entry = entry.to_dict()

            # Add the name of the resource type.
            this_entry[cls.resource_type_name_key()] = cls.unique_class_id()

            result.append(this_entry)

        return result

    @classmethod
    def type_outgoing_edges(cls):      # pylint: disable=R0201
        """Return the edges leaving this type."""

        return [{TO: VolumeType,
                 MATCHING_FN:
                 lambda f, t:
                 f.get("id") and
                 f.get("id") in t.get("extra_specs", {}).get("qos", ''),
                 EDGE_ATTRIBUTES: {TYPE: APPLIES_TO, MIN: 0, MAX: sys.maxint}},
                ]

    @classmethod
    def integration(cls):
        """See the parent class' method's docstring."""

        return "cinder"

    def label(self):
        """See the parent class' method's docstring."""

        return "qos specs"


class Snapshot(PolyResource):
    """An OpenStack Snapshot."""

    @classmethod
    def clouddata(cls):
        """See the parent class' method's docstring."""

        result = []

        for entry in get_cinder_client()["client"].volume_snapshots.list():
            # Make a dict for this entry.
            this_entry = entry.to_dict()

            # Add the name of the resource type.
            this_entry[cls.resource_type_name_key()] = cls.unique_class_id()

            result.append(this_entry)

        return result

    @classmethod
    def type_outgoing_edges(cls):      # pylint: disable=R0201
        """Return the edges leaving this type."""

        return [{TO: Volume,
                 MATCHING_FN:
                 lambda f, t:
                 f.get("id") and f.get("id") == t.get("snapshot_id"),
                 EDGE_ATTRIBUTES: {TYPE: APPLIES_TO, MIN: 1, MAX: 1}},
                ]

    @classmethod
    def resource_list_url(cls):
        """See the parent class' method's docstring."""

        return reverse("cinder-snapshots") + "/?region={region}"

    @classmethod
    def integration(cls):
        """See the parent class' method's docstring."""

        return "cinder"

    def label(self):
        """See the parent class' method's docstring."""

        return "snapshots"


class Transfer(PolyResource):
    """An OpenStack Transfer."""

    @classmethod
    def clouddata(cls):
        """See the parent class' method's docstring."""

        result = []

        for entry in get_cinder_client()["client"].transfers.list():
            # Make a dict for this entry.
            this_entry = entry.to_dict()

            # Add the name of the resource type.
            this_entry[cls.resource_type_name_key()] = cls.unique_class_id()

            result.append(this_entry)

        return result

    @classmethod
    def resource_list_url(cls):
        """See the parent class' method's docstring."""

        return reverse("cinder-transfers") + "/?region={region}"

    @classmethod
    def integration(cls):
        """See the parent class' method's docstring."""

        return "cinder"

    def label(self):
        """See the parent class' method's docstring."""

        return "transfers"


class VolumeType(PolyResource):
    """An OpenStack Volume Type."""

    @classmethod
    def clouddata(cls):
        """See the parent class' method's docstring."""

        result = []

        # N.B.: Unlike most OpenStack client calls, this returns the relevant
        # data in the _info attribute.  Sigh.
        for entry in get_cinder_client()["client"].volume_types.list():
            # Add the name of the resource type.
            this_entry = entry._info              # pylint: disable=W0212
            this_entry[cls.resource_type_name_key()] = cls.unique_class_id()

            result.append(this_entry)

        return result

    @classmethod
    def type_outgoing_edges(cls):      # pylint: disable=R0201
        """Return the edges leaving this type."""

        return [{TO: Volume,
                 MATCHING_FN:
                 lambda f, t: f.get("id") and f["id"] == t.get("volume_type"),
                 EDGE_ATTRIBUTES: {TYPE: APPLIES_TO, MIN: 0, MAX: sys.maxint}},
                {TO: Volume,
                 MATCHING_FN:
                 lambda f, t: f.get("id") and f["id"] == t.get("volume_type"),
                 EDGE_ATTRIBUTES:
                 {TYPE: TOPOLOGICALLY_OWNS, MIN: 0, MAX: sys.maxint}},
                ]

    @classmethod
    def resource_list_url(cls):
        """See the parent class' method's docstring."""

        return reverse("cinder-volume-types") + "/?region={region}"

    @classmethod
    def integration(cls):
        """See the parent class' method's docstring."""

        return "cinder"

    def label(self):
        """See the parent class' method's docstring."""

        return "volume types"


class Volume(PolyResource):
    """An OpenStack Volume."""

    @classmethod
    def clouddata(cls):
        """See the parent class' method's docstring."""

        result = []

        for entry in get_cinder_client()["client"].volumes.list():
            # Make a dict for this entry.
            this_entry = entry.to_dict()

            # Add the name of the resource type.
            this_entry[cls.resource_type_name_key()] = cls.unique_class_id()

            result.append(this_entry)

        return result

    @classmethod
    def resource_list_url(cls):
        """See the parent class' method's docstring."""

        return reverse("cinder-volumes") + "/?region={region}"

    @classmethod
    def integration(cls):
        """See the parent class' method's docstring."""

        return "cinder"

    def label(self):
        """See the parent class' method's docstring."""

        return "volumes"


class Limits(PolyResource):
    """An OpenStack Limit."""

    @classmethod
    def clouddata(cls):
        """See the parent class' method's docstring."""

        result = []

        for entry in get_glance_client()["client"].images.list():
            # Make a dict for this entry.
            this_entry = entry.to_dict()

            # Add the name of the resource type.
            this_entry[cls.resource_name_key()] = "None"
            this_entry[cls.resource_type_name_key()] = cls.unique_class_id()

            result.append(this_entry)

        return result

    @classmethod
    def integration(cls):
        """See the parent class' method's docstring."""

        return "cinder"

    def label(self):
        """See the parent class' method's docstring."""

        return "limits"


##################################################
# These classes represent a Neutron integration. #
##################################################

class Neutron(PolyResource):
    """An OpenStack integration.

    This is a "virtual node". It exists to enhance the readability of the
    topology graph in the Goldstone client.

    """

    @classmethod
    def clouddata(cls):
        """See the parent class' method's docstring.

        Since this is a virtual node, the persistent resource graph objects are
        the, "nodes in the cloud."

        """

        return [x.cloud_attributes for x in Neutron.objects.all()]

   # @classmethod
   #  def type_outgoing_edges(cls):      # pylint: disable=R0201
   #      """Return the edges leaving this type."""

   #      return [{TO: Endpoint,
   #               MATCHING_FN: lambda f, t: True,
   #               EDGE_ATTRIBUTES:
   #               {TYPE: TOPOLOGICALLY_OWNS, MIN: 0, MAX: sys.maxint}},
   #              {TO: Role,
   #               MATCHING_FN: lambda f, t: True,
   #               EDGE_ATTRIBUTES:
   #               {TYPE: TOPOLOGICALLY_OWNS, MIN: 0, MAX: sys.maxint}},
   #              ]

    @classmethod
    def integration(cls):
        """See the parent class' method's docstring."""

        return "neutron"

    def label(self):
        """See the parent class' method's docstring."""

        return "neutron"


class MeteringLabelRule(PolyResource):
    """An OpenStack Metering Label Rule."""

    @classmethod
    def integration(cls):
        """See the parent class' method's docstring."""

        return "neutron"

    def label(self):
        """See the parent class' method's docstring."""

        return "metering label rules"


class MeteringLabel(PolyResource):
    """An OpenStack Metering Label."""

    @classmethod
    def type_outgoing_edges(cls):      # pylint: disable=R0201
        """Return the edges leaving this type."""

        return [{TO: MeteringLabel,
                 EDGE_ATTRIBUTES: {TYPE: APPLIES_TO, MIN: 1, MAX: 1}},
                ]

    @classmethod
    def integration(cls):
        """See the parent class' method's docstring."""

        return "neutron"

    def label(self):
        """See the parent class' method's docstring."""

        return "metering labels"


class NeutronQuota(PolyResource):
    """An OpenStack Neutron Quota."""

    @classmethod
    def integration(cls):
        """See the parent class' method's docstring."""

        return "neutron"

    def label(self):
        """See the parent class' method's docstring."""

        return "quotas"


class RemoteGroup(PolyResource):
    """An OpenStack Remote Group."""

    @classmethod
    def integration(cls):
        """See the parent class' method's docstring."""

        return "neutron"

    def label(self):
        """See the parent class' method's docstring."""

        return "remote groups"


class SecurityRules(PolyResource):
    """An OpenStack Security Rules."""

    @classmethod
    def type_outgoing_edges(cls):      # pylint: disable=R0201
        """Return the edges leaving this type."""

        return [{TO: RemoteGroup,
                 EDGE_ATTRIBUTES: {TYPE: APPLIES_TO, MIN: 0, MAX: 1}},
                {TO: SecurityGroup,
                 EDGE_ATTRIBUTES: {TYPE: MEMBER_OF, MIN: 1, MAX: 1}},
                ]

    @classmethod
    def integration(cls):
        """See the parent class' method's docstring."""

        return "neutron"

    def label(self):
        """See the parent class' method's docstring."""

        return "security rules"


class SecurityGroup(PolyResource):
    """An OpenStack Security Group."""

    @classmethod
    def integration(cls):
        """See the parent class' method's docstring."""

        return "neutron"

    def label(self):
        """See the parent class' method's docstring."""

        return "security groups"


class Port(PolyResource):
    """An OpenStack Port."""

    @classmethod
    def clouddata(cls):
        """See the parent class' method's docstring."""
        from goldstone.neutron.utils import get_neutron_client

        # Get the one and only one Cloud row in the system
        row = get_cloud()

        client = get_neutron_client(row.username,
                                    row.password,
                                    row.tenant_name,
                                    row.auth_url)

        result = []

        for entry in client.list_ports()["ports"]:
            # Make a dict for this entry.
            this_entry = entry.to_dict()

            # Add the name of the resource type.
            this_entry[cls.resource_type_name_key()] = cls.unique_class_id()

            result.append(this_entry)

        return result

    @classmethod
    def type_outgoing_edges(cls):      # pylint: disable=R0201
        """Return the edges leaving this type."""

        return [{TO: FixedIP,
                 EDGE_ATTRIBUTES: {TYPE: CONSUMES, MIN: 0, MAX: sys.maxint}},
                {TO: FloatingIP,
                 EDGE_ATTRIBUTES: {TYPE: CONSUMES, MIN: 0, MAX: sys.maxint}},
                {TO: SecurityGroup,
                 EDGE_ATTRIBUTES: {TYPE: MEMBER_OF, MIN: 0, MAX: sys.maxint}},
                ]

    @classmethod
    def integration(cls):
        """See the parent class' method's docstring."""

        return "neutron"

    def label(self):
        """See the parent class' method's docstring."""

        return "ports"


class LBVIP(PolyResource):
    """An OpenStack load balancer VIP address."""

    @classmethod
    def type_outgoing_edges(cls):      # pylint: disable=R0201
        """Return the edges leaving this type."""

        return [{TO: LBPool,
                 EDGE_ATTRIBUTES: {TYPE: MEMBER_OF, MIN: 0, MAX: 1}},
                {TO: Port,
                 EDGE_ATTRIBUTES: {TYPE: ATTACHED_TO, MIN: 0, MAX: 1}},
                {TO: Subnet,
                 EDGE_ATTRIBUTES: {TYPE: ALLOCATED_TO, MIN: 0, MAX: 1}},
                ]

    @classmethod
    def integration(cls):
        """See the parent class' method's docstring."""

        return "neutron"

    def label(self):
        """See the parent class' method's docstring."""

        return "lb virtual ips"


class LBPool(PolyResource):
    """An OpenStack load balancer pool."""

    @classmethod
    def integration(cls):
        """See the parent class' method's docstring."""

        return "neutron"

    def label(self):
        """See the parent class' method's docstring."""

        return "lb pools"


class HealthMonitor(PolyResource):
    """An OpenStack Health Monitor."""

    @classmethod
    def type_outgoing_edges(cls):      # pylint: disable=R0201
        """Return the edges leaving this type."""

        return [{TO: LBPool,
                 EDGE_ATTRIBUTES: {TYPE: APPLIES_TO, MIN: 0, MAX: sys.maxint}},
                ]

    @classmethod
    def integration(cls):
        """See the parent class' method's docstring."""

        return "neutron"

    def label(self):
        """See the parent class' method's docstring."""

        return "health monitors"


class FloatingIP(PolyResource):
    """An OpenStack Floating IP address."""

    @classmethod
    def integration(cls):
        """See the parent class' method's docstring."""

        return "neutron"

    def label(self):
        """See the parent class' method's docstring."""

        return "floating ip addresses"


class FloatingIPPool(PolyResource):
    """An OpenStack Floating IP address pool."""

    @classmethod
    def type_outgoing_edges(cls):      # pylint: disable=R0201
        """Return the edges leaving this type."""

        return [{TO: FixedIP,
                 EDGE_ATTRIBUTES: {TYPE: ROUTES_TO, MIN: 0, MAX: sys.maxint}},
                {TO: FixedIP,
                 EDGE_ATTRIBUTES:
                 {TYPE: TOPOLOGICALLY_OWNS, MIN: 0, MAX: sys.maxint}},
                {TO: FloatingIP,
                 EDGE_ATTRIBUTES: {TYPE: OWNS, MIN: 0, MAX: sys.maxint}},
                {TO: FloatingIP,
                 EDGE_ATTRIBUTES:
                 {TYPE: TOPOLOGICALLY_OWNS, MIN: 0, MAX: sys.maxint}},
                ]

    @classmethod
    def integration(cls):
        """See the parent class' method's docstring."""

        return "neutron"

    def label(self):
        """See the parent class' method's docstring."""

        return "floating ip pools"


class FixedIP(PolyResource):
    """An OpenStack Fixed IP address."""

    @classmethod
    def integration(cls):
        """See the parent class' method's docstring."""

        return "neutron"

    def label(self):
        """See the parent class' method's docstring."""

        return "fixed ip addresses"


class LBMember(PolyResource):
    """An OpenStack load balancer member."""

    @classmethod
    def type_outgoing_edges(cls):      # pylint: disable=R0201
        """Return the edges leaving this type."""

        return [{TO: LBPool,
                 EDGE_ATTRIBUTES: {TYPE: MEMBER_OF, MIN: 0, MAX: sys.maxint}},
                {TO: Subnet,
                 EDGE_ATTRIBUTES: {TYPE: ATTACHED_TO, MIN: 0, MAX: 1}},
                ]

    @classmethod
    def integration(cls):
        """See the parent class' method's docstring."""

        return "neutron"

    def label(self):
        """See the parent class' method's docstring."""

        return "lb members"


class Subnet(PolyResource):
    """An OpenStack subnet."""

    @classmethod
    def type_outgoing_edges(cls):      # pylint: disable=R0201
        """Return the edges leaving this type."""

        return [{TO: FixedIP,
                 EDGE_ATTRIBUTES: {TYPE: OWNS, MIN: 0, MAX: sys.maxint}},
                {TO: Network,
                 EDGE_ATTRIBUTES: {TYPE: MEMBER_OF, MIN: 1, MAX: 1}},
                ]

    @classmethod
    def integration(cls):
        """See the parent class' method's docstring."""

        return "neutron"

    def label(self):
        """See the parent class' method's docstring."""

        return "subnets"


class Network(PolyResource):
    """An OpenStack network."""

    @classmethod
    def integration(cls):
        """See the parent class' method's docstring."""

        return "neutron"

    def label(self):
        """See the parent class' method's docstring."""

        return "networks"


class Router(PolyResource):
    """An OpenStack router."""

    @classmethod
    def type_outgoing_edges(cls):      # pylint: disable=R0201
        """Return the edges leaving this type."""

        return [{TO: Network,
                 EDGE_ATTRIBUTES: {TYPE: ATTACHED_TO, MIN: 0, MAX: 1}},
                {TO: Port,
                 EDGE_ATTRIBUTES:
                 {TYPE: ATTACHED_TO, MIN: 0, MAX: sys.maxint}},
                ]

    @classmethod
    def integration(cls):
        """See the parent class' method's docstring."""

        return "neutron"

    def label(self):
        """See the parent class' method's docstring."""

        return "routers"
