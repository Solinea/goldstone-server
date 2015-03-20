"""Api_perf utilities."""
# Copyright '2015' Solinea, Inc.
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

def stack_api_request_base(endpoint, path, os_username, os_password, os_tenant,
                           os_auth_url):
    """Look up the openstack endpoint for a component, and return the URL and
    authorization headers that can be used for a request.

    :param endpoint:
    :param path:
    :param os_username:
    :param os_password:
    :param os_tenant:
    :param os_auth_url:
    :return: dict of url and headers

    """
    from goldstone.utils import get_keystone_client, GoldstoneAuthError

    try:
        keystone_client = get_keystone_client(os_username,
                                              os_password,
                                              os_tenant,
                                              os_auth_url)

        url = keystone_client['client'].service_catalog.\
            get_endpoints()[endpoint][0]['publicURL'] + path
        headers = {'x-auth-token': keystone_client['hex_token'],
                   'content-type': 'application/json'}

        return {'url': url, 'headers': headers}

    except GoldstoneAuthError:
        raise
    except Exception:  # pylint: disable=W0703
        raise LookupError("Could not find a public URL endpoint for %s" %
                          endpoint)
