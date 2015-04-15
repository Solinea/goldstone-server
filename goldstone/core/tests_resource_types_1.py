"""ResourceTypes unit tests, part 1."""
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
from django.test import SimpleTestCase
from functools import partial

from .models import Image, ServerGroup, NovaLimits, Host, resource_types, \
    Aggregate, Hypervisor, Port, Cloudpipe, Network, Project, Server, \
    AvailabilityZone, Flavor, FlavorExtraSpec, Interface, Keypair

# Using the latest version of django-polymorphic, a
# PolyResource.objects.all().delete() throws an IntegrityError exception. So
# when we need to clear the PolyResource table, we'll individually delete each
# subclass.
NODE_TYPES = [Image, ServerGroup, NovaLimits, Host, Aggregate, Cloudpipe, Port,
              Hypervisor, Project, Network, Server]

# Aliases to make the code less verbose
TYPE = settings.R_ATTRIBUTE.TYPE
MATCHING_FN = settings.R_ATTRIBUTE.MATCHING_FN


def dictassign(thedict, key, value):
    """A callable that does thedict[key] = value."""

    thedict[key] = value


def do_test(type_from, data_from, identity_from, match_from_key_fn,
            type_to, data_to, identity_to, match_to_key_fn):
    """Test two resource_types nodes.

    This function modifies data_from and to_from.

    :param type_from: The type of the "from" node in the resource_types graph
    :type type_from: PolyResource subclass
    :param data_from: Type_from's initial test data.
    :type data_from: dict
    :param identity_from: The identity() value against which to test
    :type identity_from: str
    :param match_from_key_fn: A one-argument function to modify the value used
                              in the matching_fn test
    :type match_from_key_fn: Callable
    :param type_to: The type of the "to" node in the resource_types graph
    :type type_to: PolyResource subclass
    :param data_to: Type_to's initial test data.
    :type data_to: dict
    :param identity_to: The identity() value against which to test
    :type identity_to: str
    :param match_to_key_fn: A one-argument function to modify the value used
                            in the matching_fn test
    :type match_to_key_fn: Callable

    """

    # Test identity method.
    assert type_from.identity(data_from) == identity_from
    assert type_to.identity(data_to) == identity_to

    # Test edge discovery.
    edges = resource_types.graph.out_edges(type_from, data=True)
    edge = [x for x in edges if x[1] == type_to][0][2]

    # Test one being None
    match_from_key_fn(None)
    assert not edge[MATCHING_FN](data_from, data_to)

    # Test both being None
    match_to_key_fn(None)
    assert not edge[MATCHING_FN](data_from, data_to)

    # Test no match
    match_from_key_fn("4445")
    match_to_key_fn("4444")
    assert not edge[MATCHING_FN](data_from, data_to)

    # Test match
    match_to_key_fn("4445")
    assert edge[MATCHING_FN](data_from, data_to)


