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
from django.db.models import CharField, IntegerField
from django_extensions.db.fields import UUIDField, CreationDateTimeField, \
    ModificationDateTimeField
from elasticsearch_dsl import A
from elasticsearch_dsl.query import Q, QueryString
from polymorphic import PolymorphicModel
from goldstone.drfes.models import DailyIndexDocType
from goldstone.glogging.models import LogData, LogEvent

# Get_glance_client is defined here for easy unit test mocking.
from goldstone.utils import utc_now, get_glance_client, get_nova_client, \
    get_cinder_client, get_cloud

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
        return A('extended_stats', field='value')

    @classmethod
    def units_agg(cls):
        return A('terms', field='unit')


class ReportData(DailyIndexDocType):

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

    created = CreationDateTimeField(editable=False,
                                    blank=True,
                                    default=utc_now)
    updated = ModificationDateTimeField(editable=True, blank=True)

    @classmethod
    def unique_class_id(cls):
        """Return this class' (not object!) unique id."""

        return str(cls)

    @classmethod
    def outgoing_edges(cls):      # pylint: disable=R0201
        """Return the edges leaving this type."""

        return []

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

    def clouddata(self):          # pylint: disable=R0201
        """Return information about all the objects of this type within the
        OpenStack cloud.

        :return: Attributes about each instance of this type, including unique
                 identifying ids. (The unique ids are unique only within the
                 cloud, and aren't guaranteed to be unique across Goldstone. If
                 OpenStack defines a unique id for this resource type, we'll
                 use it. Otherwise, we'll generate unique hashes from other
                 values.)

        :rtype: list of dict

        """

        return []

    @property
    def unique_id_key(self):      # pylint: disable=R0201
        """Return the key to use within a clouddata() entry to retrieve the
        unique id of an object within the OpenStack cloud.

        Clouddata() returns a list of dicts. Each dict represents an instance
        within the cloud, and contains a unique cloud id. If OpenStack defines
        the unique id, then it's given it a name (i.e., key) within the
        instances' attributes. Otherwise, we create the unique cloud id and use
        our own key for it.

        Semantically, this is a class property, but Python doesn't have class
        properties, so it's an instance property.

        """

        return "unique_cloud_id"


#
# These classes represent entities within a Keystone integration.
#

class User(PolyResource):
    """An OpenStack user."""

    # TODO: Fill in.

    @classmethod
    def display_attributes(cls):
        """See the parent class' method's docstring."""

        return {"integration_name": "Keystone", "name": "User"}

    @classmethod
    def outgoing_edges(cls):      # pylint: disable=R0201
        """Return the edges leaving this type."""

        return [{TO: Credential,
                 EDGE_ATTRIBUTES: {TYPE: CONTAINS, MIN: 0, MAX: sys.maxint}},
                {TO: Group,
                 EDGE_ATTRIBUTES: {TYPE: ASSIGNED_TO,
                                   MIN: 0,
                                   MAX: sys.maxint}},
                {TO: Project,
                 EDGE_ATTRIBUTES: {TYPE: ASSIGNED_TO, MIN: 0, MAX: 1}},
                {TO: QuotaSet,
                 EDGE_ATTRIBUTES:
                 {TYPE: SUBSCRIBED_TO,
                  MIN: 0,
                  MAX: sys.maxint}},
                ]


class Domain(PolyResource):
    """An OpenStack domain."""

    # TODO: Fill in.

    @classmethod
    def display_attributes(cls):
        """See the parent class' method's docstring."""

        return {"integration_name": "Keystone", "name": "Domain"}

    @classmethod
    def outgoing_edges(cls):      # pylint: disable=R0201
        """Return the edges leaving this type."""

        return [{TO: Group,
                 EDGE_ATTRIBUTES: {TYPE: CONTAINS, MIN: 0, MAX: sys.maxint}},
                {TO: Project,
                 EDGE_ATTRIBUTES: {TYPE: CONTAINS, MIN: 0, MAX: sys.maxint}},
                {TO: User,
                 EDGE_ATTRIBUTES: {TYPE: CONTAINS, MIN: 0, MAX: sys.maxint}},
                ]


