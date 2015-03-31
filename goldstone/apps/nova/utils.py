"""Nova app utilities."""
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
from goldstone.utils import TopologyMixin, NoResourceFound, GoldstoneAuthError
from .models import AvailZonesData


class DiscoverTree(TopologyMixin):

    def __init__(self):
        self.azs = AvailZonesData().get()

    def _get_region_names(self):
        if self.azs is None:
            return []
        else:
            return set([s['region'] for s in self.azs])

    def get_regions(self):
        return [{"rsrcType": "region", "label": r}
                for r in self._get_region_names()]

    def _populate_regions(self):
        result = []
        updated = self.azs[0]['@timestamp']

        for region in self._get_region_names():
            result.append(
                {"rsrcType": "region",
                 "label": region,
                 "info": {"last_updated": updated},
                 "children": [
                     {
                         "rsrcType": "flavors-leaf",
                         "label": "flavors",
                         "region": region,
                         "info": {
                             "last_update": updated
                         }
                     },
                     {
                         "rsrcType": "hypervisors-leaf",
                         "label": "hypervisors",
                         "region": region,
                         "info": {
                             "last_update": updated
                         }
                     }
                 ]}
            )

        return result

    def _get_zones(self, updated, region):
        """
        returns the zone structure derived from both services.
        has children hosts populated as the attachment point for the services
        and volumes in the graph.
        """
        zones = set(
            [zn['zoneName']
             for zn in self.azs[0]['availability_zones']]
        )

        result = []
        for zone in zones:
            # create children for services, volumes, backups, and snapshots
            result.append({
                "rsrcType": "zone",
                "label": zone,
                "region": region,
                "info": {
                    "last_update": updated
                },
                "children": [
                    {
                        "rsrcType": "aggregates-leaf",
                        "label": "aggregates",
                        "region": region,
                        "zone": zone,
                        "info": {
                            "last_update": updated
                        }
                    },
                    {
                        "rsrcType": "hosts-leaf",
                        "label": "hosts",
                        "region": region,
                        "zone": zone,
                        "info": {
                            "last_update": updated
                        }
                    },
                    {
                        "rsrcType": "servers-leaf",
                        "label": "instances",
                        "region": region,
                        "zone": zone,
                        "info": {
                            "last_update": updated
                        }
                    },
                    {
                        "rsrcType": "services-leaf",
                        "label": "services",
                        "region": region,
                        "zone": zone,
                        "info": {
                            "last_update": updated
                        }
                    }
                ]
            })

        return result

    def build_topology_tree(self):

        try:
            if self.azs is None or len(self.azs.hits) == 0:
                raise NoResourceFound(
                    "No nova availability zones found in database")

            updated = self.azs[0]['@timestamp']

            regions = self._populate_regions()
            new_rl = []

            for region in regions:
                zones = self._get_zones(updated, region['label'])
                state = {'sourceRsrcType': 'zone',
                         'targetRsrcType': 'region',
                         'conditions':
                         "%source%['region'] == %target%['label']"}
                region = self._attach_resource(state, zones, [region])[0]

                new_rl.append(region)

            if len(new_rl) > 1:
                return {"rsrcType": "cloud", "label": "Cloud",
                        "children": new_rl}
            else:
                return new_rl[0]

        except (IndexError, NoResourceFound):
            return {"rsrcType": "error", "label": "No data found"}

        except GoldstoneAuthError:
            raise


def reconcile_nova_hosts():
    """Update the Resource graph Nova nodes and edges from the current
    OpenStack cloud state.

    Nova nodes are:
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
