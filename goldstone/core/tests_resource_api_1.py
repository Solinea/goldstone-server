"""Resource type graph API unit tests.

Tests:
    /core/resource_types/
    /core/resource_types/unique_id/

"""
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
from goldstone.core.models import Host, AvailabilityZone, Hypervisor, \
    Aggregate, Server, Project, Network, Limits

from goldstone.core import resource
from goldstone.core.resource import Types, GraphNode
from goldstone.test_utils import Setup, create_and_login, \
    AUTHORIZATION_PAYLOAD
import json
from mock import patch
from rest_framework.status import HTTP_200_OK, HTTP_404_NOT_FOUND, \
    HTTP_401_UNAUTHORIZED

# Aliases to make the Resource Graph definitions less verbose.
TYPE = settings.R_ATTRIBUTE.TYPE

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

# URLs for the tests.
RESTYPE_URL = "/core/resource_types/"
RESTYPE_DETAIL_URL = RESTYPE_URL + "%s/"


class CoreResourceTypes(Setup):
    """Test /core/resource_types/."""

    def test_empty(self):
        """The resource types graph is empty."""

        # Create a user.
        token = create_and_login()

        # Mock out resource_types so that it has no nodes or edges.
        mock_rt_graph = Types()
        mock_rt_graph.graph.clear()

        with patch("goldstone.core.views.types", mock_rt_graph):
            response = self.client.get(
                RESTYPE_URL,
                HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        # Test the result.
        # pylint: disable=E1101
        self.assertEqual(response.status_code, HTTP_200_OK)
        self.assertEqual(json.loads(response.content),
                         {"nodes": [], "edges": []})

    def test_mix(self):
        """The resource type graph is populated with a mixture of types, some
        of which are not present in the resource graph."""

        # The resource graph nodes in this test. Each entry is (resource_type,
        # native_id, native_name, attributes). We don't create edges for these
        # nodes, because the code paths being tested don't need the edges in
        # the resource graph.
        NODES = [(Host, "1234", "host 0", {"quality": "poor"}),
                 (Host, "12345", "host 1", {"quality": "good"}),
                 (Host, "123456", "host 2", {"quality": "poor"}),
                 (AvailabilityZone,
                  "a1",
                  "availabilityzone 0",
                  {"quality": "poor"}),
                 (AvailabilityZone,
                  "a2",
                  "availabilityzone 1",
                  {"quality": "good"}),
                 (AvailabilityZone,
                  "a3",
                  "availabiltiyzone 2",
                  {"quality": "poor"}),
                 (Hypervisor, "f234", "hypervisor 0", {"quality": "poor"}),
                 (Hypervisor, "f2345", "hypervisor 0", {"quality": "poor"}),
                 (Hypervisor, "f23456", "hypervisor 0", {"quality": "good"}),
                 (Aggregate, "dead1", "aggregate 0", {"quality": "poor"}),
                 (Aggregate, "dead2", "aggregate 1", {"quality": "good"}),
                 (Server, "beef1", "server 1", {"quality": "good"}),
                 (Server, "beef2", "server 2", {"quality": "good"}),
                 (Project, "p0", "project 0", {"quality": "poor"}),
                 (Project, "p1", "project 1", {"quality": "poor"}),
                 (Project, "p2", "project 2", {"quality": "good"}),
                 (Network, "n1234", "network 0", {"quality": "good"}),
                 (Network, "n12345", "network 1", {"quality": "good"}),
                 (Limits, "l1234", "limits 0", {"quality": "good"}),
                 (Limits, "l12345", "limits 1", {"quality": "good"}),
                 (Limits, "l123456", "limits 2", {"quality": "good"}),
                 ]

        # Expected test results.
        EXPECTED = [{u'display_attributes': {u'name': u'Host',
                                             u'integration_name': u'Nova'},
                     u'present': True,
                     u'unique_id': u"<class 'goldstone.core.models.Host'>"},
                    {u'display_attributes': {u'name': u'Region',
                                             u'integration_name': u'Keystone'},
                     u'present': False,
                     u'unique_id': u"<class 'goldstone.core.models.Region'>"},
                    {u'display_attributes': {u'name': u'Floating IP Pool',
                                             u'integration_name': u'Neutron'},
                     u'present': False,
                     u'unique_id':
                     u"<class 'goldstone.core.models.FloatingIPPool'>"},
                    {u'display_attributes': {u'name': u'Group',
                                             u'integration_name': u'Keystone'},
                     u'present': False,
                     u'unique_id': u"<class 'goldstone.core.models.Group'>"},
                    {u'display_attributes': {u'name': u'Flavor',
                                             u'integration_name': u'Nova'},
                     u'present': False,
                     u'unique_id': u"<class 'goldstone.core.models.Flavor'>"},
                    {u'display_attributes': {u'name': u'LB Virtual IP',
                                             u'integration_name': u'Neutron'},
                     u'present': False,
                     u'unique_id': u"<class 'goldstone.core.models.LBVIP'>"},
                    {u'display_attributes': {u'name': u'Floating IP address',
                                             u'integration_name': u'Neutron'},
                     u'present': False,
                     u'unique_id':
                     u"<class 'goldstone.core.models.FloatingIP'>"},
                    {u'display_attributes': {u'name': u'Hypervisor',
                                             u'integration_name': u'Nova'},
                     u'present': True,
                     u'unique_id':
                     u"<class 'goldstone.core.models.Hypervisor'>"},
                    {u'display_attributes': {u'name': u'Server',
                                             u'integration_name': u'Nova'},
                     u'present': True,
                     u'unique_id': u"<class 'goldstone.core.models.Server'>"},
                    {u'display_attributes': {u'name': u'Project',
                                             u'integration_name': u'Keystone'},
                     u'present': True,
                     u'unique_id': u"<class 'goldstone.core.models.Project'>"},
                    {u'display_attributes': {u'name': u'Fixed IP address',
                                             u'integration_name': u'Neutron'},
                     u'present': False,
                     u'unique_id': u"<class 'goldstone.core.models.FixedIP'>"},
                    {u'display_attributes': {u'name': u'Router',
                                             u'integration_name': u'Neutron'},
                     u'present': False,
                     u'unique_id': u"<class 'goldstone.core.models.Router'>"},
                    {u'display_attributes': {u'name': u'User',
                                             u'integration_name': u'Keystone'},
                     u'present': False,
                     u'unique_id': u"<class 'goldstone.core.models.User'>"},
                    {u'display_attributes': {u'name': u'Remote Group',
                                             u'integration_name': u'Neutron'},
                     u'present': False,
                     u'unique_id':
                     u"<class 'goldstone.core.models.RemoteGroup'>"},
                    {u'display_attributes': {u'name': u'Limits',
                                             u'integration_name': u'Nova'},
                     u'present': False,
                     u'unique_id':
                     u"<class 'goldstone.core.models.NovaLimits'>"},
                    {u'display_attributes': {u'name': u'Port',
                                             u'integration_name': u'Neutron'},
                     u'present': False,
                     u'unique_id': u"<class 'goldstone.core.models.Port'>"},
                    {u'display_attributes': {u'name': u'Volume Type',
                                             u'integration_name': u'Cinder'},
                     u'present': False,
                     u'unique_id':
                     u"<class 'goldstone.core.models.VolumeType'>"},
                    {u'display_attributes': {u'name': u'Network',
                                             u'integration_name': u'Neutron'},
                     u'present': True,
                     u'unique_id': u"<class 'goldstone.core.models.Network'>"},
                    {u'display_attributes': {u'name': u'Limits',
                                             u'integration_name': u'Cinder'},
                     u'present': True,
                     u'unique_id': u"<class 'goldstone.core.models.Limits'>"},
                    {u'display_attributes': {u'name': u'Image',
                                             u'integration_name': u'Glance'},
                     u'present': False,
                     u'unique_id': u"<class 'goldstone.core.models.Image'>"},
                    {u'display_attributes': {u'name': u'Availability Zone',
                                             u'integration_name': u'Nova'},
                     u'present': True,
                     u'unique_id':
                     u"<class 'goldstone.core.models.AvailabilityZone'>"},
                    {u'display_attributes': {u'name': u'Subnet',
                                             u'integration_name': u'Neutron'},
                     u'present': False,
                     u'unique_id': u"<class 'goldstone.core.models.Subnet'>"},
                    {u'display_attributes': {u'name': u'Volume',
                                             u'integration_name': u'Cinder'},
                     u'present': False,
                     u'unique_id': u"<class 'goldstone.core.models.Volume'>"},
                    {u'display_attributes': {u'name': u'LB Pool',
                                             u'integration_name': u'Neutron'},
                     u'present': False,
                     u'unique_id': u"<class 'goldstone.core.models.LBPool'>"},
                    {u'display_attributes': {u'name': u'Domain',
                                             u'integration_name': u'Keystone'},
                     u'present': False,
                     u'unique_id': u"<class 'goldstone.core.models.Domain'>"},
                    {u'display_attributes': {u'name': u'Metering Label',
                                             u'integration_name': u'Neutron'},
                     u'present': False,
                     u'unique_id':
                     u"<class 'goldstone.core.models.MeteringLabel'>"},
                    {u'display_attributes': {u'name': u'Metering Label Rule',
                                             u'integration_name': u'Neutron'},
                     u'present': False,
                     u'unique_id':
                     u"<class 'goldstone.core.models.MeteringLabelRule'>"},
                    {u'display_attributes': {u'name': u'Token',
                                             u'integration_name': u'Keystone'},
                     u'present': False,
                     u'unique_id': u"<class 'goldstone.core.models.Token'>"},
                    {u'display_attributes': {u'name': u'Security Rules',
                                             u'integration_name': u'Neutron'},
                     u'present': False,
                     u'unique_id':
                     u"<class 'goldstone.core.models.SecurityRules'>"},
                    {u'display_attributes': {u'name': u'Keypair',
                                             u'integration_name': u'Nova'},
                     u'present': False,
                     u'unique_id': u"<class 'goldstone.core.models.Keypair'>"},
                    {u'display_attributes': {u'name': u'Server Group',
                                             u'integration_name': u'Nova'},
                     u'present': False,
                     u'unique_id':
                     u"<class 'goldstone.core.models.ServerGroup'>"},
                    {u'display_attributes': {u'name': u'Role',
                                             u'integration_name': u'Keystone'},
                     u'present': False,
                     u'unique_id': u"<class 'goldstone.core.models.Role'>"},
                    {u'display_attributes': {u'name': u'Quota Set',
                                             u'integration_name': u'Cinder'},
                     u'present': False,
                     u'unique_id':
                     u"<class 'goldstone.core.models.QuotaSet'>"},
                    {u'display_attributes': {u'name': u'Service',
                                             u'integration_name': u'Keystone'},
                     u'present': False,
                     u'unique_id': u"<class 'goldstone.core.models.Service'>"},
                    {u'display_attributes': {u'name': u'LB Member',
                                             u'integration_name': u'Neutron'},
                     u'present': False,
                     u'unique_id':
                     u"<class 'goldstone.core.models.LBMember'>"},
                    {u'display_attributes': {u'name': u'Snapshot',
                                             u'integration_name': u'Cinder'},
                     u'present': False,
                     u'unique_id':
                     u"<class 'goldstone.core.models.Snapshot'>"},
                    {u'display_attributes': {u'name': u'Aggregate',
                                             u'integration_name': u'Nova'},
                     u'present': True,
                     u'unique_id':
                     u"<class 'goldstone.core.models.Aggregate'>"},
                    {u'display_attributes': {u'name': u'Cloudpipe',
                                             u'integration_name': u'Nova'},
                     u'present': False,
                     u'unique_id':
                     u"<class 'goldstone.core.models.Cloudpipe'>"},
                    {u'display_attributes': {u'name': u'Quota',
                                             u'integration_name': u'Neutron'},
                     u'present': False,
                     u'unique_id':
                     u"<class 'goldstone.core.models.NeutronQuota'>"},
                    {u'display_attributes': {u'name': u'Credential',
                                             u'integration_name': u'Keystone'},
                     u'present': False,
                     u'unique_id':
                     u"<class 'goldstone.core.models.Credential'>"},
                    {u'display_attributes': {u'name': u'Security Group',
                                             u'integration_name': u'Neutron'},
                     u'present': False,
                     u'unique_id':
                     u"<class 'goldstone.core.models.SecurityGroup'>"},
                    {u'display_attributes': {u'name': u'Endpoint',
                                             u'integration_name': u'Keystone'},
                     u'present': False,
                     u'unique_id':
                     u"<class 'goldstone.core.models.Endpoint'>"},
                    {u'display_attributes': {u'name': u'Health Monitor',
                                             u'integration_name': u'Neutron'},
                     u'present': False,
                     u'unique_id':
                     u"<class 'goldstone.core.models.HealthMonitor'>"},
                    {u'display_attributes': {u'name': u'QoS Spec',
                                             u'integration_name': u'Cinder'},
                     u'present': False,
                     u'unique_id':
                     u"<class 'goldstone.core.models.QOSSpec'>"},
                    {u'display_attributes': {u'name': u'Interface',
                                             u'integration_name': u'Nova'},
                     u'present': False,
                     u'unique_id':
                     u"<class 'goldstone.core.models.Interface'>"},
                    {u'display_attributes': {u'name': u'Add-on',
                                             u'integration_name': u'Add-on'},
                     u'present': False,
                     u'unique_id':
                     u"<class 'goldstone.core.models.Addon'>"},
                    ]

        # Create the nodes for the test.
        for nodetype, native_id, native_name, attributes in NODES:
            if nodetype == Host:
                db_node = nodetype.objects.create(native_id=native_id,
                                                  native_name=native_name,
                                                  fqdn=native_name+".com")
            else:
                db_node = nodetype.objects.create(native_id=native_id,
                                                  native_name=native_name)

            resource.instances.graph.add_node(GraphNode(uuid=db_node.uuid,
                                                        resourcetype=nodetype,
                                                        attributes=attributes))

        # Create a user, do the test.
        token = create_and_login()
        response = self.client.get(
            RESTYPE_URL,
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        # Test the result.
        # pylint: disable=E1101
        self.assertEqual(response.status_code, HTTP_200_OK)

        # Python 2.6 doesn't have assertListEqual(), so do this the hard way.
        EXPECTED.sort()
        content = json.loads(response.content)["nodes"]
        content.sort()

        for item in EXPECTED:
            self.assertTrue(item in content)


class CoreResourceTypesDetail(Setup):
    """Test /core/resource_types/<unique_id>/."""

    def test_empty(self):
        """The resource types graph is empty."""

        # Create a user.
        token = create_and_login()

        # Mock out resource_types so that it has no nodes or edges.
        mock_rt_graph = Types()
        mock_rt_graph.graph.clear()

        # Note, we ask for a resource type that normally exists.
        with patch("goldstone.core.views.types", mock_rt_graph):
            response = self.client.get(
                RESTYPE_DETAIL_URL % "<class 'goldstone.core.models.QOSSpec'>",
                HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        # Test the result.
        self.assertContains(response,
                            '{"nodes":[]}',
                            status_code=HTTP_404_NOT_FOUND)

    def test_not_found(self):
        """The desired resource type isn't in the graph."""

        # The resource graph nodes in this test. Each entry is (resource_type,
        # native_id, native_name, attributes). We don't create edges for these
        # nodes, because the code paths being tested don't need the edges in
        # the resource graph.
        NODES = [(Host, "1234", "host 0", {"quality": "poor"}),
                 (Host, "12345", "host 1", {"quality": "good"}),
                 (Host, "123456", "host 2", {"quality": "poor"}),
                 ]

        # Create the nodes for the test.
        for nodetype, native_id, native_name, attributes in NODES:
            if nodetype == Host:
                db_node = nodetype.objects.create(native_id=native_id,
                                                  native_name=native_name,
                                                  fqdn=native_name+".com")
            else:
                db_node = nodetype.objects.create(native_id=native_id,
                                                  native_name=native_name)

            resource.instances.graph.add_node(GraphNode(uuid=db_node.uuid,
                                                        resourcetype=nodetype,
                                                        attributes=attributes))

        # Create a user, do the test.
        token = create_and_login()
        response = self.client.get(
            RESTYPE_DETAIL_URL % "<class 'goldstone.core.models.User'>",
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        # Test the result.
        self.assertContains(response,
                            '{"nodes":[]}',
                            status_code=HTTP_404_NOT_FOUND)

    def test_mix(self):
        """The desired resource type is in the graph."""

        # The resource graph nodes in this test. Each entry is (resource_type,
        # native_id, native_name, attributes). We don't create edges for these
        # nodes, because the code paths being tested don't need the edges in
        # the resource graph.
        NODES = [(Host, "1234", "host 0", {"quality": "poor"}),
                 (Host, "12345", "host 1", {"quality": "good"}),
                 (Host, "123456", "host 2", {"quality": "poor"}),
                 (AvailabilityZone,
                  "a1",
                  "availabilityzone 0",
                  {"quality": "poor"}),
                 (AvailabilityZone,
                  "a2",
                  "availabilityzone 1",
                  {"quality": "good"}),
                 (AvailabilityZone,
                  "a3",
                  "availabiltiyzone 2",
                  {"quality": "poor"}),
                 (Hypervisor, "f234", "hypervisor 0", {"quality": "poor"}),
                 (Hypervisor, "f2345", "hypervisor 0", {"quality": "poor"}),
                 (Hypervisor, "f23456", "hypervisor 0", {"quality": "good"}),
                 (Aggregate, "dead1", "aggregate 0", {"quality": "poor"}),
                 (Aggregate, "dead2", "aggregate 1", {"quality": "good"}),
                 (Server, "beef1", "server 1", {"quality": "good"}),
                 (Server, "beef2", "server 2", {"quality": "good"}),
                 (Project, "p0", "project 0", {"quality": "poor"}),
                 (Project, "p1", "project 1", {"quality": "poor"}),
                 (Project, "p2", "project 2", {"quality": "good"}),
                 (Network, "n1234", "network 0", {"quality": "good"}),
                 (Network, "n12345", "network 1", {"quality": "good"}),
                 (Limits, "l1234", "limits 0", {"quality": "good"}),
                 (Limits, "l12345", "limits 1", {"quality": "good"}),
                 (Limits, "l123456", "limits 2", {"quality": "good"}),
                 ]

        # Expected test results, without the uuids.
        EXPECTED = [{u'attributes': {u'quality': u'good'},
                     u'native_id': u'p2',
                     u'native_name': u'project 2'},
                    {u'attributes': {u'quality': u'poor'},
                     u'native_id': u'p0',
                     u'native_name': u'project 0'},
                    {u'attributes': {u'quality': u'poor'},
                     u'native_id': u'p1',
                     u'native_name': u'project 1'},
                    ]

        # Create the nodes for the test.
        for nodetype, native_id, native_name, attributes in NODES:
            if nodetype == Host:
                db_node = nodetype.objects.create(native_id=native_id,
                                                  native_name=native_name,
                                                  fqdn=native_name+".com")
            else:
                db_node = nodetype.objects.create(native_id=native_id,
                                                  native_name=native_name)

            resource.instances.graph.add_node(GraphNode(uuid=db_node.uuid,
                                                        resourcetype=nodetype,
                                                        attributes=attributes))

        # Create a user, do the test.
        token = create_and_login()
        response = self.client.get(
            RESTYPE_DETAIL_URL % "<class 'goldstone.core.models.Project'>",
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        # Test the result.
        # pylint: disable=E1101
        self.assertEqual(response.status_code, HTTP_200_OK)

        # Python 2.6 doesn't have assertListEqual(), so do this the hard way.
        EXPECTED.sort()

        content = json.loads(response.content)["nodes"]
        for entry in content:
            del entry["uuid"]
        content.sort()

        self.assertEqual(content, EXPECTED)


class AuthToken(Setup):
    """Test authorization token expiration."""

    def test_expiration(self):
        """The authorization tokens expire."""
        from .tasks import expire_auth_tokens

        # Create a user.
        token = create_and_login()

        # Confirm we can make an API call now.
        # Mock out resource_types so that it has no nodes or edges.
        mock_rt_graph = Types()
        mock_rt_graph.graph.clear()

        with patch("goldstone.core.views.types", mock_rt_graph):
            response = self.client.get(
                RESTYPE_URL,
                HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        # pylint: disable=E1101
        self.assertEqual(response.status_code, HTTP_200_OK)

        # Call the token-expiration task, then try to do an API call again. It
        # should fail because of the tokens' expiration.
        expire_auth_tokens()

        with patch("goldstone.core.views.types", mock_rt_graph):
            response = self.client.get(
                RESTYPE_URL,
                HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        self.assertEqual(response.status_code, HTTP_401_UNAUTHORIZED)
