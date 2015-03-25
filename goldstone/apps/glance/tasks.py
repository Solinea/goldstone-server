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
    from goldstone.utils import get_glance_client

    # Get the system's sole OpenStack cloud.
    glance_access = get_glance_client()

    _update_glance_image_records(glance_access['client'],
                                 glance_access['region'])


@celery_app.task()
def new_discover_glance_topology():
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

    # Create a set of Image nodes, each one representing a Glance service.
    actual_images = set()

    # For every found OpenStack glance service...
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

        # The entirety of this glance service's information will be preserved
        # in an "attributes" attribute attached to the object.
        image = Image(cloud_id=cloud_id, name=name)
        image.attributes = entry
        actual_images.add(image)

    actual_images_ids = set([x["id"] for x in actual_images])
    actual_images_names = set([x["name"] for x in actual_images])

    glance_tuples = resources.nodes_of_type(Image)

    # Remove Resource graph nodes that no longer exist. For every glance node
    # in the resource graph...
    for entry in glance_tuples:
        if entry[0].cloud_id not in actual_images_ids and \
           entry[0].name not in actual_images_names:
            # No Glance service has this resource node's cloud_id, or its
            # name. Therefore, this resource node no longer exists.  Delete it.
            resources.graph.remove_node(entry[0])

            # # TODO: Do we need to delete it (and, conversely, store it) in
            # # the db?
            # entry[0].delete()

    # Now, for every OpenStack cloud service, add it to the Resource graph if
    # not present, or update its information if it is. Since we may have just
    # deleted some nodes, refresh the existing node list.

    # TODO: strictly necessary?
    glance_nodes = [x[0] for x in resources.nodes_of_type(Image)]

    # For every service in the OpenStack cloud...
    for image in actual_images:
        # Collect its cloud id and name, and try to find it.
        node = resources.locate(glance_nodes,
                                **{"cloud_id": image["id"],
                                   "name": image["name"]})

        if node:
            # This node corresponds to this OpenStack service. Update its
            # attributes.
            resources.graph[node]["cloud_id"] = image["cloud_id"]
            resources.graph[node]["name"] = image["name"]
            resources.graph[node]["attributes"] = image.attributes
        else:
            # This is a new Glance node. Add it.
            resources.add_node(image)

        # Now update, or connect, this node's edges
        # TODO: How?
        pass