class Group(PolyResource):
    """An OpenStack group."""

    # TODO: Fill in.

    @classmethod
    def display_attributes(cls):
        """See the parent class' method's docstring."""

        return {"integration_name": "Keystone", "name": "Group"}


class Token(PolyResource):
    """An OpenStack token."""

    # TODO: Fill in.

    @classmethod
    def display_attributes(cls):
        """See the parent class' method's docstring."""

        return {"integration_name": "Keystone", "name": "Token"}

    @classmethod
    def outgoing_edges(cls):      # pylint: disable=R0201
        """Return the edges leaving this type."""

        return [{TO: User,
                 EDGE_ATTRIBUTES: {TYPE: ASSIGNED_TO,
                                   MIN: 0,
                                   MAX: sys.maxint}},
                ]


class Credential(PolyResource):
    """An OpenStack credential."""

    # TODO: Fill in.

    @classmethod
    def display_attributes(cls):
        """See the parent class' method's docstring."""

        return {"integration_name": "Keystone", "name": "Credential"}

    @classmethod
    def outgoing_edges(cls):      # pylint: disable=R0201
        """Return the edges leaving this type."""

        return [{TO: Project,
                 EDGE_ATTRIBUTES: {TYPE: ASSIGNED_TO, MIN: 1, MAX: 1}},
                ]


class Role(PolyResource):
    """An OpenStack role."""

    # TODO: Fill in.

    @classmethod
    def display_attributes(cls):
        """See the parent class' method's docstring."""

        return {"integration_name": "Keystone", "name": "Role"}

    @classmethod
    def outgoing_edges(cls):      # pylint: disable=R0201
        """Return the edges leaving this type."""

        return [{TO: Domain,
                 EDGE_ATTRIBUTES: {TYPE: APPLIES_TO, MIN: 0, MAX: sys.maxint}},
                {TO: Group,
                 EDGE_ATTRIBUTES: {TYPE: ASSIGNED_TO,
                                   MIN: 0,
                                   MAX: sys.maxint}},
                {TO: Project,
                 EDGE_ATTRIBUTES: {TYPE: APPLIES_TO, MIN: 0, MAX: sys.maxint}},
                {TO: User,
                 EDGE_ATTRIBUTES: {TYPE: ASSIGNED_TO,
                                   MIN: 0,
                                   MAX: sys.maxint}},
                ]


class Region(PolyResource):
    """An OpenStack region."""

    # TODO: Fill in.

    @classmethod
    def display_attributes(cls):
        """See the parent class' method's docstring."""

        return {"integration_name": "Keystone", "name": "Region"}

    @classmethod
    def outgoing_edges(cls):      # pylint: disable=R0201
        """Return the edges leaving this type."""

        return [{TO: AvailabilityZone,
                 EDGE_ATTRIBUTES: {TYPE: OWNS, MIN: 1, MAX: sys.maxint}},
                {TO: Endpoint,
                 EDGE_ATTRIBUTES: {TYPE: CONTAINS, MIN: 0, MAX: sys.maxint}},
                ]


class Endpoint(PolyResource):
    """An OpenStack endpoint."""

    # TODO: Fill in.

    @classmethod
    def display_attributes(cls):
        """See the parent class' method's docstring."""

        return {"integration_name": "Keystone", "name": "Endpoint"}

    @classmethod
    def outgoing_edges(cls):      # pylint: disable=R0201
        """Return the edges leaving this type."""

        return [{TO: Service,
                 EDGE_ATTRIBUTES: {TYPE: ASSIGNED_TO, MIN: 1, MAX: 1}},
                ]


class Service(PolyResource):
    """An OpenStack service."""

    # TODO: Fill in.

    @classmethod
    def display_attributes(cls):
        """See the parent class' method's docstring."""

        return {"integration_name": "Keystone", "name": "Service"}


