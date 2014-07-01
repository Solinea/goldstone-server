# Copyright 2014 Solinea, Inc.
#
# Licensed under the Solinea Software License Agreement (goldstone),
# Version 1.0 (the "License"); you may not use this file except in compliance
# with the License. You may obtain a copy of the License at:
#
#     http://www.solinea.com/goldstone/LICENSE.pdf
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import pytz

__author__ = 'John Stanford'

from django.conf import settings
from goldstone.lru_cache import lru_cache
import cinderclient.v2.services
from keystoneclient.v2_0 import client as ksclient
from novaclient.v1_1 import client as nvclient
from cinderclient.v2 import client as ciclient
from neutronclient.v2_0 import client as neclient
from glanceclient.v2 import client as glclient
import logging
import hashlib
import requests
from requests.exceptions import Timeout
from datetime import datetime
from urlparse import urlparse
import json
from exceptions import LookupError
import socket
import functools
from datetime import date
import calendar
import math
from keystoneclient.openstack.common.apiclient.exceptions \
    import Unauthorized as KeystoneUnauthorized
from novaclient.openstack.common.apiclient.exceptions \
    import Unauthorized as NovaUnauthorized
from cinderclient.openstack.common.apiclient.exceptions \
    import Unauthorized as CinderUnauthorized
from neutronclient.common.exceptions import Unauthorized as NeutronUnauthorized


logger = logging.getLogger(__name__)


# hacking in a patch for the cinder service __repr__ method
def _patched_cinder_service_repr(self):
    return "<Service: %s>" % self.binary


class GoldstoneBaseException(Exception):
    pass


class GoldstoneAuthError(GoldstoneBaseException):
    pass


class NoDailyIndex(GoldstoneBaseException):
    pass


class NoResourceFound(GoldstoneBaseException):
    pass


def utc_timestamp():
    return calendar.timegm(datetime.now(tz=pytz.utc).timetuple())


def to_es_date(d):
    s = d.strftime('%Y-%m-%dT%H:%M:%S.')
    s += '%03d' % int(round(d.microsecond / 1000.0))
    s += d.strftime('%z')
    return s


def _get_region_for_client(catalog, management_url, service_type):
    """
    returns the region for a management url and service type given the service
    catalog.
    """
    candidates = [
        svc
        for svc in catalog if svc['type'] == service_type
    ]

    matches = [
        ep
        for cand in candidates
        for ep in cand['endpoints']
        if ep['internalURL'] == management_url
        or ep['publicURL'] == management_url
        or ep['adminURL'] == management_url
    ]

    if len(matches) < 1:
        raise GoldstoneBaseException(
            "no matching region found for management url [" +
            management_url + "]")
    elif len(matches) > 1:
        logger.warn("multiple endpoints have matching management urls,"
                    "using first one.")

    return matches[0]['region']


def _get_region_for_cinder_client(client):
    # force authentication to populate management url
    client.authenticate()
    mgmt_url = client.client.management_url
    kc = _get_keystone_client()['client']
    catalog = kc.service_catalog.catalog['serviceCatalog']
    return _get_region_for_client(catalog, mgmt_url, 'volume')


def _get_region_for_glance_client(client):
    mgmt_url = client.endpoints.find(service_id=client.services.
                                     find(name='glance').id).internalurl
    catalog = client.service_catalog.catalog['serviceCatalog']
    return _get_region_for_client(catalog, mgmt_url, 'image')


def get_region_for_nova_client(client):
    mgmt_url = client.client.management_url
    catalog = client.client.service_catalog.catalog['access']['serviceCatalog']
    return _get_region_for_client(catalog, mgmt_url, 'compute')


def get_region_for_keystone_client(client):
    mgmt_url = client.management_url
    catalog = client.service_catalog.catalog['serviceCatalog']
    return _get_region_for_client(catalog, mgmt_url, 'identity')


