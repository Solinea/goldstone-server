"""Goldstone utilities."""
# Copyright 2014 - 2015 Solinea, Inc.
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

import arrow
from django.conf import settings
import cinderclient.v2.services
from keystoneclient.v2_0 import client as ksclient
from novaclient.v1_1 import client as nvclient
from cinderclient.v2 import client as ciclient
from neutronclient.v2_0 import client as neclient
from glanceclient.v2 import client as glclient
import logging
from urlparse import urlparse
import json
import socket
import functools
from keystoneclient.openstack.common.apiclient.exceptions \
    import Unauthorized as KeystoneUnauthorized
from novaclient.openstack.common.apiclient.exceptions \
    import Unauthorized as NovaUnauthorized
from cinderclient.openstack.common.apiclient.exceptions \
    import Unauthorized as CinderUnauthorized
from neutronclient.common.exceptions import Unauthorized as NeutronUnauthorized

logger = logging.getLogger(__name__)


def _patched_cinder_service_repr(self):
    """Hacking in a patch for the cinder service __repr__ method."""
    return "<Service: %s>" % self.binary


class GoldstoneBaseException(Exception):
    pass


class GoldstoneAuthError(GoldstoneBaseException):
    pass


class NoDailyIndex(GoldstoneBaseException):
    pass


class NoResourceFound(GoldstoneBaseException):
    pass


class UnexpectedSearchResponse(GoldstoneBaseException):
    pass


# TODO remove dependency utc_now and get rid of it
def utc_now():
    """Convenient, and possibly necessary.

    :return: timezone aware current UTC datetime
    """
    return arrow.utcnow().datetime


def to_es_date(date_object):

    result = date_object.strftime('%Y-%m-%dT%H:%M:%S.')
    result += '%03d' % int(round(date_object.microsecond / 1000.0))
    result += date_object.strftime('%z')
    return result


def _get_region_for_client(catalog, management_url, service_type):
    """
    returns the region for a management url and service type given the service
    catalog.
    """
    candidates = [svc for svc in catalog if svc['type'] == service_type]

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
    kc = get_keystone_client()['client']
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


def get_client(service, user=settings.OS_USERNAME,
               passwd=settings.OS_PASSWORD,
               tenant=settings.OS_TENANT_NAME,
               auth_url=settings.OS_AUTH_URL):
    import hashlib

    # Error message template.
    NO_AUTH = "%s client failed to authorize. Check credentials in" \
              " goldstone settings."

    if service == 'keystone':
        try:
            client = ksclient.Client(username=user,
                                     password=passwd,
                                     tenant_name=tenant,
                                     auth_url=auth_url)
            if client.auth_token is None:
                raise GoldstoneAuthError("Keystone client call succeeded, but "
                                         "auth token was not returned.  Check "
                                         "credentials in goldstone settings.")
            else:
                md5 = hashlib.md5()
                md5.update(client.auth_token)
                return {'client': client, 'hex_token': md5.hexdigest()}
        except KeystoneUnauthorized:
            raise GoldstoneAuthError(NO_AUTH % "Keystone")

    elif service == 'nova':
        try:
            client = nvclient.Client(user, passwd, tenant, auth_url,
                                     service_type='compute')
            return {'client': client}
        except NovaUnauthorized:
            raise GoldstoneAuthError(NO_AUTH % "Nova")

    elif service == 'cinder':
        try:
            cinderclient.v2.services.Service.__repr__ = \
                _patched_cinder_service_repr
            client = ciclient.Client(user, passwd, tenant, auth_url,
                                     service_type='volume')
            region = _get_region_for_cinder_client(client)
            return {'client': client, 'region': region}
        except CinderUnauthorized:
            raise GoldstoneAuthError(NO_AUTH % "Cinder")

    elif service == 'neutron':
        try:
            client = neclient.Client(user, passwd, tenant, auth_url)
            return {'client': client}
        except NeutronUnauthorized:
            raise GoldstoneAuthError(NO_AUTH % "Neutron")

    elif service == 'glance':
        try:
            keystoneclient = get_client(service='keystone')['client']
            mgmt_url = keystoneclient.endpoints.find(
                service_id=keystoneclient.services.find(name='glance').id)\
                .internalurl
            region = _get_region_for_glance_client(keystoneclient)
            client = glclient.Client(endpoint=mgmt_url,
                                     token=keystoneclient.auth_token)
            return {'client': client, 'region': region}

        except KeystoneUnauthorized:
            raise GoldstoneAuthError(NO_AUTH % "Glance")

    else:
        raise GoldstoneAuthError("Unknown service")

# These must be defined here, because they're based on get_client.
# pylint: disable=C0103
get_cinder_client = functools.partial(get_client, service='cinder')
get_glance_client = functools.partial(get_client, service='glance')
get_keystone_client = functools.partial(get_client, service='keystone')
get_nova_client = functools.partial(get_client, service='nova')

# pylint: enable=C0103


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
    """Return a hostname separated into host and domain parts."""

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
    except Exception:        # pylint: disable=W0703
        return None
    else:
        return _partition_hostname(resolved[0])


