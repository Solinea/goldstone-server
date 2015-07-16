"""Keystone app URLconf."""
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
from django.conf.urls import url, patterns
from .views import EndpointsDataView, RolesDataView, ServicesDataView, \
    TenantsDataView, UsersDataView

# Views handled by DjangoRestFramework Views.
urlpatterns = patterns(
    '',
    url(r'^endpoints', EndpointsDataView.as_view(), name='keystone-endpoints'),
    url(r'^roles', RolesDataView.as_view(), name='keystone-roles'),
    url(r'^services', ServicesDataView.as_view(), name='keystone-services'),
    url(r'^tenants', TenantsDataView.as_view(), name='keystone-tenants'),
    url(r'^users', UsersDataView.as_view(), name='keystone-users'),
)
