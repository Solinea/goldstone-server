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
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

__author__ = 'John Stanford'

from django.conf.urls import patterns, url
from .views import DiscoverView, ReportView, AuthApiPerfView, \
    EndpointsDataView, RolesDataView, ServicesDataView, \
    TenantsDataView, UsersDataView

urlpatterns = patterns(
    '',
    url(r'^discover[/]?$', DiscoverView.as_view(),
        name='keystone-discover-view'),
    url(r'^report[/]?$', ReportView.as_view(),
        name='keystone-report-view'),
    url(r'^api_perf[/]?$', AuthApiPerfView.as_view(),
        name='keystone-api-perf'),
    url(r'^endpoints[/]?$', EndpointsDataView.as_view(),
        name='keystone-endpoints'),
    url(r'^roles[/]?$', RolesDataView.as_view(),
        name='keystone-roles'),
    url(r'^services[/]?$', ServicesDataView.as_view(),
        name='keystone-services'),
    url(r'^tenants[/]?$', TenantsDataView.as_view(),
        name='keystone-tenants'),
    url(r'^users[/]?$', UsersDataView.as_view(),
        name='keystone-users'),
)
