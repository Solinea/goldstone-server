"""ResourceTypes unit tests, part 2."""
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
from django.test import SimpleTestCase
from functools import partial

from .models import ServerGroup, Server, Interface, Volume, QOSSpec, \
    VolumeType, Snapshot
from .tests_resource_types_1 import do_test, dictassign


class ResourceTypesTests(SimpleTestCase):
    """Test each entry in ResourceTypes.EDGES, in particular the matching_fn
    functions."""

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
                serverassign,
                Interface,
                INTERFACE,
                partial(dictassign, INTERFACE, "mac_addr"))

    @staticmethod
    def test_server_servergroup():
        """Test the Server - ServerGroup entry."""

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

        SERVERGROUP = {u'id': u'ef50ce1c-01a9-4b41-a1cb-3a60c84ae1dd',
                       u'members': [],
                       u'metadata': {},
                       u'name': u'derosa',
                       u'policies': [u'affinity']}

        def servergroupassign(value):
            """Store value into the servergroup dict's matching attribute."""

            SERVERGROUP["members"].append(value)

        do_test(Server,
                SERVER,
                partial(dictassign, SERVER, "hostId"),
                ServerGroup,
                SERVERGROUP,
                servergroupassign)

    @staticmethod
    def test_server_volume():
        """Test the Server - Volume entry."""

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

        VOLUME = {"id": "45baf976-c20a-4894-a7c3-c94b7376bf55",
                  "links": [
                      {"href":
                       "http://localhost:8776/v2/foobar/volumes/45baf976-c20a"
                       "-4894-a7c3-c94b7376bf55",
                       "rel": "self"},
                      {"href":
                       "http://localhost:8776/zippy/volumes/45baf976-c20a-489"
                       "4-a7c3-c94b7376bf55",
                       "rel": "bookmark"}
                  ],
                  "name": "vol-004",
                  }

        def serverassign(value):
            """Store value into the server dict's matching attribute."""

            SERVER["links"][1]["href"] = value

        def volumeassign(value):
            """Store value into the volume dict's matching attribute."""

            VOLUME["links"][0]["href"] = value

        do_test(Server,
                SERVER,
                serverassign,
                Volume,
                VOLUME,
                volumeassign)

    @staticmethod
    def test_qosspec_volumetype():
        """Test the QOS Spec - Volume Type entry."""

        # Test data.
        QOSSPEC = {"specs": {"availability": "100",
                             "numberOfFailures": "0"
                             },
                   "consumer": "back-end",
                   "name": "reliability-spec",
                   "id": "0388d6c6-d5d4-42a3-b289-95205c50dd15"
                   }

        VOLUME_TYPE = {"extra_specs": {"capabilities": "gpu"},
                       "id": "6685584b-1eac-4da6-b5c3-555430cf68ff",
                       "name": "SSD"
                       }

        def volumetypeassign(value):
            """Store value into the volume type dict's matching attribute."""

            VOLUME_TYPE["extra_specs"]["qos"] = value

        do_test(QOSSpec,
                QOSSPEC,
                partial(dictassign, QOSSPEC, "id"),
                VolumeType,
                VOLUME_TYPE,
                volumetypeassign)

    @staticmethod
    def test_volumetype_volume():
        """Test the Volume Type - Volume entry."""

        # Test data.
        VOLUME_TYPE = {"extra_specs": {"capabilities": "gpu"},
                       "id": "6685584b-1eac-4da6-b5c3-555430cf68ff",
                       "name": "SSD"
                       }

        VOLUME = {"status": "available",
                  "attachments": [],
                  "links": [
                      {"href":
                       "http://localhost:8776/v2/de/volumes/5aa119a8-d25b-"
                       "45a7-8d1b-88e127885635",
                       "rel": "self"},
                      {"href":
                       "http://localhost:8776/0c2ebae/volumes/5aa119a8-d25b-"
                       "45a7-8d1b-88e127885635",
                       "rel": "bookmark"}
                  ],
                  "availability_zone": "nova",
                  "bootable": "false",
                  "os-vol-host-attr:host": "ip-10-168-107-25",
                  "source_volid": None,
                  "snapshot_id": None,
                  "id": "5aa119a8-d25b-45a7-8d1b-88e127885635",
                  "description": "Super volume.",
                  "name": "vol-002",
                  "created_at": "2013-02-25T02:40:21.000000",
                  "volume_type": "None",
                  "os-vol-tenant-attr:tenant_id":
                  "0c2eba2c5af04d3f9e9d0d410b371fde",
                  "size": 1,
                  "metadata": {"contents": "not junk"}
                  }

        do_test(VolumeType,
                VOLUME_TYPE,
                partial(dictassign, VOLUME_TYPE, "id"),
                Volume,
                VOLUME,
                partial(dictassign, VOLUME, "volume_type"))

    @staticmethod
    def test_snapshot_volume():
        """Test the Snapshot - Volume entry."""

        # Test data.
        SNAPSHOT = {"status": "available",
                    "os-extended-snapshot-attributes:progress": "100%",
                    "description": "Daily backup",
                    "created_at": "2013-02-25T07:30:12.000000",
                    "metadata": {},
                    "volume_id": "5aa119a8-d25b-45a7-8d1b-88e127885635",
                    "os-extended-snapshot-attributes:project_id":
                    "0c2eba2c5af04d3f9e9d0d410b371fde",
                    "size": 30,
                    "id": "43f20e0e-2c2c-4770-9d4e-c3d769ae5470",
                    "name": "snap-001"}

        VOLUME = {"status": "available",
                  "attachments": [],
                  "links": [
                      {"href":
                       "http://localhost:8776/v2/de/volumes/5aa119a8-d25b-"
                       "45a7-8d1b-88e127885635",
                       "rel": "self"},
                      {"href":
                       "http://localhost:8776/0c2ebae/volumes/5aa119a8-d25b-"
                       "45a7-8d1b-88e127885635",
                       "rel": "bookmark"}
                  ],
                  "availability_zone": "nova",
                  "bootable": "false",
                  "os-vol-host-attr:host": "ip-10-168-107-25",
                  "source_volid": None,
                  "snapshot_id": None,
                  "id": "5aa119a8-d25b-45a7-8d1b-88e127885635",
                  "description": "Super volume.",
                  "name": "vol-002",
                  "created_at": "2013-02-25T02:40:21.000000",
                  "volume_type": "None",
                  "os-vol-tenant-attr:tenant_id":
                  "0c2eba2c5af04d3f9e9d0d410b371fde",
                  "size": 1,
                  "metadata": {"contents": "not junk"}
                  }

        do_test(Snapshot,
                SNAPSHOT,
                partial(dictassign, SNAPSHOT, "id"),
                Volume,
                VOLUME,
                partial(dictassign, VOLUME, "snapshot_id"))
