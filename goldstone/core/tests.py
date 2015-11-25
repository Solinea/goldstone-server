"""Core app unit tests.

This module demonstrates no less than 3 strategies for mocking ES.

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
from django.test import SimpleTestCase
import elasticsearch
import mock
from mock import patch, MagicMock
from rest_framework.test import APISimpleTestCase

from goldstone.test_utils import Setup
from .models import Image, ServerGroup, NovaLimits, PolyResource, Host, \
    Aggregate, Hypervisor, Port, Cloudpipe, Network, Project, Server, Addon

from . import tasks
from .utils import custom_exception_handler, process_resource_type, parse

# Using the latest version of django-polymorphic, a
# PolyResource.objects.all().delete() throws an IntegrityError exception. So
# when we need to clear the PolyResource table, we'll individually delete each
# subclass.
NODE_TYPES = [Image, ServerGroup, NovaLimits, Host, Aggregate, Cloudpipe, Port,
              Hypervisor, Project, Network, Server, Addon]

# Aliases to make the code less verbose
TYPE = settings.R_ATTRIBUTE.TYPE


def load_persistent_rg(startnodes, startedges):
    """Create PolyResource database rows.

    :param startnodes: The nodes to add.
    :type startnodes: A "NODES" iterable
    :param startedges: The edges to add.
    :type startedges: An "EDGES" iterable

    """

    nameindex = 0

    # Create the resource nodes. Each will have a unique name. Note that
    # the native_id is stored in the .attributes attribute.
    for nodetype, native_id in startnodes:
        nodetype.objects.create(native_id=native_id,
                                native_name="name_%d" % nameindex)
        nameindex += 1

    # Create the resource graph edges. We don't use the update_edges() method,
    # because some of these tests test it. Each startedges entry may have two
    # or three values. Each row's edge information is currently empty.
    for entry in startedges:
        # Unpack the entry.
        source = entry[0]
        dest = entry[1]
        attributes = entry[2] if len(entry) == 3 else {}

        # Get the from and to nodes.
        fromnode = source[0].objects.get(native_id=source[1])
        tonode = dest[0].objects.get(native_id=dest[1])

        # Add the edge
        edges = fromnode.edges
        edges.append((tonode.uuid, attributes))

        # Save it in the row.
        fromnode.edges = edges
        fromnode.save()


class TaskTests(SimpleTestCase):
    """Test task hooks."""

    def test_delete_indices(self):
        """Tests that delete indices returns result of check_call."""

        tasks.check_call = mock.Mock(return_value='mocked')
        # pylint: disable=W0212
        self.assertEqual(tasks.delete_indices('abc', 10), 'mocked')


class PolyResourceModelTests(SimpleTestCase):
    """Test the PolyResourceModel."""

    def test_logs(self):
        """Test that the logs method returns an appropriate search object."""

        expectation = {'bool': {
            'must': [{'query_string': {'query': 'polly'}}],
            'must_not': [{'term': {u'loglevel.raw': 'AUDIT'}}]}}

        polyresource = PolyResource(native_name='polly')
        result = polyresource.logs().to_dict()
        self.assertDictEqual(expectation, result['query'])

        expectation = [{'@timestamp': {'order': 'desc'}}]
        self.assertListEqual(expectation, result['sort'])

    def test_events(self):
        """test that the events method returns an appropriate search object."""

        expectation = {"query_string":
                       {"query": "\"polly\"", "default_field": "_all"}}
        polyresource = PolyResource(native_name='polly')
        result = polyresource.events().to_dict()
        self.assertTrue(expectation in result['query']['bool']['must'])


class CustomExceptionHandlerTests(APISimpleTestCase):
    """Tests for DRF custom exception handling."""

    def test_drf_handled_exception(self):
        """Test that we pass DRF recognized exceptions through unmodified"""

        with patch('goldstone.core.utils.exception_handler') \
                as exception_handler:

            exception_handler.return_value = "it's handled"
            result = custom_exception_handler(None, None)
            self.assertTrue(exception_handler.called)
            self.assertEqual(result, "it's handled")

    def test_502_error_exceptions(self):
        """Test ES connection exception is handled"""

        with patch('goldstone.core.utils.exception_handler') \
                as exception_handler:

            exception_handler.return_value = None
            result = custom_exception_handler(
                elasticsearch.exceptions.ConnectionError("oops"), None)
            self.assertTrue(exception_handler.called)
            self.assertEqual(result.status_code, 502)

    def test_500_error_exceptions(self):
        """Test ES connection exception is handled"""

        with patch('goldstone.core.utils.exception_handler') \
                as exception_handler:

            exception_handler.return_value = None
            result = custom_exception_handler(
                elasticsearch.exceptions.SerializationError("oops"), None)
            self.assertTrue(exception_handler.called)
            self.assertEqual(result.status_code, 500)

            result = custom_exception_handler(
                elasticsearch.exceptions.ImproperlyConfigured("oops"), None)
            self.assertTrue(exception_handler.called)
            self.assertEqual(result.status_code, 500)

            result = custom_exception_handler(
                elasticsearch.exceptions.TransportError("oops"), None)
            self.assertTrue(exception_handler.called)
            self.assertEqual(result.status_code, 500)

            exception_handler.return_value = None
            result = custom_exception_handler(Exception("oops"), None)
            self.assertTrue(exception_handler.called)
            self.assertEqual(result.status_code, 500)

    def test_not_exception(self):
        """Test ES connection exception is handled"""

        with patch('goldstone.core.utils.exception_handler') \
                as exception_handler:

            exception_handler.return_value = None
            result = custom_exception_handler('what??', None)
            self.assertTrue(exception_handler.called)
            self.assertEqual(result, None)


class UpdateEdges(SimpleTestCase):
    """Test PolyResource.update_edges."""

    def setUp(self):
        """Run before every test."""

        for nodetype in NODE_TYPES:
            nodetype.objects.all().delete()

    def test_no_edges(self):
        """The source node's type has no edges.

        Normally, this condition should never occur. Regardless, nothing should
        be done.

        """

        # Test data. Each entry is (Type, native_id).
        NODES = [(Host, "deadbeef")]

        load_persistent_rg(NODES, [])

        # Get the Host instance and do the test.
        node = Host.objects.all()[0]
        node.outgoing_edges = MagicMock()
        node.outgoing_edges.return_value = []
        node.update_edges()

        # Test the results, re-reading from the db.
        node = Host.objects.all()[0]
        self.assertEqual(node.edges, [])

    def test_neighbor_no_matchtype(self):
        """The candidates for a node's destination neighbor have no matching
        attribute.

        Nothing should be done.

        """

        # The initial resource graph nodes, as (Type, native_id) tuples.  The
        # native_id's must be unique within a node type. The Host type can form
        # outgoing links to Aggregate and Hypervisor nodes.
        NODES = [(Host, "deadbeef"),
                 (Aggregate, "0"),
                 (Hypervisor, "1"),
                 (Hypervisor, "2")]

        load_persistent_rg(NODES, [])

        # Set up the host attributes.
        node = Host.objects.all()[0]
        node.cloud_attributes = {"host_name": "fred"}
        node.save()

        # Modify the candidate destination nodes' attributes so they don't have
        # the desired match key.
        for target_type in [Aggregate, Hypervisor]:
            for row in target_type.objects.all():
                row.cloud_attributes = {"silly": "putty", "emacs": "sacred"}
                row.save()

        # Do the test.
        node.update_edges()

        # Test the results, re-reading from the db.
        node = Host.objects.all()[0]
        self.assertEqual(node.edges, [])

    def test_no_attribute_value(self):
        """The node's neighbor has a matching attribute, but its value does not
        match the source node's.

        Nothing should be done.

        """

        # The initial resource graph nodes, as (Type, native_id) tuples.  The
        # native_id's must be unique within a node type. The Host type can form
        # outgoing links to Aggregate and Hypervisor nodes.
        NODES = [(Host, "deadbeef"),
                 (Aggregate, "0"),
                 (Hypervisor, "1"),
                 (Hypervisor, "2")]

        load_persistent_rg(NODES, [])

        # Set up the host attributes.
        node = Host.objects.all()[0]
        node.cloud_attributes = {"host_name": "fred"}
        node.save()

        # Modify the candidate destination nodes' attributes so they have the
        # desired match key, but the values won't match.
        for target_type in [Aggregate, Hypervisor]:
            for row in target_type.objects.all():
                row.cloud_attributes = {"hosts": "putty",
                                        "hypervisor_hostname": "sacred"}
                row.save()

        # Do the test.
        node.update_edges()

        # Test the results, re-reading from the db.
        node = Host.objects.all()[0]
        self.assertEqual(node.edges, [])

    def test_no_matching_nghbr_types(self):
        """No instance matches the desired type for the neighbor, although
        they happen to have matching match_attributes.

        Nothing should be done.

        """

        # The initial resource graph nodes, as (Type, native_id) tuples.  The
        # native_id's must be unique within a node type. The Host type can form
        # outgoing links to Aggregate and Hypervisor nodes.
        NODES = [(Host, "deadbeef"),
                 (Image, "deadbeef"),
                 (Cloudpipe, "deadbeef"),
                 (Port, "deadbeef")]

        load_persistent_rg(NODES, [])

        # Set up the host attributes.
        node = Host.objects.all()[0]
        node.cloud_attributes = {"host_name": "fred"}
        node.save()

        # Modify the non-candidate destination nodes' attributes so they have
        # the desired match key and value.
        for target_type in [Image, Cloudpipe, Port]:
            for row in target_type.objects.all():
                row.cloud_attributes = {"hosts": "fred",
                                        "hypervisor_hostname": "fred"}
                row.save()

        node.update_edges()

        # Test the results, re-reading from the db.
        node = Host.objects.all()[0]
        self.assertEqual(node.edges, [])

    def test_multiple_neighbor_matches(self):
        """Multiple instances match the desired neighbor type.

        Edges should be added from the source node to the mutiple destinations.

        """

        # The initial resource graph nodes, as (Type, native_id) tuples.  The
        # native_id's must be unique within a node type. The Host type can form
        # outgoing links to Aggregate and Hypervisor nodes.
        NODES = [(Host, "deadbeef"),
                 (Image, "cad"),
                 (Cloudpipe, "deadbeef"),
                 (Project, "cad"),
                 (Port, "cad"),
                 (Network, "cad")]

        load_persistent_rg(NODES, [])

        # Set up the project attributes.
        node = Project.objects.all()[0]
        node.cloud_attributes = {"id": node.native_id}
        node.save()

        # Modify the candidate destination nodes' attributes so they
        # all have id keys.
        for target_type in [Image, Cloudpipe, Port, Network, Host]:
            for row in target_type.objects.all():
                row.cloud_attributes = {"id": row.native_id}
                row.save()

        # Do the test.
        node.update_edges()

        # Test the results, re-reading from the db.
        node = Project.objects.all()[0]
        self.assertEqual(len(node.edges), 4)

        # Test the types of edges created. There should be one edge to the
        # image node, one to the port node, and two to the network node.
        #
        # Image destination.
        dest = Image.objects.all()[0]
        edge = [x for x in node.edges if x[0] == dest.uuid]
        self.assertEqual(len(edge), 1)
        #
        # Port destination.
        dest = Port.objects.all()[0]
        edge = [x for x in node.edges if x[0] == dest.uuid]
        self.assertEqual(len(edge), 1)
        #
        # Network destinations.
        dest = [x.uuid for x in Network.objects.all()]
        edges = [x for x in node.edges if x[0] in dest]
        self.assertEqual(len(edges), 2)


class ProcessResourceType(Setup):
    """Test utilities.process_resource_type."""

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

        super(ProcessResourceType, self).setUp()

        for nodetype in NODE_TYPES:
            nodetype.objects.all().delete()

    @patch('goldstone.core.models.get_glance_client')
    def test_empty_rg_empty_cloud(self, ggc):
        """Nothing in the resource graph, nothing in the cloud.

        Nothing should be done.

        """

        # Set up get_glance_client to return an empty OpenStack cloud.
        ggc.return_value = {"client": self.EmptyClientObject(),
                            "region": "Siberia"}

        process_resource_type(Image)

        self.assertEqual(PolyResource.objects.count(), 0)

    @patch('goldstone.core.models.get_glance_client')
    def test_rg_empty_cloud_image(self, ggc):
        """The resource graph contains only Image instances; nothing in the
        cloud.

        All of the resource graph nodes should be deleted.

        """

        # The initial resource graph nodes, as (Type, native_id) tuples.
        NODES = [(Image, "a"), (Image, "ab"), (Image, "abc")]

        # The initial resource graph edges. Each entry is ((from_type,
        # native_id), (to_type, native_id)).
        EDGES = [((Image, "a"), (Image, "ab")), ((Image, "abc"), (Image, "a"))]

        # Create the PolyResource database rows.
        load_persistent_rg(NODES, EDGES)

        # Set up get_glance_client to return an empty OpenStack cloud.
        ggc.return_value = {"client": self.EmptyClientObject(),
                            "region": "Siberia"}

        process_resource_type(Image)

        self.assertEqual(PolyResource.objects.count(), 0)

    @patch('goldstone.core.models.get_glance_client')
    def test_rg_other_empty_cloud(self, ggc):
        """Something in the resource graph, some of which are non-Image
        instances; nothing in the cloud.

        Only the Image resource graph nodes should be deleted.

        """

        # The initial resource graph nodes, as (Type, native_id) tuples.  The
        # native_id's must be unique within a node type.
        NODES = [(Image, "a"),
                 (Image, "ab"),
                 (Image, "abc"),
                 (Image, "0001"),
                 (Image, "0002"),
                 (ServerGroup, "0"),
                 (ServerGroup, "ab"),
                 (NovaLimits, "0")]

        # The initial resource graph edges. Each entry is ((from_type,
        # native_id), (to_type, native_id)).  The native_id's must be unique
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

        # Create the PolyResource database rows.
        load_persistent_rg(NODES, EDGES)

        # Set up get_glance_client to return an empty OpenStack cloud.
        ggc.return_value = {"client": self.EmptyClientObject(),
                            "region": "Siberia"}

        process_resource_type(Image)

        self.assertEqual(PolyResource.objects.count(), 3)


class ParseTests(SimpleTestCase):
    """Test the query string parser."""

    def test_one_variable(self):
        """Various forms of single-variable query strings that can be submitted
        to /core/resources/<uuid>/ or /core/resource_types/<unique_id>/."""

        # Each entry is (query_string, expected_result). The query string
        # format must be as that returned from calling urlparse.urlparse() --
        # e.g., the string is still URL-encoded.
        TESTS = [('', {}),
                 ("native_id=deadbeef", {"native_id": "deadbeef"}),
                 ("native_id=%5edeadbeef", {"native_id": "^deadbeef"}),
                 ("native_id=deadbeef%20biscuit",
                  {"native_id": 'deadbeef biscuit'}),
                 ("native_id=deadbeef%20OR%20bob",
                  {"native_id": "deadbeef|bob"}),
                 ("native_id=tom%20dick%20harry",
                  {"native_id": "tom dick harry"}),
                 ("native_id=tom%20OR%20dick%20OR%20harry",
                  {"native_id": "tom|dick|harry"}),
                 ("native_id=%5etom%20dick%20harry",
                  {"native_id": "^tom dick harry"}),
                 ("native_id=%5etom%20dick%20OR%20harry",
                  {"native_id": "^tom dick|^harry"}),
                 ("native_id=%5etom%20OR%20dick%20harry",
                  {"native_id": '^tom|^dick harry'}),
                 ("native_id=%5etom%20OR%20dick%20harry%20%20hmm",
                  {"native_id": '^tom|^dick harry  hmm'}),

                 # Now, with a leading '?'.
                 ("?native_id=deadbeef", {"native_id": "deadbeef"}),
                 ("?native_id=%5edeadbeef", {"native_id": "^deadbeef"}),
                 ("?native_id=deadbeef%20biscuit",
                  {"native_id": 'deadbeef biscuit'}),
                 ("?native_id=deadbeef%20OR%20bob",
                  {"native_id": "deadbeef|bob"}),
                 ("?native_id=tom%20dick%20harry",
                  {"native_id": "tom dick harry"}),
                 ("?native_id=tom%20OR%20dick%20OR%20harry",
                  {"native_id": "tom|dick|harry"}),
                 ("?native_id=%5etom%20dick%20harry",
                  {"native_id": "^tom dick harry"}),
                 ("?native_id=%5etom%20dick%20OR%20harry",
                  {"native_id": "^tom dick|^harry"}),
                 ("?native_id=%5etom%20OR%20dick%20harry",
                  {"native_id": '^tom|^dick harry'}),
                 ("?native_id=%5etom%20OR%20dick%20harry%20%20hmm",
                  {"native_id": '^tom|^dick harry  hmm'}),
                 ]

        for test, expected in TESTS:
            self.assertEqual(parse(test), expected)

    def test_multiple_variables(self):
        """Various forms of multi-variable query strings that can be submitted
        to /core/resources/<uuid>/ or /core/resource_types/<unique_id>/."""

        # Each entry is (query_string, expected_result). The query string
        # format must be as that returned from calling urlparse.urlparse() --
        # e.g., the string is still URL-encoded.
        TESTS = [("native_id=deadbeef&john=bob",
                  {"native_id": "deadbeef", "john": "bob"}),
                 ("native_id=%5edeadbeef&native_name=fred",
                  {"native_id": "^deadbeef", "native_name": "fred"}),
                 ("native_id=%5edeadbeef&"
                  "native_name=fred%20OR%20mary%20OR%20william",
                  {"native_id": "^deadbeef",
                   "native_name": "fred|mary|william"}),
                 ("native_id=deadbeef%20OR%20beefDEAD&integration=nova",
                  {"native_id": 'deadbeef|beefDEAD', "integration": "nova"}),
                 ("native_id=deadbeef%20biscuit&"
                  "integration=%5ekeystone%20OR%20glance&"
                  "native_name=b%20OR%20c",
                  {"native_id": 'deadbeef biscuit',
                   "integration": '^keystone|^glance',
                   "native_name": "b|c"}),
                 ("native_id=%5edeadbeef&integration=glance%20200",
                  {"native_id": '^deadbeef', "integration": 'glance 200'}),

                 # Now, with a leading '?'.
                 ("?native_id=deadbeef&john=bob",
                  {"native_id": "deadbeef", "john": "bob"}),
                 ("?native_id=%5edeadbeef&native_name=fred",
                  {"native_id": "^deadbeef", "native_name": "fred"}),
                 ("?native_id=%5edeadbeef&"
                  "native_name=fred%20OR%20mary%20OR%20william",
                  {"native_id": "^deadbeef",
                   "native_name": "fred|mary|william"}),
                 ("?native_id=deadbeef%20OR%20beefDEAD&integration=nova",
                  {"native_id": 'deadbeef|beefDEAD', "integration": "nova"}),
                 ("?native_id=deadbeef%20biscuit&"
                  "integration=%5ekeystone%20OR%20glance&"
                  "native_name=b%20OR%20c",
                  {"native_id": 'deadbeef biscuit',
                   "integration": '^keystone|^glance',
                   "native_name": "b|c"}),
                 ("?native_id=%5edeadbeef&integration=glance%20200",
                  {"native_id": '^deadbeef', "integration": 'glance 200'}),
                 ]

        for test, expected in TESTS:
            self.assertEqual(parse(test), expected)
