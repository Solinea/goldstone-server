"""Add-on utilities."""
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


def update_addon_nodes():
    """Update the Resource graph's add-on nodes and edges from the current
    Addon table.

    Nodes are:
       - deleted if they are no longer in the Addon table
       - added if they are in the Addon table, but not in the graph.
       - updated from the Addon table if they are already in the graph.

    """
    from django.forms.models import model_to_dict
    from goldstone.addons.models import Addon as AddonTable
    from goldstone.core.models import PolyResource, Addon

    # Remove Resource graph nodes that no longer exist.
    actual_names = set(x.name for x in AddonTable.objects.all())

    # For every node of this type in the persistent resource graph...
    for entry in Addon.objects.all():
        if entry.native_name not in actual_names:
            # This node isn't in the Addon table anymore, so delete it from the
            # persistent data.
            # TODO: What about inferior nodes, which were imported from the
            # add-on's models?
            # TODO: What about resource types that were imported from the
            # add-on?
            entry.delete()

    # For every Addon table row, add it to the persistent resource graph if
    # it's not there.
    for row in AddonTable.objects.all():
        # Try to find its corresponding persistent Resource graph node.
        if not Addon.objects.filter(native_name=row.name).exists():
            # The node doesn't exist. Create it.
            Addon.objects.create(native_id=row.name,
                                 native_name=row.name,
                                 cloud_attributes=model_to_dict(row))

    # Now fill in / update all nodes' outgoing edges.
    for node in PolyResource.objects.all():
        node.update_edges()
