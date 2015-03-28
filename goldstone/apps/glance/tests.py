"""Glance unit tests."""
# Copyright 2014 - 2015 Solinea, Inc.
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
from django.http import HttpResponse
from django.test import SimpleTestCase
from goldstone.core.models import resources, Image, ServerGroup, NovaLimits, \
    GraphNode, PolyResource, Host, resource_types, Aggregate, Hypervisor, \
    Port, Cloudpipe, Network, Project
from goldstone.apps.glance.tasks import new_discover_glance_topology, \
    _add_edges
from mock import patch

# Using the latest version of django-polymorphic, a
# PolyResource.objects.all().delete() throws an IntegrityError exception. So
# when we need to clear the PolyResource table, we'll individually delete each
# subclass.
NODE_TYPES = [Image, ServerGroup, NovaLimits, Host, Aggregate, Cloudpipe, Port,
              Hypervisor, Project, Network]

# Aliases to make the code less verbose
EDGE_ATTRIBUTES = settings.R_ATTRIBUTE.EDGE_ATTRIBUTES
TYPE = settings.R_ATTRIBUTE.TYPE

class ViewTests(SimpleTestCase):
    """Test the report view."""

    def test_report_view(self):
        """Test /glance/report."""

        URI = '/glance/report'

        response = self.client.get(URI)
        self.assertEqual(response.status_code, 200)   # pylint: disable=E1101
        self.assertTemplateUsed(response, 'glance_report.html')


class DataViewTests(SimpleTestCase):
    """Test the data view."""

    def _evaluate(self, response):
        """Check the response."""
        import json

        self.assertIsInstance(response, HttpResponse)
        self.assertIsNotNone(response.content)

        try:
            result = json.loads(response.content)
        except Exception:        # pylint: disable=W0703
            self.fail("Could not convert content to JSON, content was %s" %
                      response.content)
        else:
            self.assertIsInstance(result, list)
            self.assertGreaterEqual(len(result), 1)
            self.assertIsInstance(result[0], list)

    def test_get_images(self):
        """GET to /images."""
        from django.contrib.auth import get_user_model
        from goldstone.test_utils import create_and_login, \
            AUTHORIZATION_PAYLOAD

        get_user_model().objects.all().delete()
        token = create_and_login()

        self._evaluate(
            self.client.get("/glance/images",
                            HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token))

def _load_rg_and_db(startnodes, startedges):
    """Create PolyResource database rows, and their corresponding Resource
    graph nodes.

    :param startnodes: The nodes to add.
    :type startnodes: A "NODES" iterable
    :param startedges: The edges to add.
    :type startedges: An "EDGES" iterable

    """

    nameindex = 0

    # Create the resource nodes. Each will have a unique name. Note that
    # the cloud_id is stored in the .attributes attribute.
    for nodetype, cloud_id in startnodes:
        row = nodetype.objects.create(cloud_id=cloud_id,
                                      name="name_%d" % nameindex)
        nameindex += 1

        resources.graph.add_node(GraphNode(uuid=row.uuid,
                                           resourcetype=nodetype,
                                           attributes={"id": cloud_id}))

    # Create the resource graph edges.
    for source, dest in startedges:
        # Find the from and to nodes.
        nodes = resources.nodes_of_type(source[0])
        row = source[0].objects.get(cloud_id=source[1])
        fromnode = [x for x in nodes if x.uuid == row.uuid][0]

        nodes = resources.nodes_of_type(dest[0])
        row = dest[0].objects.get(cloud_id=dest[1])
        tonode = [x for x in nodes if x.uuid == row.uuid][0]

        # Add the edge
        resources.graph.add_edge(fromnode, tonode)

