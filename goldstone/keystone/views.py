"""Keystone views."""
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
from goldstone.core.utils import JsonReadOnlyViewSet
from .models import EndpointsData, RolesData, ServicesData, TenantsData, \
    UsersData


# Our API documentation extracts this docstring, hence the use of markup.
class EndpointsDataViewSet(JsonReadOnlyViewSet):
    """Return Endpoints data.

    \n\nQuery string parameters:\n

    <b>zone</b>: The desired zone.\n
    <b>region</b>: The desired region.\n\n

    """

    model = EndpointsData
    key = 'endpoints'


# Our API documentation extracts this docstring, hence the use of markup.
class RolesDataViewSet(JsonReadOnlyViewSet):
    """Return Roles data.

    \n\nQuery string parameters:\n

    <b>zone</b>: The desired zone.\n
    <b>region</b>: The desired region.\n\n

    """

    model = RolesData
    key = 'roles'


# Our API documentation extracts this docstring, hence the use of markup.
class ServicesDataViewSet(JsonReadOnlyViewSet):
    """Return Services data.

    \n\nQuery string parameters:\n

    <b>zone</b>: The desired zone.\n
    <b>region</b>: The desired region.\n\n

    """

    model = ServicesData
    key = 'services'


# Our API documentation extracts this docstring, hence the use of markup.
class TenantsDataViewSet(JsonReadOnlyViewSet):
    """Return Tenants data.

    \n\nQuery string parameters:\n

    <b>zone</b>: The desired zone.\n
    <b>region</b>: The desired region.\n\n

    """

    model = TenantsData
    key = 'tenants'


# Our API documentation extracts this docstring, hence the use of markup.
class UsersDataViewSet(JsonReadOnlyViewSet):
    """Return Users data.

    \n\nQuery string parameters:\n

    <b>zone</b>: The desired zone.\n
    <b>region</b>: The desired region.\n\n

    """

    model = UsersData
    key = 'users'
