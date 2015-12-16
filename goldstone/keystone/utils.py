"""Keystone utilities."""
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


def get_region():
    """Currently assumes that the cloud is a single region and takes the first
    one from the list returned from the keystone client regions manager."""

    client = get_client()
    return client.regions.list()[0].id


def get_session(cloud=None):
    """Get a keystone session that can be used to create clients for this and
    other services.  Assumes v2 semantics."""

    from goldstone.utils import get_cloud
    from keystoneclient.auth.identity import v2
    from keystoneclient import session


    if cloud is None:
        cloud = get_cloud()

    auth = v2.Password(
        username=cloud.username,
        tenant_name=cloud.tenant_name,
        password=cloud.password,
        auth_url=cloud.auth_url)

    return session.Session(auth=auth)


def get_client(session=None):
    """Get a client object from the keystone service"""

    from goldstone.utils import get_cloud
    from keystoneclient.v3 import client
    if session is None:
        cloud = get_cloud()
        session = get_session(cloud=cloud)

    return client.Client(session=session)


def update_nodes():
    """Update the Resource graph's Keystone nodes and edges from the current
    OpenStack cloud state.

    Nodes are:
       - deleted if they are no longer in the OpenStack cloud.
       - added if they are in the OpenStack cloud, but not in the graph.
       - updated from the cloud if they are already in the graph.

    """
    from goldstone.core.models import User, Project, Group, Domain, Region, \
        Endpoint, Service, Role
    from goldstone.core.utils import process_resource_type

    for entry in [Domain, Project, Group, User, Region, Endpoint, Service,
                  Role]:
        process_resource_type(entry)
