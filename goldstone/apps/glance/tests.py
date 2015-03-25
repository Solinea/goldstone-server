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
import json
from django.http import HttpResponse
from django.test import SimpleTestCase
from goldstone.core.models import resources, Image, ServerGroup, NovaLimits, \
    GraphNode, PolyResource
from goldstone.apps.glance.tasks import new_discover_glance_topology
from mock import patch


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


class DiscoverGlanceTopology(SimpleTestCase):
    """Test glance.tasks.discover_glance_topology."""

    class EmptyClientObject(object):
        """A class that simulates one of the get_glance_client() return
        values."""

        images_list = []

        class Images(object):

            def __init__(self, val):
                self.val = val

            def list(self):

                return self.val

        images = Images(images_list)

    def setUp(self):
        """Run before every test."""

        resources.graph.clear()

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
        for _, cloud_id in NODES:
            row = Image.objects.create(cloud_id=cloud_id, name="foobar")
            resources.graph.add_node(GraphNode(uuid=row.uuid,
                                               resourcetype=Image))
                                 
        # Create the resource graph edges.
        for source, dest in EDGES:
            # Find the from and to nodes.
            nodes = resources.nodes_of_type(Image)

            row = Image.objects.get(cloud_id=source[1])
            fromnode = [x for x in nodes if x.uuid == row.uuid][0]

            row = Image.objects.get(cloud_id=dest[1])
            tonode = [x for x in nodes if x.uuid == row.uuid][0]

            # Add the edge
            resources.graph.add_edge(fromnode, tonode)

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
        for nodetype, cloud_id in NODES:
            row = nodetype.objects.create(cloud_id=cloud_id, name="foobar")
            resources.graph.add_node(GraphNode(uuid=row.uuid,
                                               resourcetype=nodetype))

        # Create the resource graph edges.
        for source, dest in EDGES:
            # Find the from and to nodes.
            nodes = resources.nodes_of_type(source[0])
            row = source[0].objects.get(cloud_id=source[1])
            fromnode = [x for x in nodes if x.uuid == row.uuid][0]

            nodes = resources.nodes_of_type(dest[0])
            row = dest[0].objects.get(cloud_id=dest[1])
            tonode = [x for x in nodes if x.uuid == row.uuid][0]

            # Add the edge
            resources.graph.add_edge(fromnode, tonode)

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
        self.assertEqual(resources.graph.number_of_edges(), 2)
        self.assertEqual(resources.nodes_of_type(Image), [])

    @patch('goldstone.apps.glance.tasks.logger')
    @patch('goldstone.apps.glance.tasks.get_glance_client')
    def test_empty_rg_cloud_multi_noid(self, ggc, log):
        """Nothing in the resource graph; something in the cloud, and some the
        glance services don't have cloud_id.

        The ones without an id should be logged as errors, and the others
        should be added to the resource graph.

        """

        # Set up get_glance_client to return some glance services and other
        # services; some of the glance services won't have an id.
        import pdb; pdb.set_trace()

        cloud = self.EmptyClientObject()
        charlie = Image(name="charlie")
        jablowme = Image(name="jablowme")
        cloud.images_list = [charlie,
                             Image(name="foobar", cloud_id="5"),
                             Image(name="heywood", cloud_id="42"),
                             jablowme,
                             ]
        ggc.return_value = {"client": cloud, "region": "Siberia"}

        new_discover_glance_topology()

        self.assertEqual(resources.graph.number_of_nodes(), 2)
        self.assertEqual(log.call_args_list, [charlie, jablowme])

    def test_rg_cloud(self):
        """Cloud services exist, something in the graph, but the intersection
        is null, using cloud_id.

        The resource graph nodes should be deleted, and the new cloud services
        added.

        """

        pass

    def test_rg_cloud_by_name(self):
        """Cloud services exist, something in the graph, but the intersection
        is null, using name.
s
        The resource graph nodes should be deleted, and the new cloud services
        added.

        """

        pass

    def test_rg_cloud_hit(self):
        """Cloud services exist, something in the graph, and the intersection
        is not null, using cloud_id.

        Some of the resource graph nodes should be deleted, some should be
        updated, and new cloud services added.

        """

        pass

    def test_rg_cloud_hit_by_name(self):
        """Cloud services exist, something in the graph, and the intersection
        is not null, using name.

        Some of the resource graph nodes should be deleted, some should be
        updated, and the new cloud services added.

        """

        pass
