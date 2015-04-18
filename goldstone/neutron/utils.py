"""Neutron utilities."""
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
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either expressed or implied.
# See the License for the specific language governing permissions and
# limitations under the License.


def get_neutron_client(username, password, tenant_name, auth_url):
    """Return a Neutron client using Keystone v2.0 authentication.

    Neutron does not support Keystone v3 authentication. See
    http://specs.openstack.org/openstack/neutron-specs/specs/juno/
    keystone-v3-api-support.html.

    This function replace the auth_url's "/v3" with "/v2.0" (if it exists),
    makes the call, and returns the client.

    This function should be deleted when neutron is updated for keystone v3
    authentication.

    """
    from neutronclient.v2_0 import client as neclient

    return neclient.Client(username=username,
                           password=password,
                           tenant_name=tenant_name,
                           auth_url=auth_url.replace("/v3", "/v2.0"))
