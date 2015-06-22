"""Resource and resource type graph API unit tests.

Tests:
    /core/resource_types/
    /core/resource_types/unique_id/
    /core/resources/
    /core/resources/uuid/

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
    Aggregate, Server, Project, Network, Limits, PolyResource

from goldstone.core import resource         # For resource.instances.
from goldstone.core.resource import ResourceTypes, Instances, GraphNode
from goldstone.test_utils import Setup, create_and_login, \
    AUTHORIZATION_PAYLOAD, BAD_UUID
import json
from mock import patch
from rest_framework.status import HTTP_200_OK, HTTP_404_NOT_FOUND

# Aliases to make the Resource Graph definitions less verbose.
TO = settings.R_ATTRIBUTE.TO
TYPE = settings.R_ATTRIBUTE.TYPE
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

# URLs for the tests.
RESTYPE_URL = "/core/resource_types/"
RESTYPE_DETAIL_URL = RESTYPE_URL + "%s/"
RES_URL = "/core/resources/"
RES_DETAIL_URL = RES_URL + "%s/"


class CoreResourceTypes(Setup):
    """Test /core/resource_types/."""

    def test_empty(self):
        """The resource types graph is empty."""

        # Create a user.
        token = create_and_login()

        # Mock out resource_types so that it has no nodes or edges.
        mock_rt_graph = ResourceTypes()
        mock_rt_graph.graph.clear()

        with patch("goldstone.core.views.resource.types", mock_rt_graph):
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
        self.assertEqual(content, EXPECTED)


class CoreResourceTypesDetail(Setup):
    """Test /core/resource_types/<unique_id>/."""

    def test_empty(self):
        """The resource types graph is empty."""

        # Create a user.
        token = create_and_login()

        # Mock out resource_types so that it has no nodes or edges.
        mock_rt_graph = ResourceTypes()
        mock_rt_graph.graph.clear()

        # Note, we ask for a resource type that normally exists.
        with patch("goldstone.core.views.resource.types", mock_rt_graph):
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


class CoreResources(Setup):
    """Test /core/resources/."""

    def test_empty(self):
        """The resource graph is empty."""

        # Create a user.
        token = create_and_login()

        # Mock out resources so that it has no nodes or edges.
        mock_r_graph = Instances()
        mock_r_graph.graph.clear()

        with patch("goldstone.core.views.resource.instances", mock_r_graph):
            response = self.client.get(
                RES_URL,
                HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        # Test the result.
        # pylint: disable=E1101
        self.assertEqual(response.status_code, HTTP_200_OK)
        self.assertEqual(json.loads(response.content),
                         {"nodes": [], "edges": []})

    def test_mix(self):
        """The resource graph is populated with a mixture of nodes."""

        # pylint: disable=R0914

        # The resource graph nodes in this test. Each entry is (resource_type,
        # native_id, native_name, attributes).
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

        # The resource graph edges in this test. Each entry is (from, to,
        # attributes). The edge attributes here are meaningless.
        EDGES = [
            # Hosts
            ("1234", "dead1", {TYPE: ALLOCATED_TO}),
            ("1234", "f2345", {TYPE: APPLIES_TO}),
            ("1234", "f23456", {TYPE: ASSIGNED_TO}),
            # Availablity Zones
            ("a3", "dead2", {TYPE: CONSUMES}),
            ("a2", "123456", {TYPE: CONTAINS}),
            # Hypervisors
            ("f23456", "beef2", {TYPE: DEFINES}),
            # Projects
            ("p1", "n1234", {TYPE: INSTANCE_OF}),
            ("p1", "n12345", {TYPE: MANAGES}),
            ("p2", "n1234", {TYPE: MEMBER_OF}),
            ("p2", "n12345", {TYPE: OWNS}),
            ("p0", "l1234", {TYPE: ROUTES_TO}),
            ("p0", "l12345", {TYPE: SUBSCRIBED_TO}),
            ("p0", "l123456", {TYPE: USES}),
            ("p2", "l1234", {TYPE: ALLOCATED_TO}),
            ("p2", "l12345", {TYPE: APPLIES_TO}),
            ("p2", "l123456", {TYPE: ASSIGNED_TO}),
        ]

        # Expected node results, sans UUIDs.
        EXPECTED_NODES = [{u'native_id': u'p2',
                           u'native_name': u'project 2',
                           u'resourcetype':
                           {u'name': u'Project',
                            u'unique_id':
                            u"<class 'goldstone.core.models.Project'>"},
                           },
                          {u'native_id': u'beef2',
                           u'native_name': u'server 2',
                           u'resourcetype':
                           {u'name': u'Server',
                            u'unique_id':
                            u"<class 'goldstone.core.models.Server'>"},
                           },
                          {u'native_id': u'beef1',
                           u'native_name': u'server 1',
                           u'resourcetype':
                           {u'name': u'Server',
                            u'unique_id':
                            u"<class 'goldstone.core.models.Server'>"},
                           },
                          {u'native_id': u'a2',
                           u'native_name': u'availabilityzone 1',
                           u'resourcetype':
                           {u'name': u'Availability Zone',
                            u'unique_id':
                            u"<class 'goldstone.core.models.AvailabilityZone'>"
                            },
                           },
                          {u'native_id': u'12345',
                           u'native_name': u'host 1',
                           u'resourcetype':
                           {u'name': u'Host',
                            u'unique_id':
                            u"<class 'goldstone.core.models.Host'>"},
                           },
                          {u'native_id': u'p1',
                           u'native_name': u'project 1',
                           u'resourcetype':
                           {u'name': u'Project',
                            u'unique_id':
                            u"<class 'goldstone.core.models.Project'>"},
                           },
                          {u'native_id': u'1234',
                           u'native_name': u'host 0',
                           u'resourcetype':
                           {u'name': u'Host',
                            u'unique_id':
                            u"<class 'goldstone.core.models.Host'>"},
                           },
                          {u'native_id': u'l123456',
                           u'native_name': u'limits 2',
                           u'resourcetype':
                           {u'name': u'Limits',
                            u'unique_id':
                            u"<class 'goldstone.core.models.Limits'>"},
                           },
                          {u'native_id': u'dead1',
                           u'native_name': u'aggregate 0',
                           u'resourcetype':
                           {u'name': u'Aggregate',
                            u'unique_id':
                            u"<class 'goldstone.core.models.Aggregate'>"},
                           },
                          {u'native_id': u'dead2',
                           u'native_name': u'aggregate 1',
                           u'resourcetype':
                           {u'name': u'Aggregate',
                            u'unique_id':
                            u"<class 'goldstone.core.models.Aggregate'>"},
                           },
                          {u'native_id': u'f23456',
                           u'native_name': u'hypervisor 0',
                           u'resourcetype':
                           {u'name': u'Hypervisor',
                            u'unique_id':
                            u"<class 'goldstone.core.models.Hypervisor'>"},
                           },
                          {u'native_id': u'p0',
                           u'native_name': u'project 0',
                           u'resourcetype':
                           {u'name': u'Project',
                            u'unique_id':
                            u"<class 'goldstone.core.models.Project'>"},
                           },
                          {u'native_id': u'f2345',
                           u'native_name': u'hypervisor 0',
                           u'resourcetype':
                           {u'name': u'Hypervisor',
                            u'unique_id':
                            u"<class 'goldstone.core.models.Hypervisor'>"},
                           },
                          {u'native_id': u'n12345',
                           u'native_name': u'network 1',
                           u'resourcetype':
                           {u'name': u'Network',
                            u'unique_id':
                            u"<class 'goldstone.core.models.Network'>"},
                           },
                          {u'native_id': u'a1',
                           u'native_name': u'availabilityzone 0',
                           u'resourcetype':
                           {u'name': u'Availability Zone',
                            u'unique_id':
                            u"<class 'goldstone.core.models.AvailabilityZone'>"
                            },
                           },
                          {u'native_id': u'n1234',
                           u'native_name': u'network 0',
                           u'resourcetype':
                           {u'name': u'Network',
                            u'unique_id':
                            u"<class 'goldstone.core.models.Network'>"},
                           },
                          {u'native_id': u'123456',
                           u'native_name': u'host 2',
                           u'resourcetype':
                           {u'name': u'Host',
                            u'unique_id':
                            u"<class 'goldstone.core.models.Host'>"},
                           },
                          {u'native_id': u'l12345',
                           u'native_name': u'limits 1',
                           u'resourcetype':
                           {u'name': u'Limits',
                            u'unique_id':
                            u"<class 'goldstone.core.models.Limits'>"},
                           },
                          {u'native_id': u'l1234',
                           u'native_name': u'limits 0',
                           u'resourcetype':
                           {u'name': u'Limits',
                            u'unique_id':
                            u"<class 'goldstone.core.models.Limits'>"},
                           },
                          {u'native_id': u'f234',
                           u'native_name': u'hypervisor 0',
                           u'resourcetype':
                           {u'name': u'Hypervisor',
                            u'unique_id':
                            u"<class 'goldstone.core.models.Hypervisor'>"},
                           },
                          {u'native_id': u'a3',
                           u'native_name': u'availabiltiyzone 2',
                           u'resourcetype':
                           {u'name': u'Availability Zone',
                            u'unique_id':
                            u"<class 'goldstone.core.models.AvailabilityZone'>"
                            },
                           },
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

        # Create the edges for the test.
        for source_id, destination_id, attr_dict in EDGES:
            # Locate the source and destination nodes in the resource graph.
            source_row = PolyResource.objects.get(native_id=source_id)
            destination_row = \
                PolyResource.objects.get(native_id=destination_id)

            source_node = [x for x in resource.instances.graph.nodes()
                           if x.uuid == source_row.uuid][0]
            destination_node = [x for x in resource.instances.graph.nodes()
                                if x.uuid == destination_row.uuid][0]

            resource.instances.graph.add_edge(source_node,
                                              destination_node,
                                              attr_dict=attr_dict)

        # Create a user, do the test.
        token = create_and_login()

        response = self.client.get(
            RES_URL,
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        # Test the results.
        # pylint: disable=E1101
        self.assertEqual(response.status_code, HTTP_200_OK)

        # Test the result's edges.
        content = json.loads(response.content)
        self.assertEqual(len(EDGES), len(content["edges"]))

        edge_types_uses = [x[2][TYPE] for x in EDGES]
        edge_types_actual = [x[TYPE] for x in content["edges"]]

        # For every edge attribute dictionary...
        for entry in set(edge_types_uses):
            # The count of this type used in this test must be found in the
            # response. This isn't a complete verification, but is good enough.
            self.assertEqual(edge_types_uses.count(entry),
                             edge_types_actual.count(entry))

        # Test the result's nodes, sans UUIDs.
        for entry in content["nodes"]:
            del entry["uuid"]

        # Python 2.6 doesn't have assertListEqual(), so do this the hard way.
        EXPECTED_NODES.sort()
        content["nodes"].sort()
        self.assertEqual(content["nodes"], EXPECTED_NODES)


class CoreResourcesDetail(Setup):
    """Test /core/resource/<unique_id>/."""

    def test_empty(self):
        """The resource graph is empty."""

        # Create a user.
        token = create_and_login()

        # The parent class' setUp() has alcread cleared the resource graph.
        # Mock out resources so that it has no nodes or edges.
        response = self.client.get(
            RES_DETAIL_URL % BAD_UUID,
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        # Test the result.
        self.assertContains(response, '{}', status_code=HTTP_404_NOT_FOUND)

    def test_not_found(self):
        """The desired resource isn't in the graph."""

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

        # Create a user.
        token = create_and_login()

        # Now do the test.
        response = self.client.get(
            RES_DETAIL_URL % BAD_UUID,
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        # Test the result.
        self.assertContains(response, '{}', status_code=HTTP_404_NOT_FOUND)

    def test_mix(self):
        """The desired resource is in the graph."""

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

        # Create a user.
        token = create_and_login()

        # Get the UUID of one of the nodes we just made, and calculate the
        # expected result. We deliberately do this crudely.
        response = self.client.get(
            RES_URL,
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        # pylint: disable=E1101
        uuid = json.loads(response.content)["nodes"][1]["uuid"]

        for node in resource.instances.graph.nodes():
            if node.uuid == uuid:
                break
        else:
            node = None      # Should never happen.

        row = PolyResource.objects.get(uuid=uuid)     # Should always succeed.

        expected = {"native_id": row.native_id,
                    "native_name": row.native_name,
                    "attributes": node.attributes}

        # Now we can do the test.
        response = self.client.get(
            RES_DETAIL_URL % uuid,
            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        self.assertEqual(response.status_code, HTTP_200_OK)
        self.assertEqual(json.loads(response.content), expected)
