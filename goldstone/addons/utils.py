"""Addon utilities."""
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


def update_addon_node():
    """Update the persistent resource graph's Addon node.

    This is much simpler than the update_xxxxx_nodes functions that update
    nodes for cloud entities. There will be only one Addon node in the table,
    and all add-ons will be owned by it. If we're running for the first time,
    the Addon node needs to be created. If it's already there, we leave it
    alone.

    This also differs from update_xxxxx_nodes by returning the Addon node that
    is found or created.

    """
    from goldstone.core.models import Addon

    result, _ = Addon.objects.get_or_create(native_id="Add-on",
                                            native_name="Add-on")

    return result
