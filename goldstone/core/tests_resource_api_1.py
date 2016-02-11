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
import json

from django.conf import settings
from mock import patch
from rest_framework.status import HTTP_200_OK, HTTP_404_NOT_FOUND, \
    HTTP_401_UNAUTHORIZED

from goldstone.core.models import Host, AvailabilityZone, Hypervisor, \
    Aggregate, Server, Project, NeutronNetwork, Limits
from goldstone.core import resource
from goldstone.core.resource import Types, GraphNode
from goldstone.test_utils import Setup, create_and_login, \
    AUTHORIZATION_PAYLOAD

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
                 (NeutronNetwork, "n1234", "network 0", {"quality": "good"}),
                 (NeutronNetwork, "n12345", "network 1", {"quality": "good"}),
                 (Limits, "l1234", "limits 0", {"quality": "good"}),
                 (Limits, "l12345", "limits 1", {"quality": "good"}),
                 (Limits, "l123456", "limits 2", {"quality": "good"}),
                 ]

        # Expected test results.
        EXPECTED = [{u'label': u'hosts',
                     u'resourcetype': u'hosts',
                     u'integration': u'nova',
                     u'present': True,
                     u'unique_id': u"<class 'goldstone.core.models.Host'>"},
                    {u'label': None,
                     u'resourcetype': u'regions',
                     u'integration': u'keystone',
                     u'present': False,
                     u'unique_id': u"<class 'goldstone.core.models.Region'>"},
                    {u'label': u'groups',
                     u'resourcetype': u'groups',
                     u'integration': u'keystone',
                     u'present': False,
                     u'unique_id': u"<class 'goldstone.core.models.Group'>"},
                    {u'label': u'flavors',
                     u'resourcetype': u'flavors',
                     u'integration': u'nova',
                     u'present': False,
                     u'unique_id': u"<class 'goldstone.core.models.Flavor'>"},
                    {u'label': u'floating ip addresses',
                     u'resourcetype': u'floating ip addresses',
                     u'integration': u'neutron',
                     u'present': False,
                     u'unique_id':
                     u"<class 'goldstone.core.models.NeutronFloatingIP'>"},
                    {u'label': u'hypervisors',
                     u'resourcetype': u'hypervisors',
                     u'integration': u'nova',
                     u'present': True,
                     u'unique_id':
                     u"<class 'goldstone.core.models.Hypervisor'>"},
                    {u'label': u'servers',
                     u'resourcetype': u'servers',
                     u'integration': u'nova',
                     u'present': True,
                     u'unique_id': u"<class 'goldstone.core.models.Server'>"},
                    {u'label': u'projects',
                     u'resourcetype': u'projects',
                     u'integration': u'keystone',
                     u'present': True,
                     u'unique_id': u"<class 'goldstone.core.models.Project'>"},
                    {u'label': u'routers',
                     u'resourcetype': u'routers',
                     u'integration': u'neutron',
                     u'present': False,
                     u'unique_id':
                         u"<class 'goldstone.core.models.NeutronRouter'>"},
                    {u'label': u'users',
                     u'resourcetype': u'users',
                     u'integration': u'keystone',
                     u'present': False,
                     u'unique_id': u"<class 'goldstone.core.models.User'>"},
                    {u'label': u'limits',
                     u'resourcetype': u'limits',
                     u'integration': u'nova',
                     u'present': False,
                     u'unique_id':
                     u"<class 'goldstone.core.models.NovaLimits'>"},
                    {u'label': u'ports',
                     u'resourcetype': u'ports',
                     u'integration': u'neutron',
                     u'present': False,
                     u'unique_id':
                         u"<class 'goldstone.core.models.NeutronPort'>"},
                    {u'label': u'volume types',
                     u'resourcetype': u'volume types',
                     u'integration': u'cinder',
                     u'present': False,
                     u'unique_id':
                     u"<class 'goldstone.core.models.VolumeType'>"},
                    {u'label': u'networks',
                     u'resourcetype': u'networks',
                     u'integration': u'neutron',
                     u'present': True,
                     u'unique_id':
                         u"<class 'goldstone.core.models.NeutronNetwork'>"},
                    {u'label': u'limits',
                     u'resourcetype': u'limits',
                     u'integration': u'cinder',
                     u'present': True,
                     u'unique_id': u"<class 'goldstone.core.models.Limits'>"},
                    {u'label': u'images',
                     u'resourcetype': u'images',
                     u'integration': u'glance',
                     u'present': False,
                     u'unique_id': u"<class 'goldstone.core.models.Image'>"},
                    {u'label': u'availability zones',
                     u'resourcetype': u'availability zones',
                     u'integration': u'nova',
                     u'present': True,
                     u'unique_id':
                     u"<class 'goldstone.core.models.AvailabilityZone'>"},
                    {u'label': u'subnets',
                     u'resourcetype': u'subnets',
                     u'integration': u'neutron',
                     u'present': False,
                     u'unique_id':
                         u"<class 'goldstone.core.models.NeutronSubnet'>"},
                    {u'label': u'volumes',
                     u'resourcetype': u'volumes',
                     u'integration': u'cinder',
                     u'present': False,
                     u'unique_id': u"<class 'goldstone.core.models.Volume'>"},
                    {u'label': u'domains',
                     u'resourcetype': u'domains',
                     u'integration': u'keystone',
                     u'present': False,
                     u'unique_id': u"<class 'goldstone.core.models.Domain'>"},
                    {u'label': u'tokens',
                     u'resourcetype': u'tokens',
                     u'integration': u'keystone',
                     u'present': False,
                     u'unique_id': u"<class 'goldstone.core.models.Token'>"},
                    {u'label': u'keypairs',
                     u'resourcetype': u'keypairs',
                     u'integration': u'nova',
                     u'present': False,
                     u'unique_id': u"<class 'goldstone.core.models.Keypair'>"},
                    {u'label': u'server groups',
                     u'resourcetype': u'server groups',
                     u'integration': u'nova',
                     u'present': False,
                     u'unique_id':
                     u"<class 'goldstone.core.models.ServerGroup'>"},
                    {u'label': u'roles',
                     u'resourcetype': u'roles',
                     u'integration': u'keystone',
                     u'present': False,
                     u'unique_id': u"<class 'goldstone.core.models.Role'>"},
                    {u'label': u'quota sets',
                     u'resourcetype': u'quota sets',
                     u'integration': u'cinder',
                     u'present': False,
                     u'unique_id':
                     u"<class 'goldstone.core.models.QuotaSet'>"},
                    {u'label': u'services',
                     u'resourcetype': u'services',
                     u'integration': u'keystone',
                     u'present': False,
                     u'unique_id': u"<class 'goldstone.core.models.Service'>"},
                    {u'label': u'snapshots',
                     u'resourcetype': u'snapshots',
                     u'integration': u'cinder',
                     u'present': False,
                     u'unique_id':
                     u"<class 'goldstone.core.models.Snapshot'>"},
                    {u'label': u'aggregates',
                     u'resourcetype': u'aggregates',
                     u'integration': u'nova',
                     u'present': True,
                     u'unique_id':
                     u"<class 'goldstone.core.models.Aggregate'>"},
                    {u'label': u'cloudpipes',
                     u'resourcetype': u'cloudpipes',
                     u'integration': u'nova',
                     u'present': False,
                     u'unique_id':
                     u"<class 'goldstone.core.models.Cloudpipe'>"},
                    {u'label': u'quotas',
                     u'resourcetype': u'quotas',
                     u'integration': u'neutron',
                     u'present': False,
                     u'unique_id':
                     u"<class 'goldstone.core.models.NeutronQuota'>"},
                    {u'label': u'credentials',
                     u'resourcetype': u'credentials',
                     u'integration': u'keystone',
                     u'present': False,
                     u'unique_id':
                     u"<class 'goldstone.core.models.Credential'>"},
                    {u'label': u'endpoints',
                     u'resourcetype': u'endpoints',
                     u'integration': u'keystone',
                     u'present': False,
                     u'unique_id':
                     u"<class 'goldstone.core.models.Endpoint'>"},
                    {u'label': u'qos specs',
                     u'resourcetype': u'qos specs',
                     u'integration': u'cinder',
                     u'present': False,
                     u'unique_id':
                     u"<class 'goldstone.core.models.QOSSpec'>"},
                    {u'label': u'interfaces',
                     u'resourcetype': u'interfaces',
                     u'integration': u'nova',
                     u'present': False,
                     u'unique_id':
                     u"<class 'goldstone.core.models.Interface'>"},
                    {u'label': u'transfers',
                     u'resourcetype': u'transfers',
                     u'integration': u'cinder',
                     u'present': False,
                     u'unique_id':
                     u"<class 'goldstone.core.models.Transfer'>"},
                    {u'label': u'add-ons',
                     u'resourcetype': u'add-ons',
                     u'integration': u'add-on',
                     u'present': False,
                     u'unique_id':
                     u"<class 'goldstone.core.models.Addon'>"},
                    {u'label': u'cinder',
                     u'resourcetype': u'cinder',
                     u'integration': u'cinder',
                     u'present': False,
                     u'unique_id':
                     u"<class 'goldstone.core.models.Cinder'>"},
                    {u'label': u'glance',
                    u'resourcetype': u'glance',
                     u'integration': u'glance',
                     u'present': False,
                     u'unique_id':
                     u"<class 'goldstone.core.models.Glance'>"},
                    {u'label': u'keystone',
                     u'resourcetype': u'keystone',
                     u'integration': u'keystone',
                     u'present': False,
                     u'unique_id':
                     u"<class 'goldstone.core.models.Keystone'>"},
                    {u'label': u'nova',
                     u'resourcetype': u'nova',
                     u'integration': u'nova',
                     u'present': False,
                     u'unique_id':
                     u"<class 'goldstone.core.models.Nova'>"},
                    {u'label': u'neutron',
                     u'resourcetype': u'neutron',
                     u'integration': u'neutron',
                     u'present': False,
                     u'unique_id':
                     u"<class 'goldstone.core.models.Neutron'>"},
                    {u'resourcetype': u'agent',
                     u'unique_id':
                         u"<class 'goldstone.core.models.NeutronAgent'>",
                     u'integration': u'neutron',
                     u'present': False,
                     u'label': u'agent'},
                    {u'resourcetype': u'extensions',
                     u'unique_id':
                         u"<class 'goldstone.core.models.NeutronExtension'>",
                     u'integration': u'neutron',
                     u'present': False,
                     u'label': u'extensions'},
                    {u'resourcetype': u'subnet pools',
                     u'unique_id':
                         u"<class 'goldstone.core.models.NeutronSubnetPool'>",
                     u'integration': u'neutron',
                     u'present': False,
                     u'label': u'subnet pools'},
                    {u'resourcetype': u'security groups',
                     u'unique_id':
                         u"<class 'goldstone.core.models."
                         u"NeutronSecurityGroup'>",
                     u'integration': u'neutron',
                     u'present': False,
                     u'label': u'security groups'},
                    {u'resourcetype': u'security rules',
                     u'unique_id':
                         u"<class 'goldstone.core.models."
                         u"NeutronSecurityGroupRule'>",
                     u'integration': u'neutron',
                     u'present': False,
                     u'label': u'security rules'}
                    ]

        # This code is for ticket #105611698. Coming into this test, the
        # resource types graph should be in a known state, having been
        # initialized by goldstone.test_utils.Setup.setUp(). But sometimes it
        # isn't. This code block checks for a known initial state and asserts a
        # test failure if it's not there.
        bad = False

        for entry in resource.types.graph.nodes():
            try:
                entry().label()
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
                 (NeutronNetwork, "n1234", "network 0", {"quality": "good"}),
                 (NeutronNetwork, "n12345", "network 1", {"quality": "good"}),
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
