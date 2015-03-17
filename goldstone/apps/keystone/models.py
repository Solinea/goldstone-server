"""Keystone models."""
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
import logging

from goldstone.models import TopologyData

logger = logging.getLogger(__name__)


class EndpointsData(TopologyData):
    _DOC_TYPE = 'keystone_endpoint_list'
    _INDEX_PREFIX = 'goldstone-'


class RolesData(TopologyData):
    _DOC_TYPE = 'keystone_role_list'
    _INDEX_PREFIX = 'goldstone-'


class ServicesData(TopologyData):
    _DOC_TYPE = 'keystone_service_list'
    _INDEX_PREFIX = 'goldstone-'


class TenantsData(TopologyData):
    _DOC_TYPE = 'keystone_tenant_list'
    _INDEX_PREFIX = 'goldstone-'


class UsersData(TopologyData):
    _DOC_TYPE = 'keystone_user_list'
    _INDEX_PREFIX = 'goldstone-'


#
# This is the beginning of the new polymorphic resource model support
#
# These classes represent entities within a Keystone service.
#

class User(PolyResource):
    """An OpenStack user."""

    pass

class Domain(PolyResource):
    """An OpenStack domain."""

    pass


class Group(PolyResource):
    """An OpenStack group."""

    pass


class Token(PolyResource):
    """An OpenStack token."""

    pass


class Credential(PolyResource):
    """An OpenStack credential."""

    pass


class Role(PolyResource):
    """An OpenStack role."""

    pass


class Region(PolyResource):
    """An OpenStack region."""

    pass


class Endpoint(PolyResource):
    """An OpenStack endpoint."""

    pass


class Service(PolyResource):
    """An OpenStack service."""

    pass


class Project(PolyResource):
    """An OpenStack project."""

    pass
