"""Resource and resource type graph API unit tests.

Tests:
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
import json

from django.conf import settings
from mock import patch
from rest_framework.status import HTTP_200_OK, HTTP_404_NOT_FOUND

from goldstone.core.models import Host, AvailabilityZone, Hypervisor, \
    Aggregate, Server, Project, NeutronNetwork, Limits, PolyResource, Image
from goldstone.core import resource
from goldstone.core.resource import Instances, GraphNode
from goldstone.test_utils import Setup, create_and_login, \
    AUTHORIZATION_PAYLOAD, BAD_UUID

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
RES_URL = "/core/resources/"
RES_DETAIL_URL = RES_URL + "%s/"


class CoreResourcesUnpacking(Setup):
    """The unpacking of persistent data into the in-memory graph."""

    def test_unpacking_none(self):
        """Test unpacking when the in-memory graph is empty."""

        # Create two persistent graph rows, with one edge between them.
        image = Image.objects.create(native_id="bar",
                                     native_name="foo",
                                     edges=[],
                                     cloud_attributes={"high": "school"})
        project = Project.objects.create(native_id="foo",
                                         native_name="bar",
                                         edges=[(image.uuid,
                                                 {"edgescore": 7})],
                                         cloud_attributes={"madonn": 'a'})

        # Unpack the graph
        resource.instances.graph           # pylint: disable=W0104

        # Check the number of nodes and edges
        self.assertEqual(resource.instances.graph.number_of_nodes(), 2)
        self.assertEqual(resource.instances.graph.number_of_edges(), 1)

        # Check the node information.
        for entry, entrytype in ((image, Image), (project, Project)):
            node = resource.instances.get_uuid(entry.uuid)
            self.assertEqual(node.uuid, entry.uuid)
            self.assertEqual(node.resourcetype, entrytype)
            self.assertEqual(node.attributes, entry.cloud_attributes)

        # Check the edge information.
        edge = resource.instances.graph.edges(data=True)[0]
        self.assertEqual(edge[2], project.edges[0][1])

    def test_unpack_empty(self):
        """Test unpacking an empty graph."""

        # Create two persistent graph rows, with one edge between them.
        image = Image.objects.create(native_id="bar",
                                     native_name="foo",
                                     edges=[],
                                     cloud_attributes={"high": "school"})
        Project.objects.create(native_id="foo",
                               native_name="bar",
                               edges=[(image.uuid, {"edgescore": 7})],
                               cloud_attributes={"madonn": 'a'})

        # Unpack the graph
        resource.instances.graph       # pylint: disable=W0104

        # Delete the persistent graph.
        Image.objects.all().delete()
        Project.objects.all().delete()

        # Unpack an empty graph.
        resource.instances._graph = None       # pylint: disable=W0212
        resource.instances.graph               # pylint: disable=W0104

        # Check the number of nodes and edges
        self.assertEqual(resource.instances.graph.number_of_nodes(), 0)
        self.assertEqual(resource.instances.graph.number_of_edges(), 0)

    def test_unpack_bad_nodes(self):
        """The persistent graph has edges that reference non-existent nodes."""

        # Create five persistent graph rows and four edges. Two edges will
        # reference destination uuids that don't exist.
        #
        # image -> server, good
        server = Server.objects.create(native_id="bar",
                                       native_name="foo",
                                       edges=[],
                                       cloud_attributes={"id": "42"})
        image = Image.objects.create(native_id="bar77",
                                     native_name="foo77",
                                     edges=[(server.uuid, {"some!": "stuff"})],
                                     cloud_attributes={"id": "42"})
        # host -> hypervisor, but bad uuid used.
        hypervisor = \
            Hypervisor.objects.create(native_id="bbbbbar",
                                      native_name="fffffoo",
                                      edges=[],
                                      cloud_attributes={"hypervisor_hostname":
                                                        "school"})
        host = Host.objects.create(native_id="barfjohn",
                                   native_name="foojohn",
                                   edges=[("66", {"SOME": "stuFF"})],
                                   cloud_attributes={"host_name": "school"})
        # project -> image, but bad uuid used.
        # project -> server, good
        project = \
            Project.objects.create(native_id="sigh",
                                   native_name="gasp",
                                   edges=[("66666", {"edgescore": 17}),
                                          (server.uuid, {"success!": True})],
                                   cloud_attributes={"id": '42'})

        # Unpack the graph
        resource.instances.graph       # pylint: disable=W0104

        # Check the number of nodes and edges
        self.assertEqual(resource.instances.graph.number_of_nodes(), 5)
        self.assertEqual(resource.instances.graph.number_of_edges(), 2)

        # Check the node information.
        for entry, entrytype in ((server, Server), (image, Image),
                                 (hypervisor, Hypervisor), (host, Host),
                                 (project, Project)):
            node = resource.instances.get_uuid(entry.uuid)
            self.assertEqual(node.uuid, entry.uuid)
            self.assertEqual(node.resourcetype, entrytype)
            self.assertEqual(node.attributes, entry.cloud_attributes)

        # Check the edge information.
        edge_attributes = [x[2]
                           for x in resource.instances.graph.edges(data=True)]
        self.assertIn({"some!": "stuff"}, edge_attributes)
        self.assertIn({"success!": True}, edge_attributes)


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
                 (NeutronNetwork, "n1234", "network 0", {"quality": "good"}),
                 (NeutronNetwork, "n12345", "network 1", {"quality": "good"}),
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
                           {u'label': u'projects',
                            u'resourcetype': u'projects',
                            u'unique_id':
                            u"<class 'goldstone.core.models.Project'>"},
                           },
                          {u'native_id': u'beef2',
                           u'native_name': u'server 2',
                           u'resourcetype':
                           {u'label': u'servers',
                            u'resourcetype': u'servers',
                            u'unique_id':
                            u"<class 'goldstone.core.models.Server'>"},
                           },
                          {u'native_id': u'beef1',
                           u'native_name': u'server 1',
                           u'resourcetype':
                           {u'label': u'servers',
                            u'resourcetype': u'servers',
                            u'unique_id':
                            u"<class 'goldstone.core.models.Server'>"},
                           },
                          {u'native_id': u'a2',
                           u'native_name': u'availabilityzone 1',
                           u'resourcetype':
                           {u'label': u'availability zones',
                            u'resourcetype': u'availability zones',
                            u'unique_id':
                            u"<class 'goldstone.core.models.AvailabilityZone'>"
                            },
                           },
                          {u'native_id': u'12345',
                           u'native_name': u'host 1',
                           u'resourcetype':
                           {u'label': u'hosts',
                            u'resourcetype': u'hosts',
                            u'unique_id':
                            u"<class 'goldstone.core.models.Host'>"},
                           },
                          {u'native_id': u'p1',
                           u'native_name': u'project 1',
                           u'resourcetype':
                           {u'label': u'projects',
                            u'resourcetype': u'projects',
                            u'unique_id':
                            u"<class 'goldstone.core.models.Project'>"},
                           },
                          {u'native_id': u'1234',
                           u'native_name': u'host 0',
                           u'resourcetype':
                           {u'label': u'hosts',
                            u'resourcetype': u'hosts',
                            u'unique_id':
                            u"<class 'goldstone.core.models.Host'>"},
                           },
                          {u'native_id': u'l123456',
                           u'native_name': u'limits 2',
                           u'resourcetype':
                           {u'label': u'limits',
                            u'resourcetype': u'limits',
                            u'unique_id':
                            u"<class 'goldstone.core.models.Limits'>"},
                           },
                          {u'native_id': u'dead1',
                           u'native_name': u'aggregate 0',
                           u'resourcetype':
                           {u'label': u'aggregates',
                            u'resourcetype': u'aggregates',
                            u'unique_id':
                            u"<class 'goldstone.core.models.Aggregate'>"},
                           },
                          {u'native_id': u'dead2',
                           u'native_name': u'aggregate 1',
                           u'resourcetype':
                           {u'label': u'aggregates',
                            u'resourcetype': u'aggregates',
                            u'unique_id':
                            u"<class 'goldstone.core.models.Aggregate'>"},
                           },
                          {u'native_id': u'f23456',
                           u'native_name': u'hypervisor 0',
                           u'resourcetype':
                           {u'label': u'hypervisors',
                            u'resourcetype': u'hypervisors',
                            u'unique_id':
                            u"<class 'goldstone.core.models.Hypervisor'>"},
                           },
                          {u'native_id': u'p0',
                           u'native_name': u'project 0',
                           u'resourcetype':
                           {u'label': u'projects',
                            u'resourcetype': u'projects',
                            u'unique_id':
                            u"<class 'goldstone.core.models.Project'>"},
                           },
                          {u'native_id': u'f2345',
                           u'native_name': u'hypervisor 0',
                           u'resourcetype':
                           {u'label': u'hypervisors',
                            u'resourcetype': u'hypervisors',
                            u'unique_id':
                            u"<class 'goldstone.core.models.Hypervisor'>"},
                           },
                          {u'native_id': u'n12345',
                           u'native_name': u'network 1',
                           u'resourcetype':
                           {u'label': u'networks',
                            u'resourcetype': u'networks',
                            u'unique_id':
                            u"<class 'goldstone.core.models.Network'>"},
                           },
                          {u'native_id': u'a1',
                           u'native_name': u'availabilityzone 0',
                           u'resourcetype':
                           {u'label': u'availability zones',
                            u'resourcetype': u'availability zones',
                            u'unique_id':
                            u"<class 'goldstone.core.models.AvailabilityZone'>"
                            },
                           },
                          {u'native_id': u'n1234',
                           u'native_name': u'network 0',
                           u'resourcetype':
                           {u'label': u'networks',
                            u'resourcetype': u'networks',
                            u'unique_id':
                            u"<class 'goldstone.core.models.Network'>"},
                           },
                          {u'native_id': u'123456',
                           u'native_name': u'host 2',
                           u'resourcetype':
                           {u'label': u'hosts',
                            u'resourcetype': u'hosts',
                            u'unique_id':
                            u"<class 'goldstone.core.models.Host'>"},
                           },
                          {u'native_id': u'l12345',
                           u'native_name': u'limits 1',
                           u'resourcetype':
                           {u'label': u'limits',
                            u'resourcetype': u'limits',
                            u'unique_id':
                            u"<class 'goldstone.core.models.Limits'>"},
                           },
                          {u'native_id': u'l1234',
                           u'native_name': u'limits 0',
                           u'resourcetype':
                           {u'label': u'limits',
                            u'resourcetype': u'limits',
                            u'unique_id':
                            u"<class 'goldstone.core.models.Limits'>"},
                           },
                          {u'native_id': u'f234',
                           u'native_name': u'hypervisor 0',
                           u'resourcetype':
                           {u'label': u'hypervisors',
                            u'resourcetype': u'hypervisors',
                            u'unique_id':
                            u"<class 'goldstone.core.models.Hypervisor'>"},
                           },
                          {u'native_id': u'a3',
                           u'native_name': u'availabiltiyzone 2',
                           u'resourcetype':
                           {u'label': u'availability zones',
                            u'resourcetype': u'availability zones',
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

        # Force the instance graph to be re-evaluated now.
        resource.instances._graph = None       # pylint: disable=W0212

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

        self.assertItemsEqual(content["nodes"], EXPECTED_NODES)


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
                 (NeutronNetwork, "n1234", "network 0", {"quality": "good"}),
                 (NeutronNetwork, "n12345", "network 1", {"quality": "good"}),
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
