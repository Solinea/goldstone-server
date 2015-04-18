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
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either expressed or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
import logging
from goldstone.core.utils import JsonReadOnlyViewSet
from .models import EndpointsData, RolesData, ServicesData, TenantsData, \
    UsersData

logger = logging.getLogger(__name__)


class EndpointsDataViewSet(JsonReadOnlyViewSet):
    model = EndpointsData
    key = 'endpoints'


class RolesDataViewSet(JsonReadOnlyViewSet):
    model = RolesData
    key = 'roles'


class ServicesDataViewSet(JsonReadOnlyViewSet):
    model = ServicesData
    key = 'services'


class TenantsDataViewSet(JsonReadOnlyViewSet):
    model = TenantsData
    key = 'tenants'


class UsersDataViewSet(JsonReadOnlyViewSet):
    model = UsersData
    key = 'users'
