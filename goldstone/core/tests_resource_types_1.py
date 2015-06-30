"""ResourceTypes unit tests, part 1."""
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
from django.test import SimpleTestCase
from functools import partial

from goldstone.tenants.models import Tenant, Cloud
from .models import Image, ServerGroup, NovaLimits, Host, Aggregate, \
    Hypervisor, Port, Cloudpipe, Network, Project, Server, AvailabilityZone, \
    Flavor, Interface, Keypair, User, Credential, Group

# Using the latest version of django-polymorphic, a
# PolyResource.objects.all().delete() throws an IntegrityError exception. So
# when we need to clear the PolyResource table, we'll individually delete each
# subclass.
NODE_TYPES = [Image, ServerGroup, NovaLimits, Host, Aggregate, Cloudpipe, Port,
              Hypervisor, Project, Network, Server, User, Credential, Group]

# Aliases to make the code less verbose
TO = settings.R_ATTRIBUTE.TO
MATCHING_FN = settings.R_ATTRIBUTE.MATCHING_FN


def dictassign(thedict, key, value):
    """A callable that does thedict[key] = value."""

    thedict[key] = value


def do_test(type_from, data_from, match_from_key_fn, type_to, data_to,
            match_to_key_fn):
    """Test the methods of two resource type nodes.

    This function modifies data_from and to_from.

    :param type_from: The type of the "from" node in the resource types graph
    :type type_from: PolyResource subclass
    :param data_from: Type_from's initial test data.
    :type data_from: dict
    :param match_from_key_fn: A one-argument function to modify the value used
                              in the matching_fn test
    :type match_from_key_fn: Callable
    :param type_to: The type of the "to" node in the resource types graph
    :type type_to: PolyResource subclass
    :param data_to: Type_to's initial test data.
    :type data_to: dict
    :param match_to_key_fn: A one-argument function to modify the value used
                            in the matching_fn test
    :type match_to_key_fn: Callable

    """

    # Get the matching function from the source type
    from_to_entry = [x for x in type_from.outgoing_edges()
                     if x[TO] == type_to][0]
    matching_fn = from_to_entry[MATCHING_FN]

    # Test one being None
    match_from_key_fn(None)
    assert not matching_fn(data_from, data_to)

    # Test both being None
    match_to_key_fn(None)
    assert not matching_fn(data_from, data_to)

    # Test no match
    match_from_key_fn("4445")
    match_to_key_fn("4444")
    assert not matching_fn(data_from, data_to)

    # Test match
    match_to_key_fn("4445")
    assert matching_fn(data_from, data_to)


