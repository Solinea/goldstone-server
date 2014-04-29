# Copyright 2014 Solinea, Inc.
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

__author__ = 'John Stanford'

from django.conf import settings
from keystoneclient.apiclient.exceptions import ClientException
from goldstone.lru_cache import lru_cache
from keystoneclient.v2_0 import client as ksclient
from novaclient.v1_1 import client as nvclient
from cinderclient.v2 import client as ciclient
from neutronclient.v2_0 import client as neclient
import logging
import hashlib
import requests
from datetime import datetime
from urllib2 import urlparse
import json
from exceptions import LookupError
import socket
import functools
from datetime import date


logger = logging.getLogger(__name__)


class GoldstoneAuthError(Exception):
    pass


# @lru_cache(maxsize=16)
# def _get_keystone_client(user=settings.OS_USERNAME,
#                          passwd=settings.OS_PASSWORD,
#                          tenant=settings.OS_TENANT_NAME,
#                          auth_url=settings.OS_AUTH_URL):
#     """
#     Authenticate and cache a token.  If token doesn't work, caller should
#     clear the cache and retry.
#     """
#
#     try:
#         kt = client.Client(username=user,
#                            password=passwd,
#                            tenant_name=tenant,
#                            auth_url=auth_url)
#     except ClientException:
#         raise
#     else:
#         if kt.auth_token is None:
#             raise GoldstoneAuthError("Keystone client call succeeded, but "
#                                      "auth token was not returned.  Check "
#                                      "credentials.")
#         else:
#             md5 = hashlib.md5()
#             md5.update(kt.auth_token)
#             return {'client': kt, 'hex_token': md5.hexdigest()}

@lru_cache(maxsize=16)
def _get_client(service, user=settings.OS_USERNAME,
                passwd=settings.OS_PASSWORD,
                tenant=settings.OS_TENANT_NAME,
                auth_url=settings.OS_AUTH_URL):
    try:
        if service == 'keystone':
            c = ksclient.Client(username=user,
                                password=passwd,
                                tenant_name=tenant,
                                auth_url=auth_url)
            if c.auth_token is None:
                raise GoldstoneAuthError("Keystone client call succeeded, but "
                                         "auth token was not returned.  Check "
                                         "credentials.")
            else:
                md5 = hashlib.md5()
                md5.update(c.auth_token)
                return {'client': c, 'hex_token': md5.hexdigest()}
        elif service == 'nova':
            c = nvclient.Client(user, passwd, tenant, auth_url,
                                service_type='compute')
            return {'client': c}
        elif service == 'cinder':
            c = ciclient.Client(user, passwd, tenant, auth_url,
                                service_type='volume')
            return {'client': c}
        elif service == 'neutron':
            c = neclient.Client(user, passwd, tenant, auth_url)
            return {'client': c}
        else:
            raise GoldstoneAuthError("Unknown service")
    except ClientException:
        raise


_get_keystone_client = functools.partial(_get_client, service='keystone')
_get_nova_client = functools.partial(_get_client, service='nova')
_get_cinder_client = functools.partial(_get_client, service='cinder')
_get_neutron_client = functools.partial(_get_client, service='neutron')


def _is_v4_ip_addr(candidate):
    """
    check a string to see if it is a valid v4 ip address
    :arg str string to check
    :return boolean
    """
    try:
        socket.inet_pton(socket.AF_INET, candidate)
        return True
    except socket.error:
        return False


def _is_v6_ip_addr(candidate):
    """
    check a string to see if it is a valid v4 ip address
    :arg str string to check
    :return boolean
    """
    try:
        socket.inet_pton(socket.AF_INET6, candidate)
        return True
    except socket.error:
        return False


def _is_ip_addr(candidate):
    """
    check a string to see if it is a valid v4 or v6 ip address
    :arg str string to check
    :return boolean
    """
    return _is_v4_ip_addr(candidate) or _is_v6_ip_addr(candidate)


def _current_index(basename):
    """
    returns the name of the current ES index based on the date
    """
    now = date.today()
    return basename + "-" + now.strftime("%Y.%m.%d")


def _partition_hostname(hostname):
    """
    separates a hostname into host and domain parts
    """
    parts = hostname.partition('.')
    result = {'hostname': parts[0]}
    if len(parts) > 2:
        result['domainname'] = parts[2]

    return result


def _resolve_fqdn(ip_addr):
    """
    takes an IP address and tries to map it to a hostname and domain.
    returns None or a dict
    """
    try:
        resolved = socket.gethostbyaddr(ip_addr)
    except:
        return None
    else:
        return _partition_hostname(resolved[0])


def _resolve_addr(hostname):
    """
    takes a hostname and attempts to resolve the ip address
    """
    try:
        return socket.gethostbyname(hostname)
    except:
        return None


def _decompose_url(url):
    """
    returns the scheme, host, and possibly port for a url
    """
    result = {}
    url_parsed = urlparse(url)
    result['scheme'] = url_parsed[0]
    netloc = url_parsed[1]
    host = None
    if ":" in netloc:
        # host:port
        hp = netloc.split(':')
        host = hp[0]
        if len(hp) > 1:
            result['port'] = hp[1]
        result['port'] = hp[1] if len(hp) > 1 else None

    if _is_ip_addr(host):
        # try to resolve the address and
        result['ip_address'] = host
        hostname = _resolve_fqdn(host)
        if hostname:
            result['hostname'] = hostname['hostname']
            if 'domainname' in hostname:
                result['domainname'] = hostname['domainname']
    else:
        result = dict(result.items() + _partition_hostname(host).items())
        addr = _resolve_addr(host)
        if addr:
            result['ip_address'] = addr

    return result


def _construct_api_rec(reply, component, ts):
    td = reply.elapsed
    total_secs = (td.microseconds + (td.seconds + td.days * 24 * 3600) *
                  10**6) / 10**6
    rec = {'response_time': total_secs,
           'response_status': reply.status_code,
           'response_length': int(reply.headers['content-length']),
           'component': component,
           'uri': urlparse.urlparse(reply.url).path,
           '@timestamp': ts.strftime("%Y-%m-%dT%H:%M:%S." +
                                     str(int(round(ts.microsecond/1000))) +
                                     "Z")}
    logger.debug("response = %s",
                 json.dumps(rec))
    return rec


def stored_api_call(component, endpt, path, headers={}, data=None,
                    user=settings.OS_USERNAME,
                    passwd=settings.OS_PASSWORD,
                    tenant=settings.OS_TENANT_NAME,
                    auth_url=settings.OS_AUTH_URL):

    kt = _get_keystone_client(user, passwd, tenant, auth_url)

    try:
        url = kt['client'].service_catalog.\
            get_endpoints()[endpt][0]['publicURL'] + path

    except:
        raise LookupError("Could not find a public URL endpoint for %s", endpt)
    else:
        headers = dict(
            {'x-auth-token': kt['hex_token'],
             'content-type': 'application/json'}.items() +
            headers.items())
        t = datetime.utcnow()
        reply = requests.get(url, headers=headers, data=data)

        # someone could change the upstream password to
        # match the configuration credentials after the result was cached.
        if reply.status_code == requests.codes.unauthorized:
            logger.debug("clearing keystone client cache due to 401 response")
            _get_client.cache_clear()

        return {
            'reply': reply,
            'db_record': _construct_api_rec(reply, component, t)
        }
