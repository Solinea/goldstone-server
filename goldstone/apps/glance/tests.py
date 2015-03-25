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
from goldstone.core.models import resources, Image, ServerGroup, NovaLimits
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

        # The initial resource graph nodes. The names must be unique within
        # a node type.
        NODES = [Image(name="foobar", cloud_id="ab"),
                 Image(name="foo", cloud_id="abcd"),
                 Image(name="bar", cloud_id="abcde"),
                 ]
        # The initial resource graph edges. Each entry is ((from_type,
        # from_name), (to_type, to_name)).
        EDGES = [((Image, "foo"), (Image, "bar")),
                 ((Image, "foobar"), (Image, "foo")),
                 ]

        # Create some nodes and edges in the resource graph.
        import pdb; pdb.set_trace()
        resources.graph.add_nodes_from(NODES)
        for source, dest in EDGES:
            # Find the from node.
            fromnodes = resources.nodes_of_type(source[0])
            fromnode = [x[0] for x in fromnodes if x[0].name == source[1]][0]

            # Find the to node.
            tonodes = resources.nodes_of_type(dest[0])
            tonode = [x[0] for x in tonodes if x[0].name == dest[1]][0]

            # Add the edge
            resources.graph.add_edge(fromnode, tonode)

        # Sanity check
        self.assertEqual(resources.graph.number_of_nodes(), len(NODES))
        self.assertEqual(resources.graph.number_of_edges(), len(EDGES))

        # Set up get_glance_client to return an empty OpenStack cloud.
        ggc.return_value = {"client": self.EmptyClientObject(),
                            "region": "Siberia"}

        new_discover_glance_topology()

        self.assertEqual(resources.graph.number_of_nodes(), 0)
        self.assertEqual(resources.graph.number_of_edges(), 0)

    @patch('goldstone.apps.glance.tasks.get_glance_client')
    def test_rg_other_empty_cloud(self, ggc):
        """Something in the resource graph, some of which are non-Image
        instances; nothing in the cloud.

        The Image resource graph nodes should be deleted.

        """

        # The initial resource graph nodes. The names must be unique within
        # a node type.
        NODES = [Image(name="foobar", cloud_id="ab"),
                 Image(name="foo", cloud_id="abcd"),
                 Image(name="bar", cloud_id="abcde"),
                 ServerGroup(name="server"),
                 NovaLimits(name="nova", cloud_id="dddd"),
                 ]
        # The initial resource graph edges. Each entry is ((from_type,
        # from_name), (to_type, to_name)).
        EDGES = [((Image, "foo"), (NovaLimits, "nova")),
                 ((Image, "foobar"), (ServerGroup, "server")),
                 ((NovaLimits, "nova"), (ServerGroup, "server")),
                 ((Image, "bar"), (Image, "foobar")),
                 ((ServerGroup, "server"), (Image, "bar")),
                 ((ServerGroup, "server"), (NovaLimits, "nova")),
                 ((Image, "foo"), (ServerGroup, "server")),
                 ]

        # Create some nodes and edges in the resource graph.
        resources.graph.add_nodes_from(NODES)
        for source, dest in EDGES:
            # Find the from node.
            fromnodes = resources.nodes_of_type(source[0])
            fromnode = [x[0] for x in fromnodes if x[0].name == source[1]][0]

            # Find the to node.
            tonodes = resources.nodes_of_type(dest[0])
            tonode = [x[0] for x in tonodes if x[0].name == dest[1]][0]

            # Add the edge
            resources.graph.add_edge(fromnode, tonode)

        # Sanity check
        self.assertEqual(resources.graph.number_of_nodes(), len(NODES))
        self.assertEqual(resources.graph.number_of_edges(), len(EDGES))

        # Set up get_glance_client to return an empty OpenStack cloud.
        ggc.return_value = {"client": self.EmptyClientObject(),
                            "region": "Siberia"}

        new_discover_glance_topology()

        self.assertEqual(resources.graph.number_of_nodes(), 2)
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
