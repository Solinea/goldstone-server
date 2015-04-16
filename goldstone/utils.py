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
import cinderclient.v2.services
from keystoneclient.v3 import client as ksclient
from novaclient.v2 import client as nvclient
from cinderclient.v2 import client as ciclient
from glanceclient.v2 import client as glclient
import functools
from keystoneclient.openstack.common.apiclient.exceptions \
    import Unauthorized as KeystoneUnauthorized
from novaclient.openstack.common.apiclient.exceptions \
    import Unauthorized as NovaUnauthorized
from cinderclient.openstack.common.apiclient.exceptions \
    import Unauthorized as CinderUnauthorized
from neutronclient.common.exceptions import Unauthorized as NeutronUnauthorized
from rest_framework.exceptions import PermissionDenied


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
    """Return the string version of a datetime object."""

    result = date_object.strftime('%Y-%m-%dT%H:%M:%S.')
    result += '%03d' % int(round(date_object.microsecond / 1000.0))
    result += date_object.strftime('%z')
    return result


def _get_region_for_client(catalog, service_type):
    """Return the region for a service type, given the
    service catalog."""

    candidates = [svc for svc in catalog if svc['type'] == service_type]

    # lots of bumps with Keystone v3 client implementation, including that
    # it doesn't have an endpoint for the v3 version of itself!  We have
    # to assume that all endpoints for a service are in the same Region, so
    # we'll just take the region from the first one.
    return candidates[0]['endpoints'][0]['region']


def _get_region_for_cinder_client(client):
    """Return the region for a cinder client."""

    # force authentication to populate management url
    client.authenticate()
    keystoneclient = get_keystone_client()['client']
    catalog = keystoneclient.service_catalog.catalog['catalog']
    return _get_region_for_client(catalog, 'volumev2')


def _get_region_for_glance_client(client):
    """Return the region for a glance client."""
    catalog = client.service_catalog.catalog['catalog']
    return _get_region_for_client(catalog, 'image')


def get_region_for_nova_client(client):
    """Return the region for nova client."""
    catalog = client.client.service_catalog.catalog['access']['serviceCatalog']
    return _get_region_for_client(catalog, 'compute')


def get_region_for_keystone_client(client):
    """Return the region for keystone client."""
    catalog = client.service_catalog.catalog['catalog']
    return _get_region_for_client(catalog, 'identity')


def get_cloud():
    """Return an OpenStack cloud object.

    Today, we can rely on the system containing one and only one Goldstone
    tenant. That tenant will contain one and only one OpenStack cloud.

    When these constraints are relaxed in the future, the codebase will need
    to change, and this function will need to evolve. The most likely outcome
    that it becomes a generator that returns the next OpenStack cloud within a
    tenant.

    :return: OpenStack credentials
    :rtype: Cloud

    """
    from goldstone.tenants.models import Cloud

    return Cloud.objects.all()[0]


def get_client(service):
    """Return a client object and authorization token.

    :rtype: dict

    """
    from goldstone.neutron.utils import get_neutron_client

    # Error message template.
    NO_AUTH = "%s client failed to authorize. Check credentials in" \
              " goldstone settings."

    try:
        cloud = get_cloud()
        os_username = cloud.username
        os_password = cloud.password
        os_tenant_name = cloud.tenant_name
        os_auth_url = cloud.auth_url

        if service == 'keystone':
            client = ksclient.Client(username=os_username,
                                     password=os_password,
                                     tenant_name=os_tenant_name,
                                     auth_url=os_auth_url)
            if client.auth_token is None:
                raise GoldstoneAuthError("Keystone client call succeeded, but "
                                         "auth token was not returned.  Check "
                                         "credentials in goldstone settings.")
            else:
                return {'client': client, 'hex_token': client.auth_token}

        elif service == 'nova':
            # TODO should probably store the v2 and v3 auth urls in cloud obj
            client = nvclient.Client(os_username,
                                     os_password,
                                     os_tenant_name,
                                     os_auth_url.replace('/v3/', '/v2.0/'))
            client.authenticate()
            return {'client': client, 'hex_token': client.client.auth_token}

        elif service == 'cinder':
            cinderclient.v2.services.Service.__repr__ = \
                _patched_cinder_service_repr
            client = ciclient.Client(os_username,
                                     os_password,
                                     os_tenant_name,
                                     os_auth_url.replace('/v3/', '/v2.0/'))
            region = _get_region_for_cinder_client(client)
            return {'client': client, 'region': region}

        elif service == 'neutron':
            client = get_neutron_client(os_username,
                                        os_password,
                                        os_tenant_name,
                                        os_auth_url)
            return {'client': client}

        elif service == 'glance':
            keystoneclient = get_client("keystone")['client']

            # This had used a "name='glance'" qualifier, but the V3 find method
            # raised a NoUniqueMatch exception. Keystone no longer accepts
            # 'name' as a qualifier, so use 'type'.
            service_id = keystoneclient.services.find(type="image").id

            mgmt_url = \
                keystoneclient.endpoints.find(service_id=service_id,
                                              interface="admin").url

            region = _get_region_for_glance_client(keystoneclient)
            client = glclient.Client(endpoint=mgmt_url,
                                     token=keystoneclient.auth_token)
            return {'client': client, 'region': region}

        else:
            raise GoldstoneAuthError("Unknown service")

    except (KeystoneUnauthorized, NovaUnauthorized, CinderUnauthorized,
            NeutronUnauthorized):
        raise GoldstoneAuthError(NO_AUTH % service.capitalize())


# These must be defined here, because they're based on get_client.
# pylint: disable=C0103
get_cinder_client = functools.partial(get_client, 'cinder')
get_glance_client = functools.partial(get_client, 'glance')
get_keystone_client = functools.partial(get_client, 'keystone')
get_nova_client = functools.partial(get_client, 'nova')

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
    """A decorator that raises an exception if self.request.user is not a
    superuser, i.e., a Django admin."""

    @functools.wraps(wrapped_function)
    def _wrapper(*args, **kwargs):
        """Check self.request.user.is_superuser.

        args[0] must be self.

        """

        if args[0].request.user.is_superuser:
            return wrapped_function(*args, **kwargs)
        else:
            raise PermissionDenied

    return _wrapper


def django_and_tenant_admins_only(wrapped_function):
    """A decorator that raises an exception if self.request.user is not a
    superuser (i.e., a Django admin), or a tenant_admin."""

    @functools.wraps(wrapped_function)
    def _wrapper(*args, **kwargs):
        """Check self.request.user.is_superuser and .tenant_admin.

        args[0] must be self.

        """

        user = args[0].request.user

        # Checking is_authenticated filters out AnonymousUser.
        if user.is_superuser or \
           (user.is_authenticated() and user.tenant_admin):
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
