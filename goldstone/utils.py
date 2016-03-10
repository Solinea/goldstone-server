"""Goldstone utilities."""
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
import functools
import socket

import arrow
from rest_framework.exceptions import PermissionDenied


class GoldstoneBaseException(Exception):
    """Base exception class for Goldstone-specific exceptions."""
    pass


class GoldstoneAuthError(GoldstoneBaseException):
    """Goldstone account authorization error."""
    pass


def now_micro_ts():
    return arrow.utcnow().timestamp * 1000


def to_es_date(date_object):
    """Return the string version of a datetime object."""

    result = date_object.strftime('%Y-%m-%dT%H:%M:%S.')
    result += '%03d' % int(round(date_object.microsecond / 1000.0))
    result += date_object.strftime('%z')
    return result


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

    try:
        return Cloud.objects.all()[0]
    except IndexError:
        raise GoldstoneAuthError("Cloud connection not configured")


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