class Project(PolyResource):
    """An OpenStack project."""

    # TODO: Fill in.

    @classmethod
    def display_attributes(cls):
        """See the parent class' method's docstring."""

        return {"integration_name": "Keystone", "name": "Project"}

    @classmethod
    def outgoing_edges(cls):      # pylint: disable=R0201
        """Return the edges leaving this type."""

        return [{TO: Image,
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
                ]


#
# These classes represent entities within a Nova integration.
#

class AvailabilityZone(PolyResource):
    """An OpenStack Availability Zone."""

    def clouddata(self):
        """See the parent class' method's docstring."""

        nova_client = get_nova_client()["client"]
        nova_client.client.authenticate()

        return [x.to_dict() for x in nova_client.availability_zones.list()]

    @classmethod
    def display_attributes(cls):
        """See the parent class' method's docstring."""

        return {"integration_name": "Nova", "name": "Availability Zone"}

    @classmethod
    def outgoing_edges(cls):      # pylint: disable=R0201
        """Return the edges leaving this type."""

        return [
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
              f.get("zoneName") and f.get("zoneName") == t.get("zone")}},
            ]

    @property
    def unique_id_key(self):
        """See the parent class' method's docstring."""

        return "zoneName"


class Aggregate(PolyResource):
    """An OpenStack Aggregate."""

    def clouddata(self):
        """See the parent class' method's docstring."""

        nova_client = get_nova_client()["client"]
        nova_client.client.authenticate()

        result = []

        # For every Aggregate in the cloud...
        for entry in nova_client.aggregates.list():
            # Make a dict from this entry's data, and concoct a unique id for
            # it.
            this_entry = entry.to_dict()
            this_entry[self.unique_id_key] = _hash(self.unique_class_id(),
                                                   this_entry.get("id", ''))
            result.append(this_entry)

        return result

    @classmethod
    def display_attributes(cls):
        """Return a dict of cloud information about this type, suitable for
        client display."""

        return {"integration_name": "Nova", "name": "Aggregate"}


class Flavor(PolyResource):
    """An OpenStack Flavor."""

    def clouddata(self):
        """See the parent class' method's docstring."""

        nova_client = get_nova_client()["client"]
        nova_client.client.authenticate()

        result = []

        # For every Flavor in the cloud...
        for entry in nova_client.flavors.list():
            # Make a dict from this entry's data, and concoct a unique id for
            # it.
            this_entry = entry.to_dict()
            this_entry[self.unique_id_key] = _hash(self.unique_class_id(),
                                                   this_entry.get("id", ''))
            result.append(this_entry)

        return result

    @classmethod
    def display_attributes(cls):
        """Return a dict of cloud information about this type, suitable for
        client display."""

        return {"integration_name": "Nova", "name": "Flavor"}

    @classmethod
    def outgoing_edges(cls):      # pylint: disable=R0201
        """Return the edges leaving this type."""

        return [
            {TO: Server,
             EDGE_ATTRIBUTES:
             {TYPE: DEFINES,
              MIN: 0,
              MAX: sys.maxint,
              MATCHING_FN:
              lambda f, t:
              f.get("id") and f.get("id") == t.get("flavor", {}).get("id")}},
            ]


class Keypair(PolyResource):
    """An OpenStack Keypair."""

    def clouddata(self):
        """See the parent class' method's docstring."""

        nova_client = get_nova_client()["client"]
        nova_client.client.authenticate()

        return [x.to_dict()["keypair"] for x in nova_client.keypairs.list()]

    @classmethod
    def display_attributes(cls):
        """Return a dict of cloud information about this type, suitable for
        client display."""

        return {"integration_name": "Nova", "name": "Keypair"}

    @classmethod
    def outgoing_edges(cls):      # pylint: disable=R0201
        """Return the edges leaving this type."""

        return [{TO: Server,
                 EDGE_ATTRIBUTES: {TYPE: ATTACHED_TO,
                                   MIN: 0,
                                   MAX: sys.maxint,
                                   # Any keypair can be used on any server.
                                   MATCHING_FN:
                                   lambda f, t:
                                   f.get("fingerprint") is not None and
                                   t is not None}},
                ]

    @property
    def unique_id_key(self):
        """See the parent class' method's docstring."""

        return "fingerprint"


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

    def clouddata(self):
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
                host[self.unique_id_key] = _hash(get_cloud().tenant_name,
                                                 parsed_name)

                # We don't want or need this key.
                del host["service"]

                result.append(host)

        return result

    @classmethod
    def display_attributes(cls):
        """Return a dict of cloud information about this type, suitable for
        client display."""

        return {"integration_name": "Nova", "name": "Host"}

    @classmethod
    def outgoing_edges(cls):      # pylint: disable=R0201
        """Return the edges leaving this type."""

        return [
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
              f.get("host_name") == t.get("hypervisor_hostname")}},
            ]