def _resolve_addr(hostname):
    """Return the IP address of a hostname."""
    try:
        return socket.gethostbyname(hostname)
    except Exception:        # pylint: disable=W0703
        return None


def _host_details(name_or_addr):

    if _is_ip_addr(name_or_addr):
        # Try to resolve the hostname.
        hostname = _resolve_fqdn(name_or_addr)
        if hostname:
            return dict({'ip_addr': name_or_addr}.items() + hostname.items())
        else:
            return {'ip_addr': name_or_addr}
    else:
        addr = _resolve_addr(name_or_addr)
        hostname = _partition_hostname(name_or_addr)
        if addr:
            return dict({'ip_addr': addr}.items() + hostname.items())
        else:
            return hostname


def _normalize_hostname(name_or_addr):
    """Return an unqualified hostname or IP address from a host or IP
    address."""

    hostdetail = _host_details(name_or_addr)

    return hostdetail['hostname'] if hostdetail.get('hostname', None) \
        else hostdetail['ip_addr']


def _normalize_hostnames(host_keys, source, key=None):
    """Mutate the source dict with potential modifications to the keys in
    host_keys.  The keys will be modified in the following ways:

        - an attempt to resolve ip addresses will be made.  if resolvable,
          the unqualified hostname will be used, otherwise the ip address
          will be used
        - fully qualified hostnames will be reduced to unqualified
          hostnames

    """

    if isinstance(source, dict):
        for akey, value in source.items():
            source[akey] = _normalize_hostnames(host_keys, value, key=akey)
        if key:
            return source

    elif isinstance(source, list):
        for entry in source:
            entry = _normalize_hostnames(host_keys, entry)
        if key:
            return source

    elif key in host_keys:
        # compare key to our list and normalize if a match
        return _normalize_hostname(source)

    elif key:
        return source

    return None


# TODO _decompose_url does not appear to be used.
def _decompose_url(url):
    """Return the scheme, host, and possibly port for an URL."""

    url_parsed = urlparse(url)
    result = {'scheme': url_parsed[0]}

    netloc = url_parsed[1]
    host = None

    if ":" in netloc:
        # host:port
        host_port = netloc.split(':')
        host = host_port[0]

        if len(host_port) > 1:
            result['port'] = host_port[1]

        result['port'] = host_port[1] if len(host_port) > 1 else None

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


class TopologyMixin(object):

    def _get_children(self, d, rsrc_type):

        assert (isinstance(d, dict) or isinstance(d, list)), \
            "d must be a list or dict"
        assert rsrc_type, "rsrc_type must have a value"

        if isinstance(d, list):
            # Convert it into a dict.
            d = {'rsrcType': None, 'children': d}

        # this is a matching child
        if d['rsrcType'] == rsrc_type:
            return d
        # this is not a match, but has children to check
        elif d.get('children', None):

            result = [self._get_children(c, rsrc_type)
                      for c in d['children']]
            if result and isinstance(result[0], list):
                # flatten it so we don't end up with nested lists
                return [c for l in result for c in l]
            else:
                return result
        else:
            return []

    @staticmethod
    def _eval_condition(source, target, cond):
        """Return the condition tested against the source and target dicts."""

        # Substitute reference to source and target in condition.
        cond = cond.replace("%source%", "sc").replace("%target%", "tc")

        try:
            return eval(cond,
                        {'__builtins__': {}},
                        {"sc": source, "tc": target, "len": len})
        except TypeError:
            return False

    def _attach_resource(self, attach_descriptor, source, target):
        """Attach one resource tree to another at a described point.

        The descriptor format is:

            {'sourceRsrcType': 'string',
             'targetRsrcType': 'string',
             'conditions': 'string'}

        If sourceRsrcType will be treated as the top level thing to attach.  If
        there are resources above it in the source dict, they will be ignored.
        The resource(s) of type sourceResourceType along with their descendants
        will be attached to resources of targetRsrcType in the target dict
        which match the condition expression.  The target dict assumes that
        nesting is via the 'children' key.  The condition will be evaluated as
        a boolean expression, and will have access to the items in both source
        and target.

        """
        import copy

        # basic sanity check.  all args should be dicts, source and target
        # should have a rsrcType field
        assert type(source) is list, "source param must be a list"
        assert type(target) is list, "target param must be a list"
        assert type(attach_descriptor) is dict, \
            "attach_descriptor param must be a dict"

        # make copies so they are not subject to mutation during or after the
        # the call.
        targ = copy.deepcopy(target)
        src = copy.deepcopy(source)
        ad_copy = attach_descriptor

        targ_children = self._get_children(targ, ad_copy['targetRsrcType'])
        src_children = self._get_children(src, ad_copy['sourceRsrcType'])

        for target_child in targ_children:
            for src_child in src_children:
                match = self._eval_condition(src_child,
                                             target_child,
                                             ad_copy['conditions'])
                if match:
                    if 'children' not in target_child:
                        target_child['children'] = []
                    target_child['children'].append(src_child)

        return targ