@lru_cache(maxsize=16)
def _get_client(service, user=settings.OS_USERNAME,
                passwd=settings.OS_PASSWORD,
                tenant=settings.OS_TENANT_NAME,
                auth_url=settings.OS_AUTH_URL):

    if service == 'keystone':
        c = None
        try:
            c = ksclient.Client(username=user,
                                password=passwd,
                                tenant_name=tenant,
                                auth_url=auth_url)
            if c.auth_token is None:
                raise GoldstoneAuthError("Keystone client call succeeded, but "
                                         "auth token was not returned.  Check "
                                         "credentials in goldstone settings.")
            else:
                md5 = hashlib.md5()
                md5.update(c.auth_token)
                return {'client': c, 'hex_token': md5.hexdigest()}
        except KeystoneUnauthorized:
                raise GoldstoneAuthError(
                    "Keystone client failed to authorize. Check credentials in"
                    " goldstone settings."
                )
    elif service == 'nova':
        try:
            c = nvclient.Client(user, passwd, tenant, auth_url,
                                service_type='compute')
            return {'client': c}
        except NovaUnauthorized:
            raise GoldstoneAuthError(
                "Nova client failed to authorize. Check credentials in"
                " goldstone settings."
            )
    elif service == 'cinder':
        try:
            cinderclient.v2.services.Service.__repr__ = \
                _patched_cinder_service_repr
            c = ciclient.Client(user, passwd, tenant, auth_url,
                                service_type='volume')
            region = _get_region_for_cinder_client(c)
            return {'client': c, 'region': region}
        except CinderUnauthorized:
            raise GoldstoneAuthError(
                "Cinder client failed to authorize. Check credentials in"
                " goldstone settings."
            )
    elif service == 'neutron':
        try:
            c = neclient.Client(user, passwd, tenant, auth_url)
            return {'client': c}
        except NeutronUnauthorized:
            raise GoldstoneAuthError(
                "Neutron client failed to authorize. Check credentials in"
                " goldstone settings."
            )
    elif service == 'glance':
        try:
            kc = _get_client(service='keystone')['client']
            mgmt_url = kc.endpoints.find(service_id=kc.services.
                                         find(name='glance').id).internalurl
            region = _get_region_for_glance_client(kc)
            c = glclient.Client(endpoint=mgmt_url, token=kc.auth_token)
            return {'client': c, 'region': region}
        except KeystoneUnauthorized:
            raise GoldstoneAuthError(
                "Glance client failed to authorize. Check credentials in"
                " goldstone settings."
            )
    else:
        raise GoldstoneAuthError("Unknown service")


_get_keystone_client = functools.partial(_get_client, service='keystone')
_get_nova_client = functools.partial(_get_client, service='nova')
_get_cinder_client = functools.partial(_get_client, service='cinder')
_get_neutron_client = functools.partial(_get_client, service='neutron')
_get_glance_client = functools.partial(_get_client, service='glance')


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


def _host_details(name_or_addr):
    if _is_ip_addr(name_or_addr):
        # try to resolve the hostname
        hn = _resolve_fqdn(name_or_addr)
        if hn:
            return dict({'ip_addr': name_or_addr}.items() + hn.items())
        else:
            return {'ip_addr': name_or_addr}
    else:
        addr = _resolve_addr(name_or_addr)
        hn = _partition_hostname(name_or_addr)
        if addr:
            return dict({'ip_addr': addr}.items() + hn.items())
        else:
            return hn


def _normalize_hostname(name_or_addr):
    """
    Takes host or ip and returns either an unqualified hostname or an ip
    address.
    """
    hd = _host_details(name_or_addr)
    if hd.get('hostname', None):
        return hd['hostname']
    else:
        return hd['ip_addr']


def _normalize_hostnames(host_keys, source, key=None):
    """
    Mutates the source dict with potential modifications to the
    keys listed in host_keys.  The keys will be modified in the following
    ways:
        - an attempt to resolve ip addresses will be made.  if resolvable,
          the unqualified hostname will be used, otherwise the ip address
          will be used
        - fully qualified hostnames will be reduced to unqualified
          hostnames
    """

    if isinstance(source, dict):
        for k, v in source.items():
            source[k] = _normalize_hostnames(host_keys, v, key=k)
        if key:
            return source
    elif isinstance(source, list):
        for v in source:
            v = _normalize_hostnames(host_keys, v)
        if key:
            return source
    elif key in host_keys:
        # compare key to our list and normalize if a match
        return _normalize_hostname(source)
    elif key:
        return source


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


def _construct_api_rec(reply, component, ts, timeout, url):
    if reply is not None:
        td = reply.elapsed
        secs = td.seconds + td.days * 24 * 3600
        fraction = float(td.microseconds) / 10**6
        millisecs = int(round((secs + fraction) * 1000))
        rec = {'response_time': millisecs,
               'response_status': reply.status_code,
               'response_length': int(reply.headers['content-length']),
               'component': component,
               'uri': urlparse(url).path,
               '@timestamp': ts.strftime("%Y-%m-%dT%H:%M:%S." +
                                         str(int(round(ts.microsecond/1000))) +
                                         "Z")}
        logger.debug("response = %s",
                     json.dumps(rec))
        return rec
    else:
        rec = {'response_time': timeout*1000,
               'response_status': 504,
               'response_length': 0,
               'component': component,
               'uri': urlparse(url).path,
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
                    auth_url=settings.OS_AUTH_URL, timeout=30):

    kt = _get_keystone_client(user=user,
                              passwd=passwd,
                              tenant=tenant,
                              auth_url=auth_url)

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
        reply = None
        try:
            reply = requests.get(url, headers=headers, data=data,
                                 timeout=settings.API_PERF_QUERY_TIMEOUT)

            # someone could change the upstream password to
            # match the configuration credentials after the result was cached.
            if reply.status_code == requests.codes.unauthorized:
                logger.debug("clearing keystone client cache due to 401 "
                             "response")
                _get_client.cache_clear()

        except Timeout:
            reply = None
            logger.debug("clearing keystone client cache due to 508 "
                         "response")
            _get_client.cache_clear()

        return {
            'reply': reply,
            'db_record': _construct_api_rec(reply, component, t, timeout, url)
        }