class Hypervisor(PolyResource):
    """An OpenStack Hypervisor."""

    virt_cpus = IntegerField(editable=True, blank=True, default=8)
    memory = IntegerField(editable=True, blank=True, default=8192)

    def clouddata(self):
        """See the parent class' method's docstring."""

        nova_client = get_nova_client()["client"]
        nova_client.client.authenticate()

        result = []

        # For every Hypervisor in the cloud...
        for entry in nova_client.hypervisors.list():
            # Make a dict from this entry's data, and concoct a unique id for
            # it.
            this_entry = entry.to_dict()
            this_entry[self.unique_id_key] = _hash(self.unique_class_id(),
                                                   this_entry.get("id", ''))
            result.append(this_entry)

        return result

    @classmethod
    def display_attributes(cls):
        """Return a dict of cloud information about this type, suitable for
        client display."""

        return {"integration_name": "Nova", "name": "Hypervisor"}

    @classmethod
    def outgoing_edges(cls):      # pylint: disable=R0201
        """Return the edges leaving this type."""

        return [{TO: Server,
                 EDGE_ATTRIBUTES:
                 {TYPE: OWNS,
                  MIN: 0,
                  MAX: sys.maxint,
                  MATCHING_FN:
                  lambda f, t:
                  f.get("id") and
                  f.get("id") ==
                  t.get("OS-EXT-SRV-ATTR:hypervisor_hostname")}},
                ]


class Cloudpipe(PolyResource):
    """An OpenStack Cloudpipe."""

    def clouddata(self):
        """See the parent class' method's docstring."""

        nova_client = get_nova_client()["client"]
        nova_client.client.authenticate()

        return [x.to_dict() for x in nova_client.cloudpipe.list()]

    @classmethod
    def display_attributes(cls):
        """Return a dict of cloud information about this type, suitable for
        client display."""

        return {"integration_name": "Nova", "name": "Cloudpipe"}

    @classmethod
    def outgoing_edges(cls):      # pylint: disable=R0201
        """Return the edges leaving this type."""

        return [
            {TO: Server,
             EDGE_ATTRIBUTES:
             {TYPE: INSTANCE_OF,
              MIN: 1,
              MAX: 1,
              MATCHING_FN:
              lambda f, t: f.get("id") and f.get("id") == t.get("id")}},
            ]

    @property
    def unique_id_key(self):
        """See the parent class' method's docstring."""

        return "project_id"


class ServerGroup(PolyResource):
    """An OpenStack Server Group."""

    def clouddata(self):
        """See the parent class' method's docstring."""

        nova_client = get_nova_client()["client"]
        nova_client.client.authenticate()

        return [x.to_dict() for x in nova_client.server_groups.list()]

    @classmethod
    def display_attributes(cls):
        """Return a dict of cloud information about this type, suitable for
        client display."""

        return {"integration_name": "Nova", "name": "Server Group"}

    @property
    def unique_id_key(self):
        """See the parent class' method's docstring."""

        return "id"


