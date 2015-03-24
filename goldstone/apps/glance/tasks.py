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


@celery_app.task()
def discover_glance_topology():
    """Update the Glance nodes in the Resource Instance graph."""
    from datetime import datetime
    from goldstone.core.models import resources, Image
    from goldstone.utils import get_glance_client
    import pytz

    # Collect the glance images that exist in the OpenStack cloud, the region,
    # and the current date/time.
    client_access = get_glance_client()
    region = client_access["region"]
    actual_images = [x for x in client_access["client"].images.list()]
    actual_images_ids = set([x["id"] for x in actual_images])
    now = datetime.now(tz=pytz.utc)

    # First, we remove Resource graph nodesf that no longer exist.
    resources = resources.nodes_of_type(Image)

    for node in resources:
        if node[0].cloud_id not in actual_images_ids:
            # No Glance service has this resource node's cloud_id. Therefore,
            # this resource node no longer exists.  Delete it from the resource
            # graph.
            resource_instances.graph.remove_node(node[0])

            # # TODO: Do we need to delete it (and, conversely, store it) in
            # # the db?
            # node.delete()

    # Now, for every node in the OpenStack cloud, add it to the Resource graph
    # if it doesn't exist, or update its information if it does. Since we may
    # have just deleted some nodes, refresh the existing node list.
    resources = resources.nodes_of_type(Image)

    for cloud_id in actual_image_ids:
        if image in resources:
            # This Glance node still exists in our resource graph. Update its
            # attributes.
            resources.graph[node]["attributes"] = image
        else:
            # This is a new Glance node. Add it.
            resources.add_node(image)

        # Now update, or connect, this node's edges
        pass
