"""ResourceTypes unit tests, part 2."""
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
from .tests_resource_types_1 import do_test

# Using the latest version of django-polymorphic, a
# PolyResource.objects.all().delete() throws an IntegrityError exception. So
# when we need to clear the PolyResource table, we'll individually delete each
# subclass.
NODE_TYPES = [Image, ServerGroup, NovaLimits, Host, Aggregate, Cloudpipe, Port,
              Hypervisor, Project, Network, Server]

# Aliases to make the code less verbose
TYPE = settings.R_ATTRIBUTE.TYPE
MATCHING_FN = settings.R_ATTRIBUTE.MATCHING_FN


def _dictassign(thedict, key, value):
    """A callable that does thedict[key] = value."""

    thedict[key] = value


class ResourceTypesTests(SimpleTestCase):
    """Test each entry in ResourceTypes.EDGES, in particular the matching_fn
    functions."""

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
                'ee662ff5-3de6-46cb-8b85-4eb4317beb7c',
                partial(_dictassign, SERVER, "hostId"),
                ServerGroup,
                SERVERGROUP,
                'ef50ce1c-01a9-4b41-a1cb-3a60c84ae1dd',
                servergroupassign)
