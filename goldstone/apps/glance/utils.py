"""Glance app utilities."""
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
from goldstone.apps.glance.models import ImagesData
from goldstone.utils import _get_region_for_glance_client, NoResourceFound, \
    TopologyMixin


class DiscoverTree(TopologyMixin):

    def __init__(self):
        self.images = ImagesData().get()

    def _get_image_regions(self):
        return set([s['region'] for s in self.images])

    def get_regions(self):
        from goldstone.utils import get_client

        keystone = get_client('keystone')['client']

        return [{"rsrcType": "region",
                 "label": _get_region_for_glance_client(keystone)}]

    def _populate_regions(self):

        result = []
        updated = self.images[0]['@timestamp']

        for region in self._get_image_regions():
            result.append(
                {"rsrcType": "region",
                 "label": region,
                 "info": {"last_updated": updated},
                 "children": [
                     {
                         "rsrcType": "images-leaf",
                         "label": "images",
                         "region": region,
                         "info": {
                             "last_update": updated
                         }
                     }
                 ]}
            )

        return result

    def build_topology_tree(self):

        try:
            if self.images is None or len(self.images.hits) == 0:
                raise NoResourceFound("No glance images found in database")

            regions = self._populate_regions()

            if len(regions) > 1:
                return {"rsrcType": "cloud",
                        "label": "Cloud",
                        "children": regions}
            else:
                return regions[0]

        except (IndexError, NoResourceFound):
            return {"rsrcType": "error", "label": "No data found"}


def reconcile_glance_hosts():
    """Update the Resource graph Glance nodes and edges from the current
    OpenStack cloud state.

    Glance nodes are:
       - deleted if they are no longer in the OpenStack cloud.
       - added if they are in the OpenStack cloud, but not in the graph.
       - updated from the cloud if they are already in the graph.

    """
    from goldstone.core.models import Image, GraphNode

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
        # Delete the existing edges. It's simpler to do this and potentially
        # add them back, than to check whether an existing edge matches what's
        # currently in the cloud.
        resources.graph.remove_edges_from(resources.graph.edges(node))

        _add_edges(node)