class ResourceTypesTests(SimpleTestCase):
    """Test each entry in ResourceTypes.EDGES, in particular the matching_fn
    functions."""

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
                '0ae46ce1-80e5-447e-b0e8-9eeec81af920',
                partial(dictassign, IMAGE, "id"),
                Server,
                SERVER,
                'ee662ff5-3de6-46cb-8b85-4eb4317beb7c',
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
                "internal",
                partial(dictassign, AVAILABILITY_ZONE, "zoneName"),
                Aggregate,
                AGGREGATE,
                1,
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
                "internal",
                partial(dictassign, AVAILABILITY_ZONE, "zoneName"),
                Host,
                HOST,
                'ctrl-01',
                partial(dictassign, HOST, "zone"))

    @staticmethod
    def test_cloudpipe():
        """Test the Cloudpipe entry."""

        # Test data.
        # pylint: disable=W0612
        CLOUDPIPE = {}

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

        # do_test(Cloudpipe,
        #       CLOUDPIPE,
        #       '0ae46ce1-80e5-447e-b0e8-9eeec81af920',
        #       "id",
        #       Server,
        #       SERVER,
        #       'ee662ff5-3de6-46cb-8b85-4eb4317beb7c',
        #       "id")

        # TODO: Write this test. Couldn't make a cloudpipe today, for some odd
        # reason.

    @staticmethod
    def test_flavor_flavorextraspec():
        """Test the Flavor - FlavorExtraSpec entry."""

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

        FLAVOR_EXTRA_SPEC = {u'id': u'4',
                             u'we are': u'making this up',
                             }

        do_test(Flavor,
                FLAVOR,
                "4",
                partial(dictassign, FLAVOR, "id"),
                FlavorExtraSpec,
                FLAVOR_EXTRA_SPEC,
                '4',
                partial(dictassign, FLAVOR_EXTRA_SPEC, "id"))

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
                "4",
                partial(dictassign, FLAVOR, "id"),
                Server,
                SERVER,
                'ee662ff5-3de6-46cb-8b85-4eb4317beb7c',
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
                'ctrl-01',
                partial(dictassign, HOST, "host_name"),
                Aggregate,
                AGGREGATE,
                1,
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
                "ctrl-01",
                partial(dictassign, HOST, "host_name"),
                Hypervisor,
                HYPERVISOR,
                1,
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
                1,
                partial(dictassign, HYPERVISOR, "id"),
                Server,
                SERVER,
                'ee662ff5-3de6-46cb-8b85-4eb4317beb7c',
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
                'fa:16:3e:00:11:22',
                partial(dictassign, INTERFACE, "mac_addr"),
                Port,
                PORT,
                'f3f6cd1a-b199-4d67-9266-8d69ac1fb46b',
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
        # Test identity method.
        self.assertEqual(Keypair.identity(KEYPAIR),
                         'fa:73:23:78:1f:8c:10:bb:25:0f:6f:5e:25:62:14:c7')
        self.assertEqual(Server.identity(SERVER),
                         'ee662ff5-3de6-46cb-8b85-4eb4317beb7c')

        # Test edge discovery.
        edges = resource_types.graph.out_edges(Keypair, data=True)
        edge = [x for x in edges if x[1] == Server][0][2]

        # Test the keypair being None
        dictassign(KEYPAIR, "fingerprint", None)
        self.assertFalse(edge[MATCHING_FN](KEYPAIR, SERVER))

        # Test both being None
        dictassign(SERVER, "OS-EXT-SRV-ATTR:hypervisor_hostname", None)
        self.assertFalse(edge[MATCHING_FN](KEYPAIR, SERVER))

        # Test match
        dictassign(KEYPAIR, "fingerprint", "4445")
        dictassign(SERVER, "OS-EXT-SRV-ATTR:hypervisor_hostname", "4445")
        self.assertTrue(edge[MATCHING_FN](KEYPAIR, SERVER))

    @staticmethod
    def test_server_interface():
        """Test the Server - Interface entry."""

        # Test data.
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

        INTERFACE = {u'fixed_ips':
                     [{u'ip_address': u'192.168.1.111',
                       u'subnet_id': u'623ed5a0-785b-4a8a-94a1-a96dd8679f1c'}],
                     u'mac_addr': u'fa:16:3e:00:11:22',
                     u'net_id': u'fa4684fa-7243-45bf-aac5-0a3db0c210b1',
                     u'port_id': u'f3f6cd1a-b199-4d67-9266-8d69ac1fb46b',
                     u'port_state': u'ACTIVE'}

        def serverassign(value):
            """Store value into the server dict's matching attribute."""

            SERVER["addresses"]["demo-net"][0]["OS-EXT-IPS-MAC:mac_addr"] = \
                value

        do_test(Server,
                SERVER,
                'ee662ff5-3de6-46cb-8b85-4eb4317beb7c',
                serverassign,
                Interface,
                INTERFACE,
                'fa:16:3e:00:11:22',
                partial(dictassign, INTERFACE, "mac_addr"))
