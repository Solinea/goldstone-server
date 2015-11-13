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
from goldstone.core.utils import JsonReadOnlyView
from .models import EndpointsData, RolesData, ServicesData, TenantsData, \
    UsersData


# Our API documentation extracts this docstring, hence the use of markup.
class EndpointsDataView(JsonReadOnlyView):
    """Return Endpoints data.

    ---

    GET:
        parameters:
           - name: region
             description: The desired region.
             paramType: query
           - name: zone
             description: The desired zone.
             paramType: query

    """

    model = EndpointsData
    key = 'endpoints'
    zone_key = "interface"


# Our API documentation extracts this docstring, hence the use of markup.
class RolesDataView(JsonReadOnlyView):
    """Return Roles data.

    ---

    GET:
        parameters:
           - name: region
             description: The desired region.
             paramType: query
           - name: zone
             description: The desired zone.
             paramType: query

    """

    model = RolesData
    key = 'roles'


# Our API documentation extracts this docstring, hence the use of markup.
class ServicesDataView(JsonReadOnlyView):
    """Return Services data.

    ---

    GET:
        parameters:
           - name: region
             description: The desired region.
             paramType: query
           - name: zone
             description: The desired zone.
             paramType: query

    """

    model = ServicesData
    key = 'services'


# Our API documentation extracts this docstring, hence the use of markup.
class TenantsDataView(JsonReadOnlyView):
    """Return Tenants data.

    ---

    GET:
        parameters:
           - name: region
             description: The desired region.
             paramType: query
           - name: zone
             description: The desired zone.
             paramType: query

    """

    model = TenantsData
    key = 'tenants'


# Our API documentation extracts this docstring, hence the use of markup.
class UsersDataView(JsonReadOnlyView):
    """Return Users data.

    ---

    GET:
        parameters:
           - name: region
             description: The desired region.
             paramType: query
           - name: zone
             description: The desired zone.
             paramType: query

    """

    model = UsersData
    key = 'users'