class AddEdges(SimpleTestCase):
    """Test glance.tasks._add_edges."""

    def setUp(self):
        """Run before every test."""

        resources.graph.clear()

        for nodetype in NODE_TYPES:
            nodetype.objects.all().delete()

    def test_no_edges(self):
        """The node's type has no edges.

        Normally, this condition should never occur. Regardless, nothing should
        be done.

        """
        from goldstone.core.models import ResourceTypes

        # Test data.
        NODES = [(Host, "deadbeef")]

        _load_rg_and_db(NODES, [])
        
        # Mock out the resource_types object so that the Host entry has no
        # edges.
        node = resources.graph.nodes()[0]
        mock_rt_graph = ResourceTypes()
        mock_rt_graph.graph.remove_edges_from(
            mock_rt_graph.graph.out_edges(node.resourcetype))
        
        with patch("goldstone.apps.glance.tasks.resource_types",
                   mock_rt_graph):
            _add_edges(node)

        self.assertEqual(resources.graph.number_of_nodes(), len(NODES))
        self.assertEqual(resources.graph.number_of_edges(), 0)

    def test_neighbor_no_matchtype(self):
        """The candidates for a node's destination neighbor have no matching
        attribute.

        Nothing should be done.

        """

        # The initial resource graph nodes, as (Type, cloud_id) tuples.  The
        # cloud_id's must be unique within a node type. The Host type can form
        # outoing links to Aggregate and Hypervisor nodes.
        NODES = [(Host, "deadbeef"),
                 (Aggregate, "0"),
                 (Hypervisor, "1"),
                 (Hypervisor, "2")]

        _load_rg_and_db(NODES, [])
        
        # Modify the candidate destination nodes' attributes so that they do
        # not have the desired match key.
        for nodetype in (Aggregate, Hypervisor):
            for node in resources.nodes_of_type(nodetype):
                node.attributes = {"silly": "putty",
                                   "emacs": "the sacred editor"}
            
        node = resources.nodes_of_type(Host)[0]

        _add_edges(node)

        self.assertEqual(resources.graph.number_of_nodes(), len(NODES))
        self.assertEqual(resources.graph.number_of_edges(), 0)

    def test_no_attribute_value(self):
        """The node's neighbor has a matching attribute, but its value does not
        match the source node's.

        Nothing should be done.

        """

        # The initial resource graph nodes, as (Type, cloud_id) tuples.  The
        # cloud_id's must be unique within a node type. The Host type can form
        # outoing links to Aggregate and Hypervisor nodes.
        NODES = [(Host, "deadbeef"),
                 (Aggregate, "0"),
                 (Hypervisor, "1"),
                 (Hypervisor, "2")]

        _load_rg_and_db(NODES, [])
        
        node = resources.nodes_of_type(Host)[0]

        _add_edges(node)

        self.assertEqual(resources.graph.number_of_nodes(), len(NODES))
        self.assertEqual(resources.graph.number_of_edges(), 0)

    def test_no_matching_neighbor_instance(self):
        """No instance matches the desired type for the neighbor, although
        they happen to have matching match_attributes.

        Nothing should be done.

        """

        # The initial resource graph nodes, as (Type, cloud_id) tuples.  The
        # cloud_id's must be unique within a node type. The Host type can form
        # outoing links to Aggregate and Hypervisor nodes.
        NODES = [(Host, "deadbeef"),
                 (Image, "deadbeef"),
                 (Cloudpipe, "deadbeef"),
                 (Port, "deadbeef")]

        _load_rg_and_db(NODES, [])
        
        node = resources.nodes_of_type(Host)[0]

        _add_edges(node)

        self.assertEqual(resources.graph.number_of_nodes(), len(NODES))
        self.assertEqual(resources.graph.number_of_edges(), 0)

    def test_multiple_neighbor_matches(self):
        """Multiple instances match the desired neighbor type.

        Edges should be added from the source node to the mutiple destinations.

        """

        # The initial resource graph nodes, as (Type, cloud_id) tuples.  The
        # cloud_id's must be unique within a node type. The Host type can form
        # outoing links to Aggregate and Hypervisor nodes.
        NODES = [(Host, "deadbeef"),
                 (Image, "cad"),
                 (Cloudpipe, "deadbeef"),
                 (Project, "cad"),
                 (Port, "cad"),
                 (Network, "cad")]

        _load_rg_and_db(NODES, [])
        
        node = resources.nodes_of_type(Project)[0]

        _add_edges(node)

        # Test the node and edge count
        self.assertEqual(resources.graph.number_of_nodes(), len(NODES))
        self.assertEqual(resources.graph.number_of_edges(), 4)

        # Test the types of edges created.
        edges = resources.graph.out_edges(node)
        self.assertEqual(len(edges), 4)

        project_type_edges = resource_types.graph.out_edges(Project, data=True)

        import pdb; pdb.set_trace()
        # For every resource graph edge...
        for edge in edges:
            self.assertEqual(edge[0].resourcetype, Project)
            to_type = edge[1].resourcetype
            rt_edges = [x for x in project_type_edges if x[1] == to_type]

            # A Project Node should have two edges to each Network node. So we
            # have to special-case the Network nodes.
            if len(rt_edges) == 2:
                # Project => Network
                self.assertEqual(to_type, Network)
                expected_attr_dicts = \
                    [{TYPE: rt_edges[0][EDGE_ATTRIBUTES][TYPE]},
                     {TYPE: rt_edges[1][EDGE_ATTRIBUTES][TYPE]}]
                self.assertIn(edge[2], expected_attr_dicts)
            else:
                # Project => any other type
                self.assertIn(to_type, (Port, Image))
                expected_attr_dict = {TYPE: rt_edges[0][EDGE_ATTRIBUTES][TYPE]}
                self.assertEqual(edge[2], expected_attr_dict)
                                  

    @patch('goldstone.apps.glance.tasks.get_glance_client')
    def test_multiple_edges(self, ggc):
        """Multiple edges on the node, a couple of neighbors cannot be found.
        intersection is not null.

        Some of the resource graph nodes should be deleted, some should be
        updated, some should be added.

        """

        # The initial resource graph nodes, as (Type, cloud_id) tuples.  The
        # cloud_id's must be unique within a node type.
        NODES = [(Image, "a"),
                 (Image, "ab"),
                 (Image, "abc"),
                 (ServerGroup, "0"),
                 (ServerGroup, "ab"),
                 (NovaLimits, "0")]

        # The initial resource graph edges. Each entry is ((from_type,
        # cloud_id), (to_type, cloud_id)).  The cloud_id's must be unique
        # within a node type.
        EDGES = [((Image, "a"), (Image, "ab")),
                 ((Image, "a"), (ServerGroup, "0")),
                 ((Image, "ab"), (ServerGroup, "ab")),
                 ((Image, "ab"), (Image, "abc")),
                 ((NovaLimits, "0"), (ServerGroup, "ab")),
                 ((NovaLimits, "0"), (Image, "a")),
                 ((ServerGroup, "0"), (NovaLimits, "0")),
                 ]

        # Create the PolyResource database rows, and the corresponding
        # Resource graph nodes.
        _load_rg_and_db(NODES, EDGES)

        # Sanity check
        self.assertEqual(resources.graph.number_of_nodes(), len(NODES))
        self.assertEqual(PolyResource.objects.count(), len(NODES))
        self.assertEqual(resources.graph.number_of_edges(), len(EDGES))

        # Set up get_glance_client to return some glance and other services.
        cloud = self.EmptyClientObject()

        # Hits in the resource graph, but has new info.
        good_image_0 = {"checksum": "aw1234234234234234",
                        "container_format": "bare",
                        "disk_format": "FAT",
                        "name": "botchegaloot",
                        "status": "oh mama",
                        "id": "ab"}

        # A new node. This will have a duplicate name, which should not matter.
        good_image_1 = good_image_0.copy()
        good_image_1["id"] = "156"

        # Hits in the resource graph, but has new info.
        good_image_2 = good_image_0.copy()
        good_image_2["id"] = "abc"
        good_image_2["name"] = "Amber Waves"

        cloud.images_list = [good_image_0, good_image_1, good_image_2]
        cloud.images = cloud.Images(cloud.images_list)

        ggc.return_value = {"client": cloud, "region": "Siberia"}

        new_discover_glance_topology()

        self.assertEqual(resources.graph.number_of_nodes(), 6)
        self.assertEqual(PolyResource.objects.count(), 6)

        resource_node_attributes = [x.attributes
                                    for x in resources.nodes_of_type(Image)]
        expected = [good_image_0, good_image_1, good_image_2]
        resource_node_attributes.sort()
        expected.sort()
        self.assertEqual(resource_node_attributes, expected)

        self.assertEqual(resources.graph.number_of_edges(), 4)


