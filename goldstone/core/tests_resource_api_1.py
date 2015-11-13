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

        with patch("goldstone.core.resource.types", mock_rt_graph):
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
        EXPECTED = [{u'label': u'hosts',
                     u'integration': u'Nova',
                     u'present': True,
                     u'unique_id': u"<class 'goldstone.core.models.Host'>"},
                    {u'label': u'regions',
                     u'integration': u'Keystone',
                     u'present': False,
                     u'unique_id': u"<class 'goldstone.core.models.Region'>"},
                    {u'label': u'floating ip pools',
                     u'integration': u'Neutron',
                     u'present': False,
                     u'unique_id':
                     u"<class 'goldstone.core.models.FloatingIPPool'>"},
                    {u'label': u'groups',
                     u'integration': u'Keystone',
                     u'present': False,
                     u'unique_id': u"<class 'goldstone.core.models.Group'>"},
                    {u'label': u'flavors',
                     u'integration': u'Nova',
                     u'present': False,
                     u'unique_id': u"<class 'goldstone.core.models.Flavor'>"},
                    {u'label': u'lb virtual ips',
                     u'integration': u'Neutron',
                     u'present': False,
                     u'unique_id': u"<class 'goldstone.core.models.LBVIP'>"},
                    {u'label': u'floating ip addresses',
                     u'integration': u'Neutron',
                     u'present': False,
                     u'unique_id':
                     u"<class 'goldstone.core.models.FloatingIP'>"},
                    {u'label': u'hypervisors',
                     u'integration': u'Nova',
                     u'present': True,
                     u'unique_id':
                     u"<class 'goldstone.core.models.Hypervisor'>"},
                    {u'label': u'servers',
                     u'integration': u'Nova',
                     u'present': True,
                     u'unique_id': u"<class 'goldstone.core.models.Server'>"},
                    {u'label': u'projects',
                     u'integration': u'Keystone',
                     u'present': True,
                     u'unique_id': u"<class 'goldstone.core.models.Project'>"},
                    {u'label': u'fixed ip addresses',
                     u'integration': u'Neutron',
                     u'present': False,
                     u'unique_id': u"<class 'goldstone.core.models.FixedIP'>"},
                    {u'label': u'routers',
                     u'integration': u'Neutron',
                     u'present': False,
                     u'unique_id': u"<class 'goldstone.core.models.Router'>"},
                    {u'label': u'users',
                     u'integration': u'Keystone',
                     u'present': False,
                     u'unique_id': u"<class 'goldstone.core.models.User'>"},
                    {u'label': u'remote groups',
                     u'integration': u'Neutron',
                     u'present': False,
                     u'unique_id':
                     u"<class 'goldstone.core.models.RemoteGroup'>"},
                    {u'label': u'limits',
                     u'integration': u'Nova',
                     u'present': False,
                     u'unique_id':
                     u"<class 'goldstone.core.models.NovaLimits'>"},
                    {u'label': u'ports',
                     u'integration': u'Neutron',
                     u'present': False,
                     u'unique_id': u"<class 'goldstone.core.models.Port'>"},
                    {u'label': u'volume types',
                     u'integration': u'Cinder',
                     u'present': False,
                     u'unique_id':
                     u"<class 'goldstone.core.models.VolumeType'>"},
                    {u'label': u'networks',
                     u'integration': u'Neutron',
                     u'present': True,
                     u'unique_id': u"<class 'goldstone.core.models.Network'>"},
                    {u'label': u'limits',
                     u'integration': u'Cinder',
                     u'present': True,
                     u'unique_id': u"<class 'goldstone.core.models.Limits'>"},
                    {u'label': u'images',
                     u'integration': u'Glance',
                     u'present': False,
                     u'unique_id': u"<class 'goldstone.core.models.Image'>"},
                    {u'label': u'availability zones',
                     u'integration': u'Nova',
                     u'present': True,
                     u'unique_id':
                     u"<class 'goldstone.core.models.AvailabilityZone'>"},
                    {u'label': u'subnets',
                     u'integration': u'Neutron',
                     u'present': False,
                     u'unique_id': u"<class 'goldstone.core.models.Subnet'>"},
                    {u'label': u'volumes',
                     u'integration': u'Cinder',
                     u'present': False,
                     u'unique_id': u"<class 'goldstone.core.models.Volume'>"},
                    {u'label': u'lb pools',
                     u'integration': u'Neutron',
                     u'present': False,
                     u'unique_id': u"<class 'goldstone.core.models.LBPool'>"},
                    {u'label': u'domains',
                     u'integration': u'Keystone',
                     u'present': False,
                     u'unique_id': u"<class 'goldstone.core.models.Domain'>"},
                    {u'label': u'metering labels',
                     u'integration': u'Neutron',
                     u'present': False,
                     u'unique_id':
                     u"<class 'goldstone.core.models.MeteringLabel'>"},
                    {u'label': u'metering label rules',
                     u'integration': u'Neutron',
                     u'present': False,
                     u'unique_id':
                     u"<class 'goldstone.core.models.MeteringLabelRule'>"},
                    {u'label': u'tokens',
                     u'integration': u'Keystone',
                     u'present': False,
                     u'unique_id': u"<class 'goldstone.core.models.Token'>"},
                    {u'label': u'security rules',
                     u'integration': u'Neutron',
                     u'present': False,
                     u'unique_id':
                     u"<class 'goldstone.core.models.SecurityRules'>"},
                    {u'label': u'keypairs',
                     u'integration': u'Nova',
                     u'present': False,
                     u'unique_id': u"<class 'goldstone.core.models.Keypair'>"},
                    {u'label': u'server groups',
                     u'integration': u'Nova',
                     u'present': False,
                     u'unique_id':
                     u"<class 'goldstone.core.models.ServerGroup'>"},
                    {u'label': u'roles',
                     u'integration': u'Keystone',
                     u'present': False,
                     u'unique_id': u"<class 'goldstone.core.models.Role'>"},
                    {u'label': u'quota sets',
                     u'integration': u'Cinder',
                     u'present': False,
                     u'unique_id':
                     u"<class 'goldstone.core.models.QuotaSet'>"},
                    {u'label': u'services',
                     u'integration': u'Keystone',
                     u'present': False,
                     u'unique_id': u"<class 'goldstone.core.models.Service'>"},
                    {u'label': u'lb members',
                     u'integration': u'Neutron',
                     u'present': False,
                     u'unique_id':
                     u"<class 'goldstone.core.models.LBMember'>"},
                    {u'label': u'snapshots',
                     u'integration': u'Cinder',
                     u'present': False,
                     u'unique_id':
                     u"<class 'goldstone.core.models.Snapshot'>"},
                    {u'label': u'aggregates',
                     u'integration': u'Nova',
                     u'present': True,
                     u'unique_id':
                     u"<class 'goldstone.core.models.Aggregate'>"},
                    {u'label': u'cloudpipes',
                     u'integration': u'Nova',
                     u'present': False,
                     u'unique_id':
                     u"<class 'goldstone.core.models.Cloudpipe'>"},
                    {u'label': u'quotas',
                     u'integration': u'Neutron',
                     u'present': False,
                     u'unique_id':
                     u"<class 'goldstone.core.models.NeutronQuota'>"},
                    {u'label': u'credentials',
                     u'integration': u'Keystone',
                     u'present': False,
                     u'unique_id':
                     u"<class 'goldstone.core.models.Credential'>"},
                    {u'label': u'security groups',
                     u'integration': u'Neutron',
                     u'present': False,
                     u'unique_id':
                     u"<class 'goldstone.core.models.SecurityGroup'>"},
                    {u'label': u'endpoints',
                     u'integration': u'Keystone',
                     u'present': False,
                     u'unique_id':
                     u"<class 'goldstone.core.models.Endpoint'>"},
                    {u'label': u'health monitors',
                     u'integration': u'Neutron',
                     u'present': False,
                     u'unique_id':
                     u"<class 'goldstone.core.models.HealthMonitor'>"},
                    {u'label': u'qos specs',
                     u'integration': u'Cinder',
                     u'present': False,
                     u'unique_id':
                     u"<class 'goldstone.core.models.QOSSpec'>"},
                    {u'label': u'interfaces',
                     u'integration': u'Nova',
                     u'present': False,
                     u'unique_id':
                     u"<class 'goldstone.core.models.Interface'>"},
                    {u'label': u'transfers',
                     u'integration': u'Cinder',
                     u'present': False,
                     u'unique_id':
                     u"<class 'goldstone.core.models.Transfer'>"},
                    {u'label': u'add-ons',
                     u'integration': u'Add-on',
                     u'present': False,
                     u'unique_id':
                     u"<class 'goldstone.core.models.Addon'>"},
                    {u'label': u'cinder',
                     u'integration': u'Cinder',
                     u'present': False,
                     u'unique_id':
                     u"<class 'goldstone.core.models.Cinder'>"},
                    {u'label': u'glance',
                     u'integration': u'Glance',
                     u'present': False,
                     u'unique_id':
                     u"<class 'goldstone.core.models.Glance'>"},
                    {u'label': u'keystone',
                     u'integration': u'Keystone',
                     u'present': False,
                     u'unique_id':
                     u"<class 'goldstone.core.models.Keystone'>"},
                    {u'label': u'nova',
                     u'integration': u'Nova',
                     u'present': False,
                     u'unique_id':
                     u"<class 'goldstone.core.models.Nova'>"},
                    {u'label': u'neutron',
                     u'integration': u'Neutron',
                     u'present': False,
                     u'unique_id':
                     u"<class 'goldstone.core.models.Neutron'>"},
                    ]

        # This code is for ticket #105611698. Coming into this test, the
        # resource types graph should be in a known state, having been
        # initialized by goldstone.test_utils.Setup.setUp(). But sometimes it
        # isn't. This code block checks for a known initial state and asserts a
        # test failure if it's not there.
        bad = False

        for entry in resource.types.graph.nodes():
            try:
                entry.label()
                entry.integration()
            except Exception as exc:        # pylint: disable=W0703
                print "? %s doesn't have label or integration, exception: %s" \
                    % \
                    (entry, exc.message)
                bad = True

        self.assertFalse(bad, msg="initial test condition is bad")

        # End of ticket #105611698 code.

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

        content = json.loads(response.content)["nodes"]
        self.assertItemsEqual(content, EXPECTED)


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
        with patch("goldstone.core.resource.types", mock_rt_graph):
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

        content = json.loads(response.content)["nodes"]
        for entry in content:
            del entry["uuid"]
        self.assertItemsEqual(content, EXPECTED)


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

        with patch("goldstone.core.resource.types", mock_rt_graph):
            response = self.client.get(
                RESTYPE_URL,
                HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        # pylint: disable=E1101
        self.assertEqual(response.status_code, HTTP_200_OK)

        # Call the token-expiration task, then try to do an API call again. It
        # should fail because of the tokens' expiration.
        expire_auth_tokens()

        with patch("goldstone.core.resource.types", mock_rt_graph):
            response = self.client.get(
                RESTYPE_URL,
                HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

        self.assertEqual(response.status_code, HTTP_401_UNAUTHORIZED)
