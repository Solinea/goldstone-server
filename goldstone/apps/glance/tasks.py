"""Glance tasks."""
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
from __future__ import absolute_import
from goldstone.celery import app as celery_app
from goldstone.utils import get_glance_client
import logging

logger = logging.getLogger(__name__)


def _update_glance_image_records(client, region):
    from datetime import datetime
    from goldstone.utils import to_es_date
    from .models import ImagesData
    import pytz

    images_list = client.images.list()

    # Image list is a generator, so we need to make it not sol lazy it...
    body = {"@timestamp": to_es_date(datetime.now(tz=pytz.utc)),
            "region": region,
            "images": [i for i in images_list]}

    data = ImagesData()

    try:
        data.post(body)
    except Exception:          # pylint: disable=W0703
        logging.exception("failed to index glance images")


@celery_app.task()
def discover_glance_topology():
    """Update Goldstone's glance data."""

    # Get the system's sole OpenStack cloud.
    glance_access = get_glance_client()

    _update_glance_image_records(glance_access['client'],
                                 glance_access['region'])


def _add_edges(node):
    """Add all the edges to/from this resource graph node that we can find in
    the current OpenStack cloud.

    :param node: A Resource graph node
    :type node: GraphNode

    """

    # This maps the neighbor's index in an edge tuple to the kind of edge we're
    # evaluating. (The neighbor is [0] for incoming edges and [1] for outoing
    # edges.)
    NEIGHBOR_MAP = [(resource_types.in_edges, 0),
                    (resource_types.out_edges, 1)]

    # For incoming and outgoing edges...
    for edge_fn, neighbor_index in NEIGHBOR_MAP:
        # For every type of edge to/from this node...
        for edge in edge_fn(node):
            # The neighbor node's type.
            neighbor_type = edge[neighbor_index]

            # Get the matching attribute we're to look for.
            for matchtype, attribute in \
                    neighbor_type.EdgeNavigation.matching_attributes:
                if matchtype == neighbor_type:
                    break
            else:
                logger.critical("No edge matching attribute found for the "
                                "destination node. Skipping...: "
                                "%s, %s, %s, %s",
                                node,
                                resource_glance_nodes,
                                edge,
                                neighbor_type)
                continue

            # Get the attribute's value for this node.
            node_attribute_value = node.attributes.get(attribute)

            # Now, find the Resource node that's a match.
            for candidate in resource.nodes_of_type(neighbor_type):
                # Get the candidate's match attribute's value.
                candidate_attribute_value = candidate.attributes.get(attribute)

                if candidate_attribute_value == node_attribute_value:
                    # We have a match! Create the edge from the node to this
                    # candidate.
                    resource.graph.add_edge(
                        node,
                        candidate,
                        attr_dict={R_ATTRIBUTE.TYPE:
                                   edge[2][R_ATTRIBUTE.TYPE]})
                    # Iterate to the next edge.
                    break


@celery_app.task()
def new_discover_glance_topology():

    """Update the Resource graph Glance nodes and edges from the current
    OpenStack cloud state.

    Resource graph nodes are:
       - deleted if they are no longer in the OpenStack cloud.
       - added if they are in the OpenStack cloud, but not in the graph.
       - updated from the cloud if they are already in the graph.

    """
    from goldstone.core.models import resources, Image, GraphNode

    # Collect the glance images that exist in the OpenStack cloud.
    client_access = get_glance_client()
    actual = []

    # For every found OpenStack glance service...
    for entry in client_access["client"].images.list():
        if not entry.get("id"):
            # If there's no OpenStack id, what do we call this thing?
            logger.critical("This glance service has no OpenStack id, so  "
                            "we can't process it: %s",
                            entry)
            continue

        # The entirety of this glance service's information will be preserved
        # in an "attributes" attribute attached to the object.
        actual.append(entry)

    # Check for glance services having duplicate OpenStack ids, a.k.a.
    # cloud_ids. This should never happen. We'll log these, but won't filter
    # them out, in case they contain useful information.
    #
    # N.B. Python 2.6 doesn't have collections.Counter, so do it the hard way.
    # duplicates = [x for x, y in collections.Counter(actual).items() if y > 1]
    seen_cloud_ids = set()
    duplicates = []
    for entry in actual:
        if entry["id"] in seen_cloud_ids:
            duplicates.append(entry)
        else:
            seen_cloud_ids.add(entry["id"])

    if duplicates:
        logger.critical("These glance services' OpenStack UUIDs are duplicates"
                        " of other glance services. This shouldn't happen: %s",
                        duplicates)

    resource_glance_nodes = resources.nodes_of_type(Image)
    actual_cloud_ids = set([x["id"] for x in actual])
    db_nodes = Image.objects.all()

    # Remove Resource graph nodes that no longer exist. For every glance node
    # in the resource graph...
    for entry in resource_glance_nodes:
        # Use this node's Goldstone uuid to get its cloud_id.
        db_node = db_nodes.get(uuid=entry.uuid)

        if db_node.cloud_id not in actual_cloud_ids:
            # No Glance service matches this resource node. Delete it.
            resources.graph.remove_node(entry)
            db_node.delete()

    # For every OpenStack cloud service, add it to the Resource graph if not
    # present, or update its information if it is. Since we may have just
    # deleted some nodes, refresh the existing node list.

    # N.B. We could reuse this iterable, but this is a little cleaner.
    resource_glance_nodes = resources.nodes_of_type(Image)

    # For every current glance service...
    for glance in actual:
        # Try to find its corresponding Resource graph node.
        node = resources.locate(resource_glance_nodes, **{"id": glance["id"]})

        if node:
            # This node corresponds to this glance service. Update its
            # information in the Resource graph and database.
            node.attributes = glance
            db_node = db_nodes.get(cloud_id=glance["id"])
            db_node.attributes = glance
            db_node.save()
        else:
            # This is a new Glance node. Add it to the Resource graph and
            # database.
            db_node = Image.objects.create(cloud_id=glance["id"],
                                           name=glance.get("name", ''))
            resources.graph.add_node(GraphNode(uuid=db_node.uuid,
                                               resourcetype=Image,
                                               attributes=glance))

    # Now, update the edges of every glance node in the resource graph.
    for node in resource_glance_nodes:
        # Delete the existing edges. It's simpler to delete them and
        # potentially add them back, than to check whether an existing edge
        # matches what's currently in the cloud.
        for edge in resources.graph.edges(node):
            resources.graph.remove_edges(edge[0], edge[1])

        _add_edges(node)
