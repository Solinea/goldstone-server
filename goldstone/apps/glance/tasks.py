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
    now = datetime.now(tz=pytz.utc)

    # First, we will remove nodes from the Resource Instance graph
    # that no longer exist.
    resources = resources.nodes_of_type(Image)

    import pdb; pdb.set_trace()
    for node in resources:
        if node.attributes not in actual_images:
            # No Glance service has this resource node's attributes. Therefore,
            # this resource node no longer exists.  Delete it from the resource
            # graph and the db.
            resource_instances.graph.remove_node(node)
            node.delete()

    # Now, for every node in the OpenStack cloud, add it to the Resource
    # Instasnce graph (if it doesn't exist) or update its information (if it
    # does.)
    resources = resources.nodes_of_type(Image)

    import pdb; pdb.set_trace()
    for image in actual_images:
        if image in resources:
            # This Glance node still exists in our resource graph. Update its
            # attributes.
            resources.graph[node]["attributes"] = image
        else:
            # This is a new Glance node. Add it.
            resources.add_node(image)

        # Now update, or connect, this node's edges