class Server(PolyResource):
    """An OpenStack Server."""

    def clouddata(self):
        """See the parent class' method's docstring."""

        nova_client = get_nova_client()["client"]
        nova_client.client.authenticate()

        return [x.to_dict()
                for x in
                nova_client.servers.list(search_opts={"all_tenants": 1})]

    @classmethod
    def display_attributes(cls):
        """Return a dict of cloud information about this type, suitable for
        client display."""

        return {"integration_name": "Nova", "name": "Server"}

    @classmethod
    def outgoing_edges(cls):      # pylint: disable=R0201
        """Return the edges leaving this type."""

        return [{TO: Interface,
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
                {TO: Volume,
                 EDGE_ATTRIBUTES: {TYPE: ATTACHED_TO,
                                   MIN: 0,
                                   MAX: sys.maxint,
                                   MATCHING_FN: lambda f, t:
                                   f.get("links") and t.get("links") and
                                   any(volentry.get("href") and
                                       volentry["href"] in
                                       [x["href"] for x in f["links"]]
                                       for volentry in t["links"])}},
                ]

    @property
    def unique_id_key(self):
        """See the parent class' method's docstring."""

        return "id"


class Interface(PolyResource):
    """An OpenStack Interface."""

    def clouddata(self):
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

        for entry in result:
            # This entry is a duplicate of a previous entry if its MAC address
            # matches.
            if entry["mac_addr"] not in mac_addresses:
                result.append(entry)
                mac_addresses.add(entry["mac_addr"])

        return result

    @classmethod
    def display_attributes(cls):
        """Return a dict of cloud information about this type, suitable for
        client display."""

        return {"integration_name": "Nova", "name": "Interface"}

    @classmethod
    def outgoing_edges(cls):      # pylint: disable=R0201
        """Return the edges leaving this type."""

        return [{TO: Port,
                 EDGE_ATTRIBUTES:
                 {TYPE: ATTACHED_TO,
                  MIN: 0,
                  MAX: 1,
                  MATCHING_FN:
                  lambda f, t:
                  f.get("mac_addr") and
                  f.get("mac_addr") == t["mac_address"]}},
                ]

    @property
    def unique_id_key(self):
        """See the parent class' method's docstring."""

        return "mac_addr"


class NovaLimits(PolyResource):
    """An OpenStack Limits within a Nova integration."""

    @classmethod
    def clouddata(cls):
        """See the parent class' method's docstring."""

        # TODO: This needs to be rewritten.
        nova_client = get_nova_client()["client"]
        nova_client.client.authenticate()

        return [x.to_dict() for x in nova_client.limits.list()]

    @classmethod
    def display_attributes(cls):
        """Return a dict of cloud information about this type, suitable for
        client display."""

        return {"integration_name": "Nova", "name": "Limits"}


#
# These classes represent entities within a Glance integration.
#

class Image(PolyResource):
    """An OpenStack Image."""

    def clouddata(self):
        """See the parent class' method's docstring."""

        return list(get_glance_client()["client"].images.list())

    @classmethod
    def display_attributes(cls):
        """Return a dict of cloud information about this type, suitable for
        client display."""

        return {"integration_name": "Glance", "name": "Image"}

    @classmethod
    def outgoing_edges(cls):      # pylint: disable=R0201
        """Return the edges leaving this type."""

        return [{TO: Server,
                 EDGE_ATTRIBUTES:
                 {TYPE: DEFINES,
                  MIN: 0,
                  MAX: sys.maxint,
                  MATCHING_FN:
                  lambda f, t: f.get("id") and f.get("id") == t.get("id")}},
                ]

    @property
    def unique_id_key(self):
        """See the parent class' method's docstring."""

        return "id"


#
# These classes represent entities within a Cinder integration.
#

class QuotaSet(PolyResource):
    """An OpenStack Quota Set."""

    def clouddata(self):
        """See the parent class' method's docstring."""

        result = []

        for entry in get_glance_client()["client"].images.list():
            # Make a dict from this entry's data, and concoct a unique id for
            # it.
            this_entry = entry.to_dict()
            this_entry[self.unique_id_key] = _hash(self.unique_class_id(),
                                                   this_entry.get("id", ''))
            result.append(this_entry)

        return result

    @classmethod
    def display_attributes(cls):
        """Return a dict of cloud information about this type, suitable for
        client display."""

        return {"integration_name": "Cinder", "name": "Quota Set"}


class QOSSpec(PolyResource):
    """An OpenStack Quality Of Service Specification."""

    def clouddata(self):
        """See the parent class' method's docstring."""

        return list(get_cinder_client()["client"].qos_specs.list())

    @classmethod
    def display_attributes(cls):
        """Return a dict of cloud information about this type, suitable for
        client display."""

        return {"integration_name": "Cinder", "name": "QoS Spec"}

    @classmethod
    def outgoing_edges(cls):      # pylint: disable=R0201
        """Return the edges leaving this type."""

        return [{TO: VolumeType,
                 EDGE_ATTRIBUTES:
                 {TYPE: APPLIES_TO,
                  MIN: 0,
                  MAX: sys.maxint,
                  MATCHING_FN:
                  lambda f, t:
                  f.get("id") and
                  f.get("id") in
                  t.get("extra_specs", {}).get("qos", '')}},
                ]

    @property
    def unique_id_key(self):
        """See the parent class' method's docstring."""

        return "id"


class Snapshot(PolyResource):
    """An OpenStack Snapshot."""

    def clouddata(self):
        """See the parent class' method's docstring."""

        return list(get_cinder_client()["client"].volume_snapshots.list())

    @classmethod
    def display_attributes(cls):
        """Return a dict of cloud information about this type, suitable for
        client display."""

        return {"integration_name": "Cinder", "name": "Snapshot"}

    @classmethod
    def outgoing_edges(cls):      # pylint: disable=R0201
        """Return the edges leaving this type."""

        return [{TO: Volume,
                 EDGE_ATTRIBUTES:
                 {TYPE: APPLIES_TO,
                  MIN: 1,
                  MAX: 1,
                  MATCHING_FN:
                  lambda f, t:
                  f.get("id") and f.get("id") == t.get("snapshot_id")}},
                ]

    @property
    def unique_id_key(self):
        """See the parent class' method's docstring."""

        return "id"


class VolumeType(PolyResource):
    """An OpenStack Volume Type."""

    def clouddata(self):
        """See the parent class' method's docstring."""

        return list(get_cinder_client()["client"].volume_types.list())

    @classmethod
    def display_attributes(cls):
        """Return a dict of cloud information about this type, suitable for
        client display."""

        return {"integration_name": "Cinder", "name": "Volume Type"}

    @classmethod
    def outgoing_edges(cls):      # pylint: disable=R0201
        """Return the edges leaving this type."""

        return [{TO: Volume,
                 EDGE_ATTRIBUTES:
                 {TYPE: APPLIES_TO,
                  MIN: 0,
                  MAX: sys.maxint,
                  MATCHING_FN:
                  lambda f, t:
                  f.get("id") and f["id"] == t.get("volume_type")}},
                ]

    @property
    def unique_id_key(self):
        """See the parent class' method's docstring."""

        return "id"


class Volume(PolyResource):
    """An OpenStack Volume."""

    def clouddata(self):
        """See the parent class' method's docstring."""

        return list(get_cinder_client()["client"].volumes.list())

    @classmethod
    def display_attributes(cls):
        """Return a dict of cloud information about this type, suitable for
        client display."""

        return {"integration_name": "Cinder", "name": "Volume"}

    @property
    def unique_id_key(self):
        """See the parent class' method's docstring."""

        return "id"


class Limits(PolyResource):
    """An OpenStack Limit."""

    def clouddata(self):
        """See the parent class' method's docstring."""

        return list(get_glance_client()["client"].images.list())

    @classmethod
    def display_attributes(cls):
        """Return a dict of cloud information about this type, suitable for
        client display."""

        return {"integration_name": "Cinder", "name": "Limits"}

    @property
    def unique_id_key(self):
        """See the parent class' method's docstring."""

        return "id"


#
# These classes represent entities within a Neutron integration.
#

class MeteringLabelRule(PolyResource):
    """An OpenStack Metering Label Rule."""

    # TODO: Fill in.

    @classmethod
    def display_attributes(cls):
        """Return a dict of cloud information about this type, suitable for
        client display."""

        return {"integration_name": "Neutron", "name": "Metering Label Rule"}


class MeteringLabel(PolyResource):
    """An OpenStack Metering Label."""

    # TODO: Fill in.

    @classmethod
    def display_attributes(cls):
        """Return a dict of cloud information about this type, suitable for
        client display."""

        return {"integration_name": "Neutron", "name": "Metering Label"}

    @classmethod
    def outgoing_edges(cls):      # pylint: disable=R0201
        """Return the edges leaving this type."""

        return [{TO: MeteringLabel,
                 EDGE_ATTRIBUTES: {TYPE: APPLIES_TO,
                                   MIN: 1,
                                   MAX: 1}},
                ]


class NeutronQuota(PolyResource):
    """An OpenStack Neutron Quota."""

    # TODO: Fill in.

    @classmethod
    def display_attributes(cls):
        """Return a dict of cloud information about this type, suitable for
        client display."""

        return {"integration_name": "Neutron", "name": "Quota"}


class RemoteGroup(PolyResource):
    """An OpenStack Remote Group."""

    # TODO: Fill in.

    @classmethod
    def display_attributes(cls):
        """Return a dict of cloud information about this type, suitable for
        client display."""

        return {"integration_name": "Neutron", "name": "Remote Group"}


class SecurityRules(PolyResource):
    """An OpenStack Security Rules."""

    # TODO: Fill in.

    @classmethod
    def display_attributes(cls):
        """Return a dict of cloud information about this type, suitable for
        client display."""

        return {"integration_name": "Neutron", "name": "Security Rules"}

    @classmethod
    def outgoing_edges(cls):      # pylint: disable=R0201
        """Return the edges leaving this type."""

        return [{TO: RemoteGroup,
                 EDGE_ATTRIBUTES: {TYPE: APPLIES_TO, MIN: 0, MAX: 1}},
                {TO: SecurityGroup,
                 EDGE_ATTRIBUTES: {TYPE: MEMBER_OF, MIN: 1, MAX: 1}},
                ]


class SecurityGroup(PolyResource):
    """An OpenStack Security Group."""

    # TODO: Fill in.

    @classmethod
    def display_attributes(cls):
        """Return a dict of cloud information about this type, suitable for
        client display."""

        return {"integration_name": "Neutron", "name": "Security Group"}


class Port(PolyResource):
    """An OpenStack Port."""

    def clouddata(self):
        """See the parent class' method's docstring."""
        from goldstone.neutron.utils import get_neutron_client

        # Get the one and only one Cloud row in the system
        row = get_cloud()

        client = get_neutron_client(row.username,
                                    row.password,
                                    row.tenant_name,
                                    row.auth_url)

        return client.list_ports()["ports"]

    @classmethod
    def display_attributes(cls):
        """Return a dict of cloud information about this type, suitable for
        client display."""

        return {"integration_name": "Neutron", "name": "Port"}

    @classmethod
    def outgoing_edges(cls):      # pylint: disable=R0201
        """Return the edges leaving this type."""

        return [{TO: FixedIP,
                 EDGE_ATTRIBUTES: {TYPE: CONSUMES, MIN: 0, MAX: sys.maxint}},
                {TO: FloatingIP,
                 EDGE_ATTRIBUTES: {TYPE: CONSUMES, MIN: 0, MAX: sys.maxint}},
                {TO: SecurityGroup,
                 EDGE_ATTRIBUTES: {TYPE: MEMBER_OF, MIN: 0, MAX: sys.maxint}},
                ]

    @property
    def unique_id_key(self):
        """See the parent class' method's docstring."""

        return "id"


class LBVIP(PolyResource):
    """An OpenStack load balancer VIP address."""

    # TODO: Fill in.

    @classmethod
    def display_attributes(cls):
        """Return a dict of cloud information about this type, suitable for
        client display."""

        return {"integration_name": "Neutron", "name": "LB Virtual IP"}

    @classmethod
    def outgoing_edges(cls):      # pylint: disable=R0201
        """Return the edges leaving this type."""

        return [{TO: LBPool,
                 EDGE_ATTRIBUTES: {TYPE: MEMBER_OF, MIN: 0, MAX: 1}},
                {TO: Port,
                 EDGE_ATTRIBUTES: {TYPE: ATTACHED_TO, MIN: 0, MAX: 1}},
                {TO: Subnet,
                 EDGE_ATTRIBUTES: {TYPE: ALLOCATED_TO, MIN: 0, MAX: 1}},
                ]


class LBPool(PolyResource):
    """An OpenStack load balancer pool."""

    # TODO: Fill in.

    @classmethod
    def display_attributes(cls):
        """Return a dict of cloud information about this type, suitable for
        client display."""

        return {"integration_name": "Neutron",
                "name": "LB Pool",
                }


class HealthMonitor(PolyResource):
    """An OpenStack Health Monitor."""

    # TODO: Fill in.

    @classmethod
    def display_attributes(cls):
        """Return a dict of cloud information about this type, suitable for
        client display."""

        return {"integration_name": "Neutron", "name": "Health Monitor"}

    @classmethod
    def outgoing_edges(cls):      # pylint: disable=R0201
        """Return the edges leaving this type."""

        return [{TO: LBPool,
                 EDGE_ATTRIBUTES: {TYPE: APPLIES_TO,
                                   MIN: 0,
                                   MAX: sys.maxint}},
                ]


class FloatingIP(PolyResource):
    """An OpenStack Floating IP address."""

    # TODO: Fill in.

    @classmethod
    def display_attributes(cls):
        """Return a dict of cloud information about this type, suitable for
        client display."""

        return {"integration_name": "Neutron", "name": "Floating IP address"}


class FloatingIPPool(PolyResource):
    """An OpenStack Floating IP address pool."""

    # TODO: Fill in.

    @classmethod
    def display_attributes(cls):
        """Return a dict of cloud information about this type, suitable for
        client display."""

        return {"integration_name": "Neutron", "name": "Floating IP Pool"}

    @classmethod
    def outgoing_edges(cls):      # pylint: disable=R0201
        """Return the edges leaving this type."""

        return [{TO: FixedIP,
                 EDGE_ATTRIBUTES: {TYPE: ROUTES_TO,
                                   MIN: 0,
                                   MAX: sys.maxint}},
                {TO: FloatingIP,
                 EDGE_ATTRIBUTES: {TYPE: OWNS,
                                   MIN: 0,
                                   MAX: sys.maxint}},
                ]


class FixedIP(PolyResource):
    """An OpenStack Fixed IP address."""

    # TODO: Fill in.

    @classmethod
    def display_attributes(cls):
        """Return a dict of cloud information about this type, suitable for
        client display."""

        return {"integration_name": "Neutron", "name": "Fixed IP address"}


class LBMember(PolyResource):
    """An OpenStack load balancer member."""

    # TODO: Fill in.

    @classmethod
    def display_attributes(cls):
        """Return a dict of cloud information about this type, suitable for
        client display."""

        return {"integration_name": "Neutron", "name": "LB Member"}

    @classmethod
    def outgoing_edges(cls):      # pylint: disable=R0201
        """Return the edges leaving this type."""

        return [{TO: LBPool,
                 EDGE_ATTRIBUTES: {TYPE: MEMBER_OF,
                                   MIN: 0,
                                   MAX: sys.maxint}},
                {TO: Subnet,
                 EDGE_ATTRIBUTES: {TYPE: ATTACHED_TO, MIN: 0, MAX: 1}},
                ]


class Subnet(PolyResource):
    """An OpenStack subnet."""

    # TODO: Fill in.

    @classmethod
    def display_attributes(cls):
        """Return a dict of cloud information about this type, suitable for
        client display."""

        return {"integration_name": "Neutron", "name": "Subnet"}

    @classmethod
    def outgoing_edges(cls):      # pylint: disable=R0201
        """Return the edges leaving this type."""

        return [{TO: FixedIP,
                 EDGE_ATTRIBUTES: {TYPE: OWNS, MIN: 0, MAX: sys.maxint}},
                {TO: Network,
                 EDGE_ATTRIBUTES: {TYPE: MEMBER_OF, MIN: 1, MAX: 1}},
                ]


class Network(PolyResource):
    """An OpenStack network."""

    # TODO: Fill in.

    @classmethod
    def display_attributes(cls):
        """Return a dict of cloud information about this type, suitable for
        client display."""

        return {"integration_name": "Neutron", "name": "Network"}


class Router(PolyResource):
    """An OpenStack router."""

    # TODO: Fill in.

    @classmethod
    def display_attributes(cls):
        """Return a dict of cloud information about this type, suitable for
        client display."""

        return {"integration_name": "Neutron", "name": "Router"}

    @classmethod
    def outgoing_edges(cls):      # pylint: disable=R0201
        """Return the edges leaving this type."""

        return [{TO: Network,
                 EDGE_ATTRIBUTES: {TYPE: ATTACHED_TO, MIN: 0, MAX: 1}},
                {TO: Port,
                 EDGE_ATTRIBUTES: {TYPE: ATTACHED_TO,
                                   MIN: 0,
                                   MAX: sys.maxint}},
                ]
