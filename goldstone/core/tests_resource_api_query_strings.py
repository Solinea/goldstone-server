"""Resource graph API unit tests.

Tests:
    /core/resources/?xxxxxxxxx...

These focus on the query strings. We assume other tests have exercised the
non-filtered code paths.

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

from goldstone.core.resource import Instances, GraphNode
from goldstone.test_utils import Setup, create_and_login, \
    AUTHORIZATION_PAYLOAD
import json
from mock import patch
from rest_framework.status import HTTP_200_OK
from .tests_resource_api_2 import RES_URL

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

# URLs with query strings used in these tests.
RES_URL_FILTER = RES_URL + "?%s"


class CoreResources(Setup):
    """Test /core/resources/?xxxxxxxxxxx."""

    def test_empty(self):
        """The resource graph is empty."""

        # Create a user.
        token = create_and_login()

        # Mock out resources so that it has no nodes or edges.
        mock_r_graph = Instances()
        mock_r_graph.graph.clear()

        # Test one filter, and two filters.
        with patch("goldstone.core.views.resource.instances", mock_r_graph):
            for filters in ["native_id=fred",
                            "integration_name=%5enova&native_id=fred"]:
                response = self.client.get(
                    RES_URL_FILTER % filters,
                    HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

                # pylint: disable=E1101
                self.assertEqual(response.status_code, HTTP_200_OK)
                self.assertEqual(json.loads(response.content),
                                 {"nodes": [], "edges": []})

    # pylint: disable=R0914
    def test_mix(self):
        """The resource graph is populated with a mixture of nodes."""
        from goldstone.core import resource

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

        # The query strings to try, and the expected results. Each entry is
        # query_string: (the expected node results, the expected number of
        # edges).
        QUERIES = {
            "?native_name=%5eh":
            [[{u'native_id': u'12345',
               u'native_name': u'host 1',
               u'resourcetype':
               {u'label': u'hosts',
                u'unique_id':
                u"<class 'goldstone.core.models.Host'>"},
               },
              {u'native_id': u'1234',
               u'native_name': u'host 0',
               u'resourcetype':
               {u'label': u'hosts',
                u'unique_id':
                u"<class 'goldstone.core.models.Host'>"},
               },
              {u'native_id': u'f23456',
               u'native_name': u'hypervisor 0',
               u'resourcetype':
               {u'label': u'hypervisors',
                u'unique_id':
                u"<class 'goldstone.core.models.Hypervisor'>"},
               },
              {u'native_id': u'f2345',
               u'native_name': u'hypervisor 0',
               u'resourcetype':
               {u'label': u'hypervisors',
                u'unique_id':
                u"<class 'goldstone.core.models.Hypervisor'>"},
               },
              {u'native_id': u'123456',
               u'native_name': u'host 2',
               u'resourcetype':
               {u'label': u'hosts',
                u'unique_id':
                u"<class 'goldstone.core.models.Host'>"},
               },
              {u'native_id': u'f234',
               u'native_name': u'hypervisor 0',
               u'resourcetype':
               {u'label': u'hypervisors',
                u'unique_id':
                u"<class 'goldstone.core.models.Hypervisor'>"},
               },
              ],
             5],
            "?native_name=imi":
            [[{u'native_id': u'l123456',
               u'native_name': u'limits 2',
               u'resourcetype':
               {u'label': u'limits',
                u'unique_id':
                u"<class 'goldstone.core.models.Limits'>"},
               },
              {u'native_id': u'l12345',
               u'native_name': u'limits 1',
               u'resourcetype':
               {u'label': u'limits',
                u'unique_id':
                u"<class 'goldstone.core.models.Limits'>"},
               },
              {u'native_id': u'l1234',
               u'native_name': u'limits 0',
               u'resourcetype':
               {u'label': u'limits',
                u'unique_id':
                u"<class 'goldstone.core.models.Limits'>"},
               },
              ],
             6],
            "?native_id=derosa": [[], 0],
            "?integration_name=neutron%20OR%20keystone":
            [[{u'native_id': u'p2',
               u'native_name': u'project 2',
               u'resourcetype':
               {u'label': u'projects',
                u'unique_id':
                u"<class 'goldstone.core.models.Project'>"},
               },
              {u'native_id': u'p1',
               u'native_name': u'project 1',
               u'resourcetype':
               {u'label': u'projects',
                u'unique_id':
                u"<class 'goldstone.core.models.Project'>"},
               },
              {u'native_id': u'p0',
               u'native_name': u'project 0',
               u'resourcetype':
               {u'label': u'projects',
                u'unique_id':
                u"<class 'goldstone.core.models.Project'>"},
               },
              {u'native_id': u'n12345',
               u'native_name': u'network 1',
               u'resourcetype':
               {u'label': u'networks',
                u'unique_id':
                u"<class 'goldstone.core.models.Network'>"},
               },
              {u'native_id': u'n1234',
               u'native_name': u'network 0',
               u'resourcetype':
               {u'label': u'networks',
                u'unique_id':
                u"<class 'goldstone.core.models.Network'>"},
               },
              ],
             10],
            "?integration_name=nova&native_id=45":
            [[{u'native_id': u'12345',
               u'native_name': u'host 1',
               u'resourcetype':
               {u'label': u'hosts',
                u'unique_id':
                u"<class 'goldstone.core.models.Host'>"},
               },
              {u'native_id': u'f23456',
               u'native_name': u'hypervisor 0',
               u'resourcetype':
               {u'label': u'hypervisors',
                u'unique_id':
                u"<class 'goldstone.core.models.Hypervisor'>"},
               },
              {u'native_id': u'f2345',
               u'native_name': u'hypervisor 0',
               u'resourcetype':
               {u'label': u'hypervisors',
                u'unique_id':
                u"<class 'goldstone.core.models.Hypervisor'>"},
               },
              {u'native_id': u'123456',
               u'native_name': u'host 2',
               u'resourcetype':
               {u'label': u'hosts',
                u'unique_id':
                u"<class 'goldstone.core.models.Host'>"},
               },
              ],
             4],
            "?integration_name=neutron&native_name=1":
            [[{u'native_id': u'n12345',
               u'native_name': u'network 1',
               u'resourcetype':
               {u'label': u'networks',
                u'unique_id':
                u"<class 'goldstone.core.models.Network'>"},
               },
              ],
             2]
        }

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

        # Create a user.
        token = create_and_login()

        # Do the test.
        for query_string, value in QUERIES.iteritems():
            expected_nodes = value[0]
            expected_edges = value[1]

            response = self.client.get(
                RES_URL_FILTER % query_string,
                HTTP_AUTHORIZATION=AUTHORIZATION_PAYLOAD % token)

            # Test the results.
            # pylint: disable=E1101
            self.assertEqual(response.status_code, HTTP_200_OK)

            # Test the result's edge count.
            content = json.loads(response.content)
            self.assertEqual(expected_edges, len(content["edges"]))

            # Test the result's nodes, sans UUIDs.
            for entry in content["nodes"]:
                del entry["uuid"]

            self.assertItemsEqual(content["nodes"], expected_nodes)