class ResourceTypesTests(SimpleTestCase):
    """Test each entry in Types.EDGES, in particular the matching_fn
    functions."""

    def setUp(self):
        """Run before each test."""

        Tenant.objects.all().delete()

        tenant = Tenant.objects.create(name="Bebe",
                                       owner="Rebozo",
                                       owner_contact="Siberia")
        Cloud.objects.create(tenant_name="test1",
                             username="test1 user",
                             password="password",
                             auth_url="http://1.1.1.1:5000/",
                             tenant=tenant)

    @staticmethod
    def test_image():
        """Test the Image entry."""

        # Test data.
        IMAGE = {u'checksum': u'd972013792949d0d3ba628fbe8685bce',
                 u'container_format': u'bare',
                 u'created_at': u'2015-01-20T22:41:11Z',
                 u'disk_format': u'qcow2',
                 u'file':
                 u'/v2/images/0ae46ce1-80e5-447e-b0e8-9eeec81af920/file',
                 u'id': u'0ae46ce1-80e5-447e-b0e8-9eeec81af920',
                 u'min_disk': 0,
                 u'min_ram': 0,
                 u'name': u'cirros',
                 u'owner': u'a8cc59bf0cfa4103bc038d269d7cae65',
                 u'protected': False,
                 u'schema': u'/v2/schemas/image',
                 u'size': 13147648,
                 u'status': u'active',
                 u'tags': [],
                 u'updated_at': u'2015-01-20T22:41:12Z',
                 u'visibility': u'public'}

        SERVER = {u'OS-DCF:diskConfig': u'MANUAL',
                  u'OS-EXT-AZ:availability_zone': u'nova',
                  u'OS-EXT-SRV-ATTR:host': u'john.oak.solinea.com',
                  u'OS-EXT-SRV-ATTR:hypervisor_hostname':
                  u'john.oak.solinea.com',
                  u'OS-EXT-SRV-ATTR:instance_name': u'instance-00000001',
                  u'OS-EXT-STS:power_state': 4,
                  u'OS-EXT-STS:task_state': None,
                  u'OS-EXT-STS:vm_state': u'stopped',
                  u'OS-SRV-USG:launched_at': u'2015-01-26T14:01:37.000000',
                  u'OS-SRV-USG:terminated_at': None,
                  u'accessIPv4': u'',
                  u'accessIPv6': u'',
                  u'addresses':
                  {u'demo-net':
                   [{u'OS-EXT-IPS-MAC:mac_addr': u'fa:00:00:7f:2a:00',
                     u'OS-EXT-IPS:type': u'fixed',
                     u'addr': u'192.168.1.1',
                     u'version': 4},
                    {u'OS-EXT-IPS-MAC:mac_addr': u'fa:00:00:7f:2a:00',
                     u'OS-EXT-IPS:type': u'floating',
                     u'addr': u'10.11.12.13',
                     u'version': 4}]},
                  u'config_drive': u'',
                  u'created': u'2015-01-26T14:00:42Z',
                  u'flavor': {u'id': u'1',
                              u'links':
                              [{u'href':
                                u'http://10.11.12.13:8774/'
                                u'7077765ed0df43b1b23d43c9c290daf9/flavors/1',
                                u'rel': u'bookmark'}]},
                  u'hostId':
                  u'78f689fe281dbb1deb8e42ac188a9734faf430ddc905b556b74f6144',
                  u'id': u'ee662ff5-3de6-46cb-8b85-4eb4317beb7c',
                  u'image': {u'id': u'0ae46ce1-80e5-447e-b0e8-9eeec81af920',
                             u'links':
                             [{u'href':
                               u'http://10.11.12.13:8774/'
                               u'7077765ed0df43b1b23d43c9c290daf9/'
                               u'images/0ae46ce1-80e5-447e-b0e8-9eeec81af920',
                               u'rel': u'bookmark'}]},
                  u'key_name': None,
                  u'links':
                  [{u'href':
                    u'http://10.10.20.10:8774/v2/7077765ed0df43b1b23d'
                    u'43c9c290daf9/servers/'
                    u'ee662ff5-3de6-46cb-8b85-4eb4317beb7c',
                    u'rel': u'self'},
                   {u'href':
                    u'http://10.10.20.10:8774/7077765ed0df43'
                    u'b1b23d43c9c290daf9/servers/ee662ff5-3de6-46cb-'
                    u'8b85-4eb4317beb7c',
                    u'rel': u'bookmark'}],
                  u'metadata': {},
                  u'name': u'instance2',
                  u'os-extended-volumes:volumes_attached': [],
                  u'security_groups': [{u'name': u'default'}],
                  u'status': u'SHUTOFF',
                  u'tenant_id': u'56762288eea24ab08a3b6d06f5a37c14',
                  u'updated': u'2015-03-04T01:27:22Z',
                  u'user_id': u'2bb2f66f20cb47e9be48a91941e3353b'}

        do_test(Image,
                IMAGE,
                partial(dictassign, IMAGE, "id"),
                Server,
                SERVER,
                partial(dictassign, SERVER, "id"))

    @staticmethod
    def test_availability_zone_agg():
        """Test the AvailabilityZone - Aggregate entry."""

        # Test data.
        AVAILABILITY_ZONE = {
            u'hosts':
            {u'ctrl-john.solinea.com':
             {u'nova-cert': {u'active': True,
                             u'available': True,
                             u'updated_at':
                             u'2015-04-02T18:46:27.000000'},
              u'nova-conductor': {u'active': True,
                                  u'available': True,
                                  u'updated_at':
                                  u'2015-04-02T18:46:20.000000'},
              u'nova-consoleauth': {u'active': True,
                                    u'available': True,
                                    u'updated_at':
                                    u'2015-04-02T18:46:27.000000'},
              u'nova-scheduler': {u'active': True,
                                  u'available': True,
                                  u'updated_at':
                                  u'2015-04-02T18:46:27.000000'}}},
            u'zoneName': u'internal',
            u'zoneState': {u'available': True}
            }

        AGGREGATE = {u'availability_zone': None,
                     u'created_at': u'2015-04-01T18:36:03.000000',
                     u'deleted': False,
                     u'deleted_at': None,
                     u'hosts': [u'bob.solinea.com'],
                     u'id': 1,
                     u'metadata': {},
                     u'name': u'test-aggregate1',
                     u'updated_at': None}

        do_test(AvailabilityZone,
                AVAILABILITY_ZONE,
                partial(dictassign, AVAILABILITY_ZONE, "zoneName"),
                Aggregate,
                AGGREGATE,
                partial(dictassign, AGGREGATE, "availability_zone"))

    @staticmethod
    def test_availability_zone_host():
        """Test the AvailabilityZone - Host entry."""

        # Test data.
        AVAILABILITY_ZONE = {
            u'hosts':
            {u'ctrl-john.solinea.com':
             {u'nova-cert': {u'active': True,
                             u'available': True,
                             u'updated_at':
                             u'2015-04-02T18:46:27.000000'},
              u'nova-conductor': {u'active': True,
                                  u'available': True,
                                  u'updated_at':
                                  u'2015-04-02T18:46:20.000000'},
              u'nova-consoleauth': {u'active': True,
                                    u'available': True,
                                    u'updated_at':
                                    u'2015-04-02T18:46:27.000000'},
              u'nova-scheduler': {u'active': True,
                                  u'available': True,
                                  u'updated_at':
                                  u'2015-04-02T18:46:27.000000'}}},
            u'zoneName': u'internal',
            u'zoneState': {u'available': True}
            }

        HOST = {u'host_name': u'ctrl-01', u'zone': u'internal'}

        do_test(AvailabilityZone,
                AVAILABILITY_ZONE,
                partial(dictassign, AVAILABILITY_ZONE, "zoneName"),
                Host,
                HOST,
                partial(dictassign, HOST, "zone"))

    @staticmethod
    def test_cloudpipe():
        """Test the Cloudpipe entry."""

        pass

    @staticmethod
    def test_flavor_server():
        """Test the Flavor - Server entry."""

        # Test data.
        FLAVOR = {u'OS-FLV-DISABLED:disabled': False,
                  u'OS-FLV-EXT-DATA:ephemeral': 0,
                  u'disk': 80,
                  u'id': u'4',
                  u'links': [{u'href':
                              u'http://10.11.12.13:8774/v2/7077765ed0df43b1b'
                              u'23d43c9c290daf9/flavors/4',
                              u'rel': u'self'},
                             {u'href': u'http://10.11.12.13:8774/7077765ed0'
                              u'df43b1b23d43c9c290daf9/flavors/4',
                              u'rel': u'bookmark'}],
                  u'name': u'm1.large',
                  u'os-flavor-access:is_public': True,
                  u'ram': 8192,
                  u'rxtx_factor': 1.0,
                  u'swap': u'',
                  u'vcpus': 4}

        SERVER = {u'OS-DCF:diskConfig': u'MANUAL',
                  u'OS-EXT-AZ:availability_zone': u'nova',
                  u'OS-EXT-SRV-ATTR:host': u'john.oak.solinea.com',
                  u'OS-EXT-SRV-ATTR:hypervisor_hostname':
                  u'john.oak.solinea.com',
                  u'OS-EXT-SRV-ATTR:instance_name': u'instance-00000001',
                  u'OS-EXT-STS:power_state': 4,
                  u'OS-EXT-STS:task_state': None,
                  u'OS-EXT-STS:vm_state': u'stopped',
                  u'OS-SRV-USG:launched_at': u'2015-01-26T14:01:37.000000',
                  u'OS-SRV-USG:terminated_at': None,
                  u'accessIPv4': u'',
                  u'accessIPv6': u'',
                  u'addresses':
                  {u'demo-net':
                   [{u'OS-EXT-IPS-MAC:mac_addr': u'fa:00:00:7f:2a:00',
                     u'OS-EXT-IPS:type': u'fixed',
                     u'addr': u'192.168.1.1',
                     u'version': 4},
                    {u'OS-EXT-IPS-MAC:mac_addr': u'fa:00:00:7f:2a:00',
                     u'OS-EXT-IPS:type': u'floating',
                     u'addr': u'10.11.12.13',
                     u'version': 4}]},
                  u'config_drive': u'',
                  u'created': u'2015-01-26T14:00:42Z',
                  u'flavor': {u'id': u'1',
                              u'links':
                              [{u'href':
                                u'http://10.11.12.13:8774/'
                                u'7077765ed0df43b1b23d43c9c290daf9/flavors/1',
                                u'rel': u'bookmark'}]},
                  u'hostId':
                  u'78f689fe281dbb1deb8e42ac188a9734faf430ddc905b556b74f6144',
                  u'id': u'ee662ff5-3de6-46cb-8b85-4eb4317beb7c',
                  u'image': {u'id': u'0ae46ce1-80e5-447e-b0e8-9eeec81af920',
                             u'links':
                             [{u'href':
                               u'http://10.11.12.13:8774/'
                               u'7077765ed0df43b1b23d43c9c290daf9/'
                               u'images/0ae46ce1-80e5-447e-b0e8-9eeec81af920',
                               u'rel': u'bookmark'}]},
                  u'key_name': None,
                  u'links':
                  [{u'href':
                    u'http://10.10.20.10:8774/v2/7077765ed0df43b1b23d'
                    u'43c9c290daf9/servers/'
                    u'ee662ff5-3de6-46cb-8b85-4eb4317beb7c',
                    u'rel': u'self'},
                   {u'href':
                    u'http://10.10.20.10:8774/7077765ed0df43'
                    u'b1b23d43c9c290daf9/servers/ee662ff5-3de6-46cb-'
                    u'8b85-4eb4317beb7c',
                    u'rel': u'bookmark'}],
                  u'metadata': {},
                  u'name': u'instance2',
                  u'os-extended-volumes:volumes_attached': [],
                  u'security_groups': [{u'name': u'default'}],
                  u'status': u'SHUTOFF',
                  u'tenant_id': u'56762288eea24ab08a3b6d06f5a37c14',
                  u'updated': u'2015-03-04T01:27:22Z',
                  u'user_id': u'2bb2f66f20cb47e9be48a91941e3353b'}

        def serverassign(value):
            """Store value into the server dict's matching attribute."""

            SERVER["flavor"]["id"] = value

        do_test(Flavor,
                FLAVOR,
                partial(dictassign, FLAVOR, "id"),
                Server,
                SERVER,
                serverassign)

    @staticmethod
    def test_host_aggregate():
        """Test the Host - Aggregate entry."""

        # Test data.
        HOST = {u'host_name': u'ctrl-01', u'zone': u'internal'}

        AGGREGATE = {u'availability_zone': None,
                     u'created_at': u'2015-04-01T18:36:03.000000',
                     u'deleted': False,
                     u'deleted_at': None,
                     u'hosts': [u'bob.solinea.com'],
                     u'id': 1,
                     u'metadata': {},
                     u'name': u'test-aggregate1',
                     u'updated_at': None}

        def aggregateassign(value):
            """Load value into the aggregate dict's matching attribute."""

            AGGREGATE["hosts"] = ["bob", "marley", value]

        do_test(Host,
                HOST,
                partial(dictassign, HOST, "host_name"),
                Aggregate,
                AGGREGATE,
                aggregateassign)

    @staticmethod
    def test_host_hypervisor():
        """Test the Host - Hypervisor entry."""

        # Test data.
        HOST = {u'host_name': u'ctrl-01', u'zone': u'internal'}

        HYPERVISOR = {u'cpu_info':
                      u'{"vendor": "Intel", "model": "Westmere", '
                      u'"arch": "x86_64", '
                      u'"features": ["tsc-deadline", "dtes64", "vmx", "erms", '
                      u'"xtpr", "smep", "est", "monitor", "3dnowprefetch", '
                      u'"tm", "pclmuldq", "acpi", "vme", "tm2", "ht", "pdcm", '
                      u'"ds", "invtsc", "rdtscp", "ss", "pbe", "ds_cpl", '
                      u'"movbe", "rdrand"], "topology": {"cores": 8, '
                      u'"threads": 1, "sockets": 1}}',
                      u'current_workload': 0,
                      u'disk_available_least': 1,
                      u'free_disk_gb': 7,
                      u'free_ram_mb': 10304,
                      u'host_ip': u'10.10.20.21',
                      u'hypervisor_hostname': u'john.solinea.com',
                      u'hypervisor_type': u'QEMU',
                      u'hypervisor_version': 12001,
                      u'id': 1,
                      u'local_gb': 49,
                      u'local_gb_used': 42,
                      u'memory_mb': 15936,
                      u'memory_mb_used': 5632,
                      u'running_vms': 4,
                      u'service': {u'host': u'rsrc-02.c2.oak.solinea.com',
                                   u'id': 5},
                      u'vcpus': 8,
                      u'vcpus_used': 4}

        do_test(Host,
                HOST,
                partial(dictassign, HOST, "host_name"),
                Hypervisor,
                HYPERVISOR,
                partial(dictassign, HYPERVISOR, "hypervisor_hostname"))

    @staticmethod
    def test_hypervisor_server():
        """Test the Hypervisor - Server entry."""

        # Test data.
        HYPERVISOR = {u'cpu_info':
                      u'{"vendor": "Intel", "model": "Westmere", '
                      u'"arch": "x86_64", '
                      u'"features": ["tsc-deadline", "dtes64", "vmx", "erms", '
                      u'"xtpr", "smep", "est", "monitor", "3dnowprefetch", '
                      u'"tm", "pclmuldq", "acpi", "vme", "tm2", "ht", "pdcm", '
                      u'"ds", "invtsc", "rdtscp", "ss", "pbe", "ds_cpl", '
                      u'"movbe", "rdrand"], "topology": {"cores": 8, '
                      u'"threads": 1, "sockets": 1}}',
                      u'current_workload': 0,
                      u'disk_available_least': 1,
                      u'free_disk_gb': 7,
                      u'free_ram_mb': 10304,
                      u'host_ip': u'10.10.20.21',
                      u'hypervisor_hostname': u'john.solinea.com',
                      u'hypervisor_type': u'QEMU',
                      u'hypervisor_version': 12001,
                      u'id': 1,
                      u'local_gb': 49,
                      u'local_gb_used': 42,
                      u'memory_mb': 15936,
                      u'memory_mb_used': 5632,
                      u'running_vms': 4,
                      u'service': {u'host': u'rsrc-02.c2.oak.solinea.com',
                                   u'id': 5},
                      u'vcpus': 8,
                      u'vcpus_used': 4}

        SERVER = {u'OS-DCF:diskConfig': u'MANUAL',
                  u'OS-EXT-AZ:availability_zone': u'nova',
                  u'OS-EXT-SRV-ATTR:host': u'john.oak.solinea.com',
                  u'OS-EXT-SRV-ATTR:hypervisor_hostname':
                  u'john.oak.solinea.com',
                  u'OS-EXT-SRV-ATTR:instance_name': u'instance-00000001',
                  u'OS-EXT-STS:power_state': 4,
                  u'OS-EXT-STS:task_state': None,
                  u'OS-EXT-STS:vm_state': u'stopped',
                  u'OS-SRV-USG:launched_at': u'2015-01-26T14:01:37.000000',
                  u'OS-SRV-USG:terminated_at': None,
                  u'accessIPv4': u'',
                  u'accessIPv6': u'',
                  u'addresses':
                  {u'demo-net':
                   [{u'OS-EXT-IPS-MAC:mac_addr': u'fa:00:00:7f:2a:00',
                     u'OS-EXT-IPS:type': u'fixed',
                     u'addr': u'192.168.1.1',
                     u'version': 4},
                    {u'OS-EXT-IPS-MAC:mac_addr': u'fa:00:00:7f:2a:00',
                     u'OS-EXT-IPS:type': u'floating',
                     u'addr': u'10.11.12.13',
                     u'version': 4}]},
                  u'config_drive': u'',
                  u'created': u'2015-01-26T14:00:42Z',
                  u'flavor': {u'id': u'1',
                              u'links':
                              [{u'href':
                                u'http://10.11.12.13:8774/'
                                u'7077765ed0df43b1b23d43c9c290daf9/flavors/1',
                                u'rel': u'bookmark'}]},
                  u'hostId':
                  u'78f689fe281dbb1deb8e42ac188a9734faf430ddc905b556b74f6144',
                  u'id': u'ee662ff5-3de6-46cb-8b85-4eb4317beb7c',
                  u'image': {u'id': u'0ae46ce1-80e5-447e-b0e8-9eeec81af920',
                             u'links':
                             [{u'href':
                               u'http://10.11.12.13:8774/'
                               u'7077765ed0df43b1b23d43c9c290daf9/'
                               u'images/0ae46ce1-80e5-447e-b0e8-9eeec81af920',
                               u'rel': u'bookmark'}]},
                  u'key_name': None,
                  u'links':
                  [{u'href':
                    u'http://10.10.20.10:8774/v2/7077765ed0df43b1b23d'
                    u'43c9c290daf9/servers/'
                    u'ee662ff5-3de6-46cb-8b85-4eb4317beb7c',
                    u'rel': u'self'},
                   {u'href':
                    u'http://10.10.20.10:8774/7077765ed0df43'
                    u'b1b23d43c9c290daf9/servers/ee662ff5-3de6-46cb-'
                    u'8b85-4eb4317beb7c',
                    u'rel': u'bookmark'}],
                  u'metadata': {},
                  u'name': u'instance2',
                  u'os-extended-volumes:volumes_attached': [],
                  u'security_groups': [{u'name': u'default'}],
                  u'status': u'SHUTOFF',
                  u'tenant_id': u'56762288eea24ab08a3b6d06f5a37c14',
                  u'updated': u'2015-03-04T01:27:22Z',
                  u'user_id': u'2bb2f66f20cb47e9be48a91941e3353b'}

        do_test(Hypervisor,
                HYPERVISOR,
                partial(dictassign, HYPERVISOR, "id"),
                Server,
                SERVER,
                partial(dictassign,
                        SERVER,
                        "OS-EXT-SRV-ATTR:hypervisor_hostname"))

    @staticmethod
    def test_interface_port():
        """Test the Interface - Port entry."""

        # Test data.
        INTERFACE = {u'fixed_ips':
                     [{u'ip_address': u'192.168.1.111',
                       u'subnet_id': u'623ed5a0-785b-4a8a-94a1-a96dd8679f1c'}],
                     u'mac_addr': u'fa:16:3e:00:11:22',
                     u'net_id': u'fa4684fa-7243-45bf-aac5-0a3db0c210b1',
                     u'port_id': u'f3f6cd1a-b199-4d67-9266-8d69ac1fb46b',
                     u'port_state': u'ACTIVE'}

        PORT = {u'admin_state_up': True,
                u'allowed_address_pairs': [],
                u'binding:host_id': u'rsrc-02.c2.oak.solinea.com',
                u'binding:profile': {},
                u'binding:vif_details': {u'ovs_hybrid_plug': True,
                                         u'port_filter': True},
                u'binding:vif_type': u'ovs',
                u'binding:vnic_type': u'normal',
                u'device_id': u'f4091091-ccb9-495a-815d-75de88f82ad2',
                u'device_owner': u'compute:None',
                u'extra_dhcp_opts': [],
                u'fixed_ips':
                [{u'ip_address': u'192.168.1.201',
                  u'subnet_id': u'623ed5a0-785b-4a8a-94a1-a96dd8679f1c'}],
                u'id': u'f3f6cd1a-b199-4d67-9266-8d69ac1fb46b',
                u'mac_address': u'fa:16:3e:77:7b:9c',
                u'name': u'',
                u'network_id': u'fa4684fa-7243-45bf-aac5-0a3db0c210b1',
                u'security_groups': [u'5d3c6a9f-005c-470e-9cb0-1163f9d222b5'],
                u'status': u'ACTIVE',
                u'tenant_id': u'56762288eea24ab08a3b6d06f5a37c14'}

        do_test(Interface,
                INTERFACE,
                partial(dictassign, INTERFACE, "mac_addr"),
                Port,
                PORT,
                partial(dictassign, PORT, "mac_address"))

    def test_keypair_server(self):
        """Test the Keypair - Server entry."""

        # Test data.
        KEYPAIR = {u'fingerprint':
                   u'fa:73:23:78:1f:8c:10:bb:25:0f:6f:5e:25:62:14:c7',
                   u'name': u'mykey',
                   u'public_key': u'ssh-rsa AAAAB3NzaC1yc2EAAAADAQAB'
                   u'AAABAQDMMvo7r4q63rGaWjDhuZFBPMLqDfCY/FcNPK//FArLw8s62Pfh'
                   u'l4mWdontreadthisp+qOKugkI1oox46OGp4Pvka1qRboomboomxJ95nl'
                   u'/akk4TgE821KHR2Bl716mXDdlBFlv6K/AkXpr2e2E1R73cGQttuBYwSX'
                   u'onGJ3+U68iFXxdeadbeefQjkgTy2amqNDaG7qVc3vzDE5j4VH3MAff0H'
                   u'udqrgqdsq6Hq991G7MAfxom+36pZ8q3p/UY6T7uWoNrvAc3o7kFpppNd'
                   u'1lPuqnjOD6wPB4vZdDWta/5fVwg+bpWY9qUoDdeadbeef7l7UGgOkkkD'
                   u'kkkkSq/iDh bob@Siberia.local\n'}

        SERVER = {u'OS-DCF:diskConfig': u'MANUAL',
                  u'OS-EXT-AZ:availability_zone': u'nova',
                  u'OS-EXT-SRV-ATTR:host': u'john.oak.solinea.com',
                  u'OS-EXT-SRV-ATTR:hypervisor_hostname':
                  u'john.oak.solinea.com',
                  u'OS-EXT-SRV-ATTR:instance_name': u'instance-00000001',
                  u'OS-EXT-STS:power_state': 4,
                  u'OS-EXT-STS:task_state': None,
                  u'OS-EXT-STS:vm_state': u'stopped',
                  u'OS-SRV-USG:launched_at': u'2015-01-26T14:01:37.000000',
                  u'OS-SRV-USG:terminated_at': None,
                  u'accessIPv4': u'',
                  u'accessIPv6': u'',
                  u'addresses':
                  {u'demo-net':
                   [{u'OS-EXT-IPS-MAC:mac_addr': u'fa:00:00:7f:2a:00',
                     u'OS-EXT-IPS:type': u'fixed',
                     u'addr': u'192.168.1.1',
                     u'version': 4},
                    {u'OS-EXT-IPS-MAC:mac_addr': u'fa:00:00:7f:2a:00',
                     u'OS-EXT-IPS:type': u'floating',
                     u'addr': u'10.11.12.13',
                     u'version': 4}]},
                  u'config_drive': u'',
                  u'created': u'2015-01-26T14:00:42Z',
                  u'flavor': {u'id': u'1',
                              u'links':
                              [{u'href':
                                u'http://10.11.12.13:8774/'
                                u'7077765ed0df43b1b23d43c9c290daf9/flavors/1',
                                u'rel': u'bookmark'}]},
                  u'hostId':
                  u'78f689fe281dbb1deb8e42ac188a9734faf430ddc905b556b74f6144',
                  u'id': u'ee662ff5-3de6-46cb-8b85-4eb4317beb7c',
                  u'image': {u'id': u'0ae46ce1-80e5-447e-b0e8-9eeec81af920',
                             u'links':
                             [{u'href':
                               u'http://10.11.12.13:8774/'
                               u'7077765ed0df43b1b23d43c9c290daf9/'
                               u'images/0ae46ce1-80e5-447e-b0e8-9eeec81af920',
                               u'rel': u'bookmark'}]},
                  u'key_name': None,
                  u'links':
                  [{u'href':
                    u'http://10.10.20.10:8774/v2/7077765ed0df43b1b23d'
                    u'43c9c290daf9/servers/'
                    u'ee662ff5-3de6-46cb-8b85-4eb4317beb7c',
                    u'rel': u'self'},
                   {u'href':
                    u'http://10.10.20.10:8774/7077765ed0df43'
                    u'b1b23d43c9c290daf9/servers/ee662ff5-3de6-46cb-'
                    u'8b85-4eb4317beb7c',
                    u'rel': u'bookmark'}],
                  u'metadata': {},
                  u'name': u'instance2',
                  u'os-extended-volumes:volumes_attached': [],
                  u'security_groups': [{u'name': u'default'}],
                  u'status': u'SHUTOFF',
                  u'tenant_id': u'56762288eea24ab08a3b6d06f5a37c14',
                  u'updated': u'2015-03-04T01:27:22Z',
                  u'user_id': u'2bb2f66f20cb47e9be48a91941e3353b'}

        # I think any public keypair can be used on any server. So, do_test()
        # will fail on the "no match" test. So, we'll do all the testing here,
        # except for the no-match test.
        #
        # Get the matching function from the source type
        from_to_entry = [x for x in Keypair.outgoing_edges()
                         if x[TO] == Server][0]
        matching_fn = from_to_entry[MATCHING_FN]

        # Test the keypair being None
        dictassign(KEYPAIR, "fingerprint", None)
        self.assertFalse(matching_fn(KEYPAIR, SERVER))

        # Test both being None
        dictassign(SERVER, "OS-EXT-SRV-ATTR:hypervisor_hostname", None)
        self.assertFalse(matching_fn(KEYPAIR, SERVER))

        # Test match
        dictassign(KEYPAIR, "fingerprint", "4445")
        dictassign(SERVER, "OS-EXT-SRV-ATTR:hypervisor_hostname", "4445")
        self.assertTrue(matching_fn(KEYPAIR, SERVER))

    @staticmethod
    def test_user_credential():
        """Test the User - Credential entry."""

        # Test data.
        USER = {u'name': u'swift',
                u'links':
                {u'self':
                 u'http://1.1.1.1:35357/v3/users/075999999b0549999994be13aa0'},
                u'enabled': True,
                u'domain_id': u'default',
                u'default_project_id': u'31ebe76d822a4c709772ee7f15c14c1d',
                u'id': u'0751ad1dcb054ddea7d4be13aa63dec0',
                u'email': u'swift@localhost'}

        CREDENTIAL = {"blob":
                      "{\"access\":\"181920\",\"secret\":\"secretKey\"}",
                      "id": "414243",
                      "links":
                      {"self": "http://identity:35357/v3/credentials/414243"},
                      "project_id": "456789",
                      "type": "ec2",
                      "user_id": u'0751ad1dcb054ddea7d4be13aa63dec0',
                      }

        do_test(User,
                USER,
                partial(dictassign, USER, "id"),
                Credential,
                CREDENTIAL,
                partial(dictassign, CREDENTIAL, "user_id"))

    @staticmethod
    def test_user_group():
        """Test the User - Group entry."""

        # Test data.
        USER = {u'name': u'swift',
                u'links':
                {u'self':
                 u'http://1.1.1.1:35357/v3/users/075999999b0549999994be13aa0'},
                u'enabled': True,
                u'domain_id': u'default',
                u'default_project_id': u'31ebe76d822a4c709772ee7f15c14c1d',
                u'id': u'0751ad1dcb054ddea7d4be13aa63dec0',
                u'email': u'swift@localhost'}

        GROUP = {"description": "Developers cleared for work",
                 "domain_id": "default",
                 "id": "101112",
                 "links": {"self": "http://identity:35357/v3/groups/101112"},
                 "name": "Developers"
                 }

        do_test(User,
                USER,
                partial(dictassign, USER, "domain_id"),
                Group,
                GROUP,
                partial(dictassign, GROUP, "domain_id"))

    @staticmethod
    def test_user_project():
        """Test the User - Project entry."""

        # Test data.
        USER = {u'name': u'swift',
                u'links':
                {u'self':
                 u'http://1.1.1.1:35357/v3/users/075999999b0549999994be13aa0'},
                u'enabled': True,
                u'domain_id': u'default',
                u'default_project_id': u'31ebe76d822a4c709772ee7f15c14c1d',
                u'id': u'0751ad1dcb054ddea7d4be13aa63dec0',
                u'email': u'swift@localhost'}

        PROJECT = {"domain_id": "1789d1",
                   "parent_id": "123c56",
                   "enabled": True,
                   "id": "263fd9",
                   "links":
                   {"self": "https://identity:35357/v3/projects/263fd9"},
                   "name": "Test Group"
                   }

        do_test(User,
                USER,
                partial(dictassign, USER, "default_project_id"),
                Project,
                PROJECT,
                partial(dictassign, PROJECT, "id"))

    @staticmethod
    def test_user_quotaset():
        """Test the User - QuotaSet entry."""

        pass
