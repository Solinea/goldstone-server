"""Api_perf utilities."""
# Copyright 2015 Solinea, Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either expressed or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
import arrow
from django.conf import settings
from goldstone.utils import GoldstoneAuthError


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
    from goldstone.utils import get_keystone_client, get_cloud

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
    except:
        raise LookupError("Could not find a public URL endpoint for %s" %
                          endpoint)


def time_api_call(component, url, method='GET', **kwargs):
    """Call an API endpoint and persist the result.

    :param component: the api component
    :type component: str
    :param url: the endpoint to request
    :type url: str
    :param method: get, put, post, delete, patch, head
    :type method: str
    :param kwargs: optional arguments to pass to the request (ex: header, data)

    """
    from .models import ApiPerfData
    import requests
    from urlparse import urlparse

    reply = requests.request(method, url, **kwargs)

    if reply is None:
        now = arrow.utcnow()
        rec = ApiPerfData(component=component,
                          uri=urlparse(url).path,
                          creation_time=now.datetime,
                          response_time=settings.API_PERF_QUERY_TIMEOUT*1000,
                          response_status=504,
                          response_length=0)

        created = rec.save()
        return {'created': created, 'response': reply}

    return None
