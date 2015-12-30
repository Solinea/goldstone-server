"""Glance app utilities."""
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


def get_client(session=None):
    """Get a glance v2 client from a keystone session."""

    from goldstone.keystone.utils import get_session
    from glanceclient import client

    if session is None:
        session = get_session()

    return client.Client(version='2', session=session)


def update_nodes():
    """Update the Resource graph's Glance nodes and edges from the current
    OpenStack cloud state.

    Glance nodes are:
       - deleted if they are no longer in the OpenStack cloud.
       - added if they are in the OpenStack cloud, but not in the graph.
       - updated from the cloud if they are already in the graph.

    """
    from goldstone.core.models import Image
    from goldstone.core.utils import process_resource_type

    process_resource_type(Image)
