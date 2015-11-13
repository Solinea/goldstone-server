"""TopologyView app unit tests."""
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

from goldstone.core import resource
from goldstone.test_utils import Setup

from .models import Image, Network, Project, Server, Interface, Volume
from .tests import load_persistent_rg
from .views import TopologyView

# Aliases to make the code less verbose
MAX = settings.R_ATTRIBUTE.MAX
MIN = settings.R_ATTRIBUTE.MIN
TYPE = settings.R_ATTRIBUTE.TYPE
TOPOLOGICALLY_OWNS = settings.R_EDGE.TOPOLOGICALLY_OWNS

# The initial resource graph nodes, as (Type, native_id) tuples. The
# native_id's must be unique within a node type.
NODES = [(Image, "a"),
         (Image, "ab"),
         (Image, "abc"),
         (Image, "0001"),
         (Image, "0002"),
         (Server, "0"),
         (Server, "1"),
         (Server, "2"),
         (Server, "ab"),
         (Interface, "0"),
         (Project, "p0"),
         (Server, "abc"),
         (Network, "n0"),
         (Image, "0003"),
         (Server, "abcd"),
         (Volume, "v0"),
         (Volume, "v1"),
         (Volume, "v2"),
         ]

# The initial resource graph edges. Each entry is ((from_type, native_id),
# (to_type, native_id), {edge_data}). The native_id's must be unique within a
# node type.
EDGES = [((Image, "a"),
          (Server, "0"),
          {TYPE: TOPOLOGICALLY_OWNS, MIN: 1, MAX: 1}),
         ((Image, "abc"),
          (Server, "1"),
          {TYPE: TOPOLOGICALLY_OWNS, MIN: 1, MAX: 1}),
         ((Image, "abc"),
          (Server, "2"),
          {TYPE: TOPOLOGICALLY_OWNS, MIN: 1, MAX: 1}),
         ((Image, "0001"),
          (Server, "ab"),
          {TYPE: TOPOLOGICALLY_OWNS, MIN: 1, MAX: 1}),
         ((Server, "ab"),
          (Interface, "0"),
          {TYPE: TOPOLOGICALLY_OWNS, MIN: 1, MAX: 1}),
         ((Project, "p0"),
          (Network, "n0"),
          {TYPE: TOPOLOGICALLY_OWNS, MIN: 1, MAX: 1}),
         ((Project, "p0"),
          (Image, "0003"),
          {TYPE: TOPOLOGICALLY_OWNS, MIN: 1, MAX: 1}),
         ((Project, "p0"),
          (Server, "abc"),
          {TYPE: TOPOLOGICALLY_OWNS, MIN: 1, MAX: 1}),
         ((Image, "0003"),
          (Server, "abc"),
          {TYPE: TOPOLOGICALLY_OWNS, MIN: 1, MAX: 1}),
         ((Image, "0003"),
          (Server, "abcd"),
          {TYPE: TOPOLOGICALLY_OWNS, MIN: 1, MAX: 1}),
         ((Server, "abcd"),
          (Volume, "v0"),
          {TYPE: TOPOLOGICALLY_OWNS, MIN: 1, MAX: 1}),
         ((Server, "abcd"),
          (Volume, "v1"),
          {TYPE: TOPOLOGICALLY_OWNS, MIN: 1, MAX: 1}),
         ((Server, "abcd"),
          (Volume, "v2"),
          {TYPE: TOPOLOGICALLY_OWNS, MIN: 1, MAX: 1}),
         ]


