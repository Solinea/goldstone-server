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
import logging

logger = logging.getLogger(__name__)


@celery_app.task()
def discover_glance_topology():
    """Update the Glance nodes in the Resource graph.

    Resource graph nodes are deleted if they are no longer in the OpenStack
    cloud.

    """
    from datetime import datetime
    from goldstone.core.models import resources, Image
    from goldstone.utils import get_glance_client
    import pytz

    # Collect the glance images that exist in the OpenStack cloud, the region,
    # and the current date/time.
    client_access = get_glance_client()
    # region = client_access["region"]
    # actual_images = [x for x in client_access["client"].images.list()]
    # actual_images_ids = set([x["id"] for x in actual_images])

    # Create a set of Image nodes, each one representing a Glance service.
    actual_images = set()

    # For every OpenStack glance service that was found...
    for entry in client_access["client"].images.list():
        cloud_id = entry.get("id")
        name = entry.get("file")

        if not cloud_id and not name:
            # If there's no OpenStack id and no name, what do we call this
            # thing?
            logger.critical("This glance service has no OpenStack id and no"
                            " file name. We can't process it: %s",
                            entry)
            continue

        # The entirety of the information returned about this glance service
        # will be preserved in an "attributes" attribute attached to the
        # object.
        image = Image(cloud_id=cloud_id, name=name)
        image.attributes = entry
        actual_images.add(image)
        
    actual_images_ids = set([x["id"] for x in actual_images])

    resources = resources.nodes_of_type(Image)

    # Remove Resource graph nodes that no longer exist. For every glance node
    # in the resource graph...
    for node in resources:
        if node[0].cloud_id not in actual_images_ids:
            # No Glance service has this resource node's cloud_id. Therefore,
            # this resource node no longer exists.  Delete it from the resource
            # graph.
            resources.graph.remove_node(node[0])

            # # TODO: Do we need to delete it (and, conversely, store it) in
            # # the db?
            # node[0].delete()

    # Now, for every OpenStack cloud service, add it to the Resource graph if
    # not present, or update its information if it is. Since we may have just
    # deleted some nodes, refresh the existing node list.

    # TODO: strictly necessary?
    resources = resources.nodes_of_type(Image)

    # For every service in the OpenStack cloud...
    for cloud_id in actual_image_ids:
        node = resources.cloud_id_in(cloud_id, resources)

        if node:
            # This node corresponds this OpenStack service. Update its
            # attributes.
            resources.graph[node]["attributes"] = image
        else:
            # This is a new Glance node. Add it.
            resources.add_node(image)

        # Now update, or connect, this node's edges
        # TODO: How?
        pass
