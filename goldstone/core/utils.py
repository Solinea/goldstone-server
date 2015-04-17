"""Core utilities."""
# Copyright '2015' Solinea, Inc.
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
import logging

from django.conf import settings
import elasticsearch
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler
from rest_framework.viewsets import ReadOnlyModelViewSet
from goldstone.apps.drfes.utils import es_custom_exception_handler
from .models import resources, resource_types

logger = logging.getLogger(__name__)

# Aliases to make the code less verbose.
EDGE_ATTRIBUTES = settings.R_ATTRIBUTE.EDGE_ATTRIBUTES
MATCHING_FN = settings.R_ATTRIBUTE.MATCHING_FN
TYPE = settings.R_ATTRIBUTE.TYPE


class JsonReadOnlyViewSet(ReadOnlyModelViewSet):
    """A base ViewSet that renders a JSON response for "list" actions; i.e.,
    GET requests for a collection of objects.

    This must be subclassed.

    Implementing views on new data sources is achieved by subclassing
    this class, and defining the model, key, and zone_key class attributes.
    Then, adding the DjangoRestFramework ViewSet code to the URLconf.

    N.B. settings.REST_FRAMEWORK defines some global settings,
    including default renderer classes, which includes the JSON
    renderer.

    """

    # These must be defined by the subclass.
    model = lambda: None
    key = None

    # This may be defined by subclass.
    zone_key = None

    def _get_objects(self, request_zone, request_region):
        """Return a collection of objects.

        :param request_zone: The request's "zone", if present.
        :type request_zone: str or None
        :param request_region: The request's "region", if present.
        :type request_region: str or None

        """

        try:
            data = self.model().get()

            result = []

            for item in data:
                region = item['region']

                if request_region is None or request_region == region:
                    timestamp = item['@timestamp']

                    new_list = []

                    for rec in item[self.key]:
                        if request_zone is None or self.zone_key is None or \
                                request_zone == rec[self.zone_key]:
                            rec['region'] = region
                            rec['@timestamp'] = timestamp
                            new_list.append(rec)

                    result.append(new_list)

            return result

        except TypeError:
            return [[]]

    def list(self, request, *args, **kwargs):
        """Implement the GET request for a collection."""

        # Extract a zone or region provided in the request, if present.
        request_zone = request.query_params.get('zone')
        request_region = request.query_params.get('region')

        # Now fetch the data and return it as JSON.
        return Response(self._get_objects(request_zone, request_region))

    def retrieve(self, request, *args, **kwargs):
        """We do not implement single-object GET."""
        from django.http import HttpResponseNotAllowed

        return HttpResponseNotAllowed('')


def custom_exception_handler(exc, context):
    """Return a response from customized exception handling.

    :param exc: An exception
    :type exc: Exception

    """

    # Call REST framework's default exception handler first,
    # to get the standard error response.
    response = exception_handler(exc, context)

    # All other generated exceptions should be logged and handled here.
    if response is None:
        if isinstance(exc, elasticsearch.exceptions.ElasticsearchException) or\
           isinstance(exc, elasticsearch.exceptions.ImproperlyConfigured):

            response = es_custom_exception_handler(exc)

        elif isinstance(exc, Exception):
            data = {'detail': "There was an error processing this request. "
                              "Please file a ticket with support.",
                    'message': str(exc)}
            logger.exception(exc)
            response = Response(data,
                                status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        else:
            # not an exception
            return None

    return response


def _add_edges(node):
    """Add edges from this resource graph node to its neighbors.

    This is driven by the node's type information in resource_types.

    :param node: A Resource graph node
    :type node: GraphNode

    """

    # For every possible edge from this node...
    for edge in resource_types.graph.out_edges(node.resourcetype, data=True):
        # This is the desired neighbor's type and matching function for this
        # edge.
        neighbor_type = edge[1]
        match_fn = edge[2][MATCHING_FN]

        # For all nodes that are of the desired type...
        for candidate in resources.nodes_of_type(neighbor_type):
            if match_fn(node.attributes, candidate.attributes):
                # We have a match! Create the edge from the node to this
                # candidate.
                resources.graph.add_edge(node,
                                         candidate,
                                         attr_dict={TYPE: edge[2][TYPE]})


def process_resource_type(nodetype):
    """Update the Resource graph nodes that are of, and the outgoing edges
    from, this type.

    Nodes are:
       - deleted if they are no longer in the OpenStack cloud.
       - added if they are in the OpenStack cloud, but not in the graph.
       - updated from the cloud if they are already in the graph.

    :param nodetype: A type of Resource graph node, i.e., a node in the
                     Resource Type graph.
    :type nodetype: PolyResource subclass

    """
    from goldstone.core.models import GraphNode

    # Get the cloud instances that are of the "nodetype" type.
    actual = nodetype.clouddata()

    # Remove Resource graph nodes that no longer exist.  We use the first
    # edge's destination node's matching_attributes' source key value, and look
    # for a match in the resource graph.
    resource_nodes = resources.nodes_of_type(nodetype)
    actual_cloud_instances = set([nodetype.identity(x) for x in actual if x])

    # For every node of this type in the resource graph...
    for entry in resource_nodes:
        # Check this node's identifying attribute value.
        if nodetype.identity(entry.attributes) not in actual_cloud_instances:
            # This node does not appear to be in the cloud anymore. Delete it.
            resources.graph.remove_node(entry)
            nodetype.objects.get(uuid=entry.uuid).delete()

    # Now, for every node of this type in the OpenStack cloud service, add it
    # to the Resource graph if it's not present, or update its information if
    # it is. Since we may have just deleted some nodes, refresh the existing
    # node list.

    # N.B. We could reuse resource_nodes as-is, but this is a little cleaner.
    resource_nodes = resources.nodes_of_type(nodetype)

    # For every current node of the desired nodetype, having an identifying
    # attribute that's present...
    for entry in actual:
        source_value = nodetype.identity(entry)

        if source_value:
            # Try to find its corresponding Resource graph node.
            node = resources.locate(resource_nodes,
                                    nodetype.identity,
                                    source_value)

            if node:
                # This resource node corresponds to this cloud service. Update
                # its information in the graph and database.
                node.attributes = entry
                db_node = nodetype.objects.get(uuid=node.uuid)
                db_node.attributes = entry
                db_node.save()
            else:
                # This is a new node. Add it to the Resource graph and database
                # table.
                db_node = nodetype.objects.create(cloud_id=entry.get("id"),
                                                  name=entry.get("name", ''))
                resources.graph.add_node(GraphNode(uuid=db_node.uuid,
                                                   resourcetype=nodetype,
                                                   attributes=entry))

    # Now, update the outgoing edges of every node of this type in the resource
    # graph.
    for node in resource_nodes:
        # Delete the existing edges. It's simpler to do this and potentially
        # add them back, than to check whether an existing edge matches what's
        # currently in the cloud.
        resources.graph.remove_edges_from(resources.graph.edges(node))

        _add_edges(node)