class TopologyViewTests(Setup):
    """Test TopologyView class."""

    def check_and_delete_uuid(self, node):
        """Verify that every node in a topology has a uuid key with a
        36-character string value, and then delete the uuid key.

        :param node: A node toplogy returned by TopologyView._tree()
        :type node: dict
        :return: The node topology with all uuid keys deleted
        :rtype: dict

        """

        self.assertIsInstance(node["uuid"], basestring)
        self.assertEqual(len(node["uuid"]), 36)
        del node["uuid"]

        if node["children"]:
            for child in node["children"]:
                self.check_and_delete_uuid(child)

        return node

    def test_tree_solo(self):

        """Call _tree() on a solo node."""

        # The expected results, sans UUID.
        EXPECTED = {"label": Image().label(),
                    "integration": Image.integration(),
                    "resource_list_url": "/glance/images/?region=None",
                    "children": None}

        # Create the PolyResource database rows.
        load_persistent_rg(NODES, EDGES)

        # Do the test.
        node = Image.objects.get(native_id="ab")
        node = resource.instances.get_uuid(node.uuid)

        result = TopologyView()._tree(node)   # pylint: disable=W0212

        self.check_and_delete_uuid(result)
        self.assertEqual(result, EXPECTED)

    def test_tree_1child(self):
        """Call _tree() on a node with one solo child."""

        EXPECTED = {"label": Image().label(),
                    "integration": Image.integration(),
                    "resource_list_url": "/glance/images/?region=None",
                    "children":
                    [{'label': Server().label(),
                      "integration": Server.integration(),
                      "resource_list_url":
                      "/nova/servers/?region=None&zone=None",
                      'children': None}]}

        # Create the PolyResource database rows.
        load_persistent_rg(NODES, EDGES)

        # Do the test.
        node = Image.objects.get(native_id="a")
        node = resource.instances.get_uuid(node.uuid)

        result = TopologyView()._tree(node)   # pylint: disable=W0212

        self.check_and_delete_uuid(result)
        self.assertEqual(result, EXPECTED)

    def test_tree_2child(self):
        """Call _tree() on a node with two solo children."""

        EXPECTED = {"label": Image().label(),
                    "integration": Image.integration(),
                    "resource_list_url": "/glance/images/?region=None",
                    "children":
                    [{'label': Server().label(),
                      "integration": Server.integration(),
                      "resource_list_url":
                      "/nova/servers/?region=None&zone=None",
                      'children': None},
                     {'label': Server().label(),
                      "integration": Server.integration(),
                      "resource_list_url":
                      "/nova/servers/?region=None&zone=None",
                      'children': None}]}

        # Create the PolyResource database rows.
        load_persistent_rg(NODES, EDGES)

        # Do the test.
        node = Image.objects.get(native_id="abc")
        node = resource.instances.get_uuid(node.uuid)

        result = TopologyView()._tree(node)   # pylint: disable=W0212

        self.check_and_delete_uuid(result)
        self.assertItemsEqual(result["children"], EXPECTED["children"])
        del result["children"]
        del EXPECTED["children"]
        self.assertEqual(result, EXPECTED)

    def test_tree_1grandchild(self):
        """Call _tree() on a node with one child with one child."""

        EXPECTED = {"label": Image().label(),
                    "integration": Image.integration(),
                    "resource_list_url": "/glance/images/?region=None",
                    "children":
                    [{'label': Server().label(),
                      "integration": Server.integration(),
                      "resource_list_url":
                      "/nova/servers/?region=None&zone=None",
                      'children':
                      [{'label': Interface().label(),
                        "integration": Interface.integration(),
                        "resource_list_url": '',
                        'children': None}],
                      }]}

        # Create the PolyResource database rows.
        load_persistent_rg(NODES, EDGES)

        # Do the test.
        node = Image.objects.get(native_id="0001")
        node = resource.instances.get_uuid(node.uuid)

        result = TopologyView()._tree(node)   # pylint: disable=W0212

        self.check_and_delete_uuid(result)
        self.assertEqual(result, EXPECTED)

    def test_tree_3child_2grandchild(self):
        """Call _tree() on a node that'll have two levels of grandchildren.

        One node will have two entries in the returned topology.

        """

        EXPECTED = {"label": Project().label(),
                    "integration": Project.integration(),
                    "resource_list_url": Project.resource_list_url(),
                    "children":
                    [{'label': Server().label(),
                      "integration": Server.integration(),
                      "resource_list_url":
                      "/nova/servers/?region=None&zone=None",
                      'children': None},
                     {'label': Network().label(),
                      "integration": Network.integration(),
                      "resource_list_url": Network.resource_list_url(),
                      'children': None},
                     {'label': Image().label(),
                      "integration": Image.integration(),
                      "resource_list_url": "/glance/images/?region=None",
                      'children':
                      [{'label': Server().label(),
                        "integration": Server.integration(),
                        "resource_list_url":
                        "/nova/servers/?region=None&zone=None",
                        'children': None},
                       {'label': Server().label(),
                        "integration": Server.integration(),
                        "resource_list_url":
                        "/nova/servers/?region=None&zone=None",
                        'children':
                        [{'label': Volume().label(),
                          "integration": Volume.integration(),
                          "resource_list_url": "/cinder/volumes/?region=None",
                          'children': None},
                         {'label': Volume().label(),
                          "integration": Volume.integration(),
                          "resource_list_url": "/cinder/volumes/?region=None",
                          'children': None},
                         {'label': Volume().label(),
                          "integration": Volume.integration(),
                          "resource_list_url": "/cinder/volumes/?region=None",
                          'children': None}],
                        }],
                      }],
                    }

        # Create the PolyResource database rows.
        load_persistent_rg(NODES, EDGES)

        # Do the test.
        node = Project.objects.get(native_id="p0")
        node = resource.instances.get_uuid(node.uuid)

        result = TopologyView()._tree(node)   # pylint: disable=W0212

        self.check_and_delete_uuid(result)

        # This is messy. Python uses AssertListEqual for nested structures.
        # Hence, the "children" lists may spuriously compare unqeual. I
        # couldn't get addTypeEqualityFunc() to work, and gave up since this is
        # a unit test. But the following doesn't feel Pythonic at all.

        e_image_node = [x for x in EXPECTED["children"]
                        if x["label"] == Image().label()][0]
        e_server_node = [x for x in e_image_node["children"]
                         if x["children"]][0]

        r_image_node = [x for x in result["children"]
                        if x["label"] == Image().label()][0]
        r_server_node = [x for x in r_image_node["children"]
                         if x["children"]][0]

        self.assertItemsEqual(e_server_node["children"],
                              r_server_node["children"])

        del e_server_node["children"]
        del r_server_node["children"]

        self.assertItemsEqual(e_image_node["children"],
                              r_image_node["children"])

        del e_image_node["children"]
        del r_image_node["children"]

        self.assertItemsEqual(EXPECTED["children"], result["children"])

        del EXPECTED["children"]
        del result["children"]

        self.assertEqual(result, EXPECTED)