class DiscoverGlanceTopology(SimpleTestCase):
    """Test glance.tasks.discover_glance_topology."""

    class EmptyClientObject(object):
        """A class that simulates one of get_glance_client's return
        values."""

        images_list = []

        class Images(object):
            """This is used to construct the images class symbol."""

            def __init__(self, val):
                self.val = val

            def list(self):
                """Mock the list() method."""

                return self.val

        images = Images(images_list)

    def setUp(self):
        """Run before every test."""

        resources.graph.clear()

        for nodetype in NODE_TYPES:
            nodetype.objects.all().delete()

    @patch('goldstone.apps.glance.tasks.get_glance_client')
    def test_empty_rg_empty_cloud(self, ggc):
        """Nothing in the resource graph, nothing in the cloud.

        Nothing should be done.

        """

        # Set up get_glance_client to return an empty OpenStack cloud.
        ggc.return_value = {"client": self.EmptyClientObject(),
                            "region": "Siberia"}

        new_discover_glance_topology()

        self.assertEqual(resources.graph.number_of_nodes(), 0)
        self.assertEqual(resources.graph.number_of_edges(), 0)

    @patch('goldstone.apps.glance.tasks.get_glance_client')
    def test_rg_empty_cloud_image(self, ggc):
        """The resource graph contains only Image instances; nothing in the
        cloud.

        All of the resource graph nodes should be deleted.

        """

        # The initial resource graph nodes, as (Type, cloud_id) tuples.
        NODES = [(Image, "a"), (Image, "ab"), (Image, "abc")]

        # The initial resource graph edges. Each entry is ((from_type,
        # cloud_id), (to_type, cloud_id)).
        EDGES = [((Image, "a"), (Image, "ab")), ((Image, "abc"), (Image, "a"))]

        # Create the PolyResource database rows, and the corresponding
        # Resource graph nodes.
        _load_rg_and_db(NODES, EDGES)

        # Sanity check
        self.assertEqual(resources.graph.number_of_nodes(), len(NODES))
        self.assertEqual(PolyResource.objects.count(), len(NODES))
        self.assertEqual(resources.graph.number_of_edges(), len(EDGES))

        # Set up get_glance_client to return an empty OpenStack cloud.
        ggc.return_value = {"client": self.EmptyClientObject(),
                            "region": "Siberia"}

        new_discover_glance_topology()

        self.assertEqual(resources.graph.number_of_nodes(), 0)
        self.assertEqual(PolyResource.objects.count(), 0)
        self.assertEqual(resources.graph.number_of_edges(), 0)

    @patch('goldstone.apps.glance.tasks.get_glance_client')
    def test_rg_other_empty_cloud(self, ggc):
        """Something in the resource graph, some of which are non-Image
        instances; nothing in the cloud.

        The Image resource graph nodes should be deleted.

        """

        # The initial resource graph nodes, as (Type, cloud_id) tuples.  The
        # cloud_id's must be unique within a node type.
        NODES = [(Image, "a"),
                 (Image, "ab"),
                 (Image, "abc"),
                 (Image, "0001"),
                 (Image, "0002"),
                 (ServerGroup, "0"),
                 (ServerGroup, "ab"),
                 (NovaLimits, "0")]

        # The initial resource graph edges. Each entry is ((from_type,
        # cloud_id), (to_type, cloud_id)).  The cloud_id's must be unique
        # within a node type.
        EDGES = [((Image, "a"), (Image, "ab")),
                 ((Image, "0001"), (Image, "0002")),
                 ((Image, "a"), (ServerGroup, "0")),
                 ((Image, "ab"), (ServerGroup, "ab")),
                 ((Image, "abc"), (Image, "a")),
                 ((NovaLimits, "0"), (ServerGroup, "ab")),
                 ((NovaLimits, "0"), (Image, "a")),
                 ((ServerGroup, "0"), (Image, "0001")),
                 ((ServerGroup, "0"), (NovaLimits, "0")),
                 ]

        # Create the PolyResource database rows, and the corresponding
        # Resource graph nodes.
        _load_rg_and_db(NODES, EDGES)

        # Sanity check
        self.assertEqual(resources.graph.number_of_nodes(), len(NODES))
        self.assertEqual(PolyResource.objects.count(), len(NODES))
        self.assertEqual(resources.graph.number_of_edges(), len(EDGES))

        # Set up get_glance_client to return an empty OpenStack cloud.
        ggc.return_value = {"client": self.EmptyClientObject(),
                            "region": "Siberia"}

        new_discover_glance_topology()

        self.assertEqual(resources.graph.number_of_nodes(), 3)
        self.assertEqual(PolyResource.objects.count(), 3)
        self.assertEqual(resources.nodes_of_type(Image), [])
        self.assertEqual(resources.graph.number_of_edges(), 2)

    @patch('goldstone.apps.glance.tasks.logger')
    @patch('goldstone.apps.glance.tasks.get_glance_client')
    def test_empty_rg_cloud_multi_noid(self, ggc, log):
        """Nothing in the resource graph; something in the cloud, and some of
        the glance services don't have cloud_id.

        The ones without an id should be logged as errors, and the others
        should be added to the resource graph.

        """

        # Set up get_glance_client to return some glance services and other
        # services. Some of the glance services won't have a cloud_id.
        cloud = self.EmptyClientObject()

        bad_image_0 = {"checksum": "aw1234234234234234",
                       "container_format": "bare",
                       "disk_format": "FAT",
                       "name": "botchegaloot",
                       "status": "oh mama"}
        bad_image_1 = bad_image_0.copy()
        bad_image_1["owner"] = "Mike Hunt"

        good_image_0 = {"checksum": "aw1234234234234234",
                        "container_format": "bare",
                        "disk_format": "FAT",
                        "name": "botchegaloot",
                        "status": "oh mama",
                        "id": "123123233333"}
        good_image_1 = good_image_0.copy()
        good_image_1["owner"] = "Mike Hunt"
        good_image_1["id"] = "156"

        cloud.images_list = [bad_image_0,
                             good_image_1,
                             good_image_0,
                             bad_image_1]
        cloud.images = cloud.Images(cloud.images_list)

        ggc.return_value = {"client": cloud, "region": "Siberia"}

        new_discover_glance_topology()

        self.assertEqual(resources.graph.number_of_nodes(), 2)
        self.assertEqual(PolyResource.objects.count(), 2)
        self.assertEqual(len(resources.nodes_of_type(Image)), 2)

        # Extract the glance service dict from the logger calls, and then
        # check them.
        logger_arguments = [x[0][1] for x in log.critical.call_args_list]
        self.assertEqual(logger_arguments, [bad_image_0, bad_image_1])

    @patch('goldstone.apps.glance.tasks.get_glance_client')
    def test_rg_cloud(self, ggc):
        """Something is in the graph, and cloud services exist; but their
        intersection is null.

        All of the existing resource graph glance (Image) nodes should be
        deleted, and the new cloud services added.

        """

        # The initial resource graph nodes, as (Type, cloud_id) tuples.  The
        # cloud_id's must be unique within a node type.
        NODES = [(Image, "a"),
                 (Image, "ab"),
                 (ServerGroup, "0"),
                 (ServerGroup, "ab"),
                 (NovaLimits, "0")]

        # The initial resource graph edges. Each entry is ((from_type,
        # cloud_id), (to_type, cloud_id)).  The cloud_id's must be unique
        # within a node type.
        EDGES = [((Image, "a"), (Image, "ab")),
                 ((Image, "a"), (ServerGroup, "0")),
                 ((Image, "ab"), (ServerGroup, "ab")),
                 ((NovaLimits, "0"), (ServerGroup, "ab")),
                 ((NovaLimits, "0"), (Image, "a")),
                 ((ServerGroup, "0"), (NovaLimits, "0")),
                 ]

        # Create the PolyResource database rows, and the corresponding
        # Resource graph nodes.
        _load_rg_and_db(NODES, EDGES)

        # Sanity check
        self.assertEqual(resources.graph.number_of_nodes(), len(NODES))
        self.assertEqual(PolyResource.objects.count(), len(NODES))
        self.assertEqual(resources.graph.number_of_edges(), len(EDGES))

        # Set up get_glance_client to return some glance and other services.
        cloud = self.EmptyClientObject()

        good_image_0 = {"checksum": "aw1234234234234234",
                        "container_format": "bare",
                        "disk_format": "FAT",
                        "name": "botchegaloot",
                        "status": "oh mama",
                        "id": "123123233333"}
        good_image_1 = good_image_0.copy()
        good_image_1["id"] = "156"
        good_image_2 = good_image_0.copy()
        good_image_2["id"] = "157"

        cloud.images_list = [good_image_0, good_image_1, good_image_2]
        cloud.images = cloud.Images(cloud.images_list)

        ggc.return_value = {"client": cloud, "region": "Siberia"}

        new_discover_glance_topology()

        self.assertEqual(resources.graph.number_of_nodes(), 6)
        self.assertEqual(PolyResource.objects.count(), 6)

        resource_node_attributes = [x.attributes
                                    for x in resources.nodes_of_type(Image)]
        expected = [good_image_0, good_image_1, good_image_2]
        resource_node_attributes.sort()
        expected.sort()
        self.assertEqual(resource_node_attributes, expected)

        self.assertEqual(resources.graph.number_of_edges(), 2)

    @patch('goldstone.apps.glance.tasks.get_glance_client')
    def test_rg_cloud_hit(self, ggc):
        """Something is in the graph, and cloud services exist; and the
        intersection is not null.

        Some of the resource graph nodes should be deleted, some should be
        updated, some should be added.

        """

        # The initial resource graph nodes, as (Type, cloud_id) tuples.  The
        # cloud_id's must be unique within a node type.
        NODES = [(Image, "a"),
                 (Image, "ab"),
                 (Image, "abc"),
                 (ServerGroup, "0"),
                 (ServerGroup, "ab"),
                 (NovaLimits, "0")]

        # The initial resource graph edges. Each entry is ((from_type,
        # cloud_id), (to_type, cloud_id)).  The cloud_id's must be unique
        # within a node type.
        EDGES = [((Image, "a"), (Image, "ab")),
                 ((Image, "a"), (ServerGroup, "0")),
                 ((Image, "ab"), (ServerGroup, "ab")),
                 ((Image, "ab"), (Image, "abc")),
                 ((NovaLimits, "0"), (ServerGroup, "ab")),
                 ((NovaLimits, "0"), (Image, "a")),
                 ((ServerGroup, "0"), (NovaLimits, "0")),
                 ]

        # Create the PolyResource database rows, and the corresponding
        # Resource graph nodes.
        _load_rg_and_db(NODES, EDGES)

        # Sanity check
        self.assertEqual(resources.graph.number_of_nodes(), len(NODES))
        self.assertEqual(PolyResource.objects.count(), len(NODES))
        self.assertEqual(resources.graph.number_of_edges(), len(EDGES))

        # Set up get_glance_client to return some glance and other services.
        cloud = self.EmptyClientObject()

        # Hits in the resource graph, but has new info.
        good_image_0 = {"checksum": "aw1234234234234234",
                        "container_format": "bare",
                        "disk_format": "FAT",
                        "name": "botchegaloot",
                        "status": "oh mama",
                        "id": "ab"}

        # A new node. This will have a duplicate name, which should not matter.
        good_image_1 = good_image_0.copy()
        good_image_1["id"] = "156"

        # Hits in the resource graph, but has new info.
        good_image_2 = good_image_0.copy()
        good_image_2["id"] = "abc"
        good_image_2["name"] = "Amber Waves"

        cloud.images_list = [good_image_0, good_image_1, good_image_2]
        cloud.images = cloud.Images(cloud.images_list)

        ggc.return_value = {"client": cloud, "region": "Siberia"}

        new_discover_glance_topology()

        self.assertEqual(resources.graph.number_of_nodes(), 6)
        self.assertEqual(PolyResource.objects.count(), 6)

        resource_node_attributes = [x.attributes
                                    for x in resources.nodes_of_type(Image)]
        expected = [good_image_0, good_image_1, good_image_2]
        resource_node_attributes.sort()
        expected.sort()
        self.assertEqual(resource_node_attributes, expected)

        self.assertEqual(resources.graph.number_of_edges(), 4)

    @patch('goldstone.apps.glance.tasks.logger')
    @patch('goldstone.apps.glance.tasks.get_glance_client')
    def test_duplicate_cloud_ids(self, ggc, log):
        """Something in the resource graph, and some glance services in the
        cloud; and some of the cloud's glance services have duplicate
        cloud_ids."""

        # The initial resource graph nodes, as (Type, cloud_id) tuples.  The
        # cloud_id's must be unique within a node type.
        NODES = [(Image, "a"),
                 (Image, "ab"),
                 (ServerGroup, "0"),
                 (NovaLimits, "0")]

        # The initial resource graph edges. Each entry is ((from_type,
        # cloud_id), (to_type, cloud_id)).  The cloud_id's must be unique
        # within a node type.
        EDGES = [((Image, "a"), (Image, "ab")),
                 ((Image, "a"), (ServerGroup, "0")),
                 ((NovaLimits, "0"), (Image, "a")),
                 ((ServerGroup, "0"), (NovaLimits, "0")),
                 ]

        # Create the PolyResource database rows, and the corresponding
        # Resource graph nodes.
        _load_rg_and_db(NODES, EDGES)

        # Sanity check.
        self.assertEqual(resources.graph.number_of_nodes(), len(NODES))
        self.assertEqual(PolyResource.objects.count(), len(NODES))
        self.assertEqual(resources.graph.number_of_edges(), len(EDGES))

        # Set up get_glance_client to return some glance services, two of
        # which have duplicate OpenStack ids.
        cloud = self.EmptyClientObject()

        good_image_0 = {"checksum": "aw1234234234234234",
                        "container_format": "bare",
                        "disk_format": "FAT",
                        "name": "botchegaloot",
                        "status": "oh mama",
                        "id": "deadbeef"}
        good_image_1 = good_image_0.copy()
        good_image_1["owner"] = "Mike Hunt"
        good_image_1["id"] = "beef"
        good_image_2 = good_image_1.copy()
        good_image_1["owner"] = "I.P. Daily"
        good_image_2["id"] = "deadbeef"

        cloud.images_list = [good_image_0, good_image_1, good_image_2]
        cloud.images = cloud.Images(cloud.images_list)

        ggc.return_value = {"client": cloud, "region": "Siberia"}

        new_discover_glance_topology()

        self.assertEqual(resources.graph.number_of_nodes(), 5)
        self.assertEqual(PolyResource.objects.count(), 5)
        self.assertEqual(len(resources.nodes_of_type(Image)), 3)

        # Extract the glance service dict from the logger calls, and then
        # check them.
        logger_arguments = [x[0][1] for x in log.critical.call_args_list]
        expected = [[good_image_2]]
        self.assertEqual(logger_arguments, expected)
