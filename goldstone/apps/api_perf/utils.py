# Copyright '2015' Solinea, Inc.
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
from arrow import Arrow
from django.conf import settings
import logging
from goldstone.utils import GoldstoneAuthError


logger = logging.getLogger(__name__)


def _construct_api_rec(reply, component, created, timeout, url):
    """Build an API performance record.

    :type reply: Response or None
    :param reply: the HTTP response from a request
    :type component: str
    :param component: the component name for the requested endpoint
    :type created: Arrow
    :param created: the creation date for the record
    :type timeout:
    :param timeout: request timeout value
    :type url: str
    :param url:

    """
    from urlparse import urlparse

    assert type(created) is Arrow, "created is not an Arrow object"
    rec = {'component': component,
           'uri': urlparse(url).path,
           'created': created.datetime}

    if reply is None:
        rec['response_time'] = timeout*1000
        rec['response_status'] = 504
        rec['response_length'] = 0

    else:
        timedelta = reply.elapsed
        secs = timedelta.seconds + timedelta.days * 24 * 3600
        fraction = float(timedelta.microseconds) / 10**6
        millisecs = int(round((secs + fraction) * 1000))

        rec['response_time'] = millisecs
        rec['response_status'] = reply.status_code
        rec['response_length'] = int(reply.headers['content-length'])

    return rec


def openstack_api_request_base(endpoint, path,
                               user=settings.OS_USERNAME,
                               passwd=settings.OS_PASSWORD,
                               tenant=settings.OS_TENANT_NAME,
                               auth_url=settings.OS_AUTH_URL):
    """Look up the openstack endpoint for a component, and build up the url
    and auth headers that can be used for a request.
    :param endpoint:
    :param path:
    :param user:
    :param passwd:
    :param tenant:
    :param auth_url:
    :return: dict of url and headers
    """

    from goldstone.utils import get_keystone_client

    try:
        keystone_client = get_keystone_client(user=user,
                                              passwd=passwd,
                                              tenant=tenant,
                                              auth_url=auth_url)
        url = keystone_client['client'].service_catalog.\
            get_endpoints()[endpoint][0]['publicURL'] + path
        headers = {'x-auth-token': keystone_client['hex_token'],
                   'content-type': 'application/json'}
        import json
        logger.info('result = %s', json.dumps({'url': url, 'headers': headers}))
        return {'url': url, 'headers': headers}

    except GoldstoneAuthError:
        raise
    except:
        raise LookupError("Could not find a public URL endpoint for %s",
                          endpoint)


def time_api_call(component, url, method='GET', **kwargs):
    """
    Call an API endpoint and persist the result
    :type component: str
    :param component: the api component
    :type url: str
    :param url: the endpoint to request
    :type method: str
    :param method: get, put, post, delete, patch, head
    :param kwargs: optional arguments to pass to the request (ex: header, data)
    """
    from goldstone.models import ApiPerfData
    from django.conf import settings
    import requests

    reply = requests.request(method, url, **kwargs)
    now = arrow.utcnow()
    rec = _construct_api_rec(reply,
                             component,
                             now,
                             timeout=settings.API_PERF_QUERY_TIMEOUT,
                             url=url)

    api_db = ApiPerfData(kwargs=rec)
    created = api_db.save()
    return {'created': created, 'response': reply}