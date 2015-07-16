"""Nova app URLconf."""
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
from .views import AgentsDataView, AggregatesDataView, AvailZonesDataView, \
    CloudpipesDataView, FlavorsDataView, FloatingIpPoolsDataView, \
    HostsDataView, HypervisorsDataView, NetworksDataView, SecGroupsDataView, \
    ServersDataView, ServicesDataView, SpawnsAggView

# Views handled by DjangoRestFramework Views.
urlpatterns = patterns(
    '',
    url(r'^agents', AgentsDataView.as_view(), name='nova-agents'),
    url(r'^aggregates', AggregatesDataView.as_view(), name='nova-aggregates'),
    url(r'^availability_zones',
        AvailZonesDataView.as_view(),
        name='nova-availability-zones'),
    url(r'^cloudpipes', CloudpipesDataView.as_view(), name='nova-cloudpipes'),
    url(r'^flavors', FlavorsDataView.as_view(), name='nova-flavors'),
    url(r'^floating_ip_pools',
        FloatingIpPoolsDataView.as_view(),
        name='nova-floating-ip-pools'),
    url(r'^hosts', HostsDataView.as_view(), name='nova-hosts'),
    url(r'^hypervisors',
        HypervisorsDataView.as_view(),
        name='nova-hypervisors'),
    url(r'^networks', NetworksDataView.as_view(), name='nova-networks'),
    url(r'^security_groups',
        SecGroupsDataView.as_view(),
        name='nova-security-groups'),
    url(r'^servers', ServersDataView.as_view(), name='nova-servers'),
    url(r'^services', ServicesDataView.as_view(), name='nova-services'),
    )

# Other views.
urlpatterns += patterns(
    '',
    url(r'^hypervisor/spawns/', SpawnsAggView.as_view()),
    )
