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
import socket

import arrow
from django.conf import settings
import cinderclient.v2.services
from keystoneclient.v2_0 import client as ksclient
from novaclient.v1_1 import client as nvclient
from cinderclient.v2 import client as ciclient
from neutronclient.v2_0 import client as neclient
from glanceclient.v2 import client as glclient
import logging
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
    keystoneclient = get_keystone_client()['client']
    catalog = keystoneclient.service_catalog.catalog['serviceCatalog']
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
                return {'client': client, 'hex_token': client.auth_token}
        except KeystoneUnauthorized:
            raise GoldstoneAuthError(NO_AUTH % "Keystone")

    elif service == 'nova':
        try:
            client = nvclient.Client(user, passwd, tenant, auth_url,
                                     service_type='compute')
            client.authenticate()
            return {'client': client, 'hex_token': client.client.auth_token}
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


class TopologyMixin(object):

    def _get_children(self, children, rsrc_type):

        assert (isinstance(children, dict) or isinstance(children, list)), \
            "children must be a list or dict"
        assert rsrc_type, "rsrc_type must have a value"

        if isinstance(children, list):
            # Convert it into a dict.
            children = {'rsrcType': None, 'children': children}

        # this is a matching child
        if children['rsrcType'] == rsrc_type:
            return children

        # this is not a match, but has children to check
        elif children.get('children'):
            result = [self._get_children(c, rsrc_type)
                      for c in children['children']]
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
        assert isinstance(source, list), "source param must be a list"
        assert isinstance(target, list), "target param must be a list"
        assert isinstance(attach_descriptor, dict), \
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


def django_admin_only(wrapped_function):
    """A decorator that raises an exception if self.request.user.is_superuser
    is False."""

    @functools.wraps(wrapped_function)
    def _wrapper(*args, **kwargs):
        """Check self.request.user.is_superuser.

        args[0] must be self.

        """
        from rest_framework.exceptions import PermissionDenied
        print args[0].request.user

        if args[0].request.user.is_superuser:
            return wrapped_function(*args, **kwargs)
        else:
            raise PermissionDenied

    return _wrapper

def is_ipv4_addr(candidate):
    """Check a string to see if it is a valid v4 ip address

    :param candidate: string to check
    :return boolean
    """

    try:
        socket.inet_pton(socket.AF_INET, candidate)
        return True
    except socket.error:
        return False


def is_ipv6_addr(candidate):
    """Check a string to see if it is a valid v6 ip address

    :param candidate: string to check
    :return boolean
    """

    try:
        socket.inet_pton(socket.AF_INET6, candidate)
        return True
    except socket.error:
        return False


def is_ip_addr(candidate):
    """Check a string to see if it is a valid v4 or v6 IP address

    :param candidate: string to check
    :return boolean
    """

    return is_ipv4_addr(candidate) or is_ipv6_addr(candidate)


def partition_hostname(hostname):
    """Return a hostname separated into host and domain parts."""

    parts = hostname.partition('.')
    return dict(hostname=parts[0],
                domainname=parts[2] if parts[1] == '.' else None)

