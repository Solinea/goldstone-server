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
# router.register(r'^agents', AgentsDataView, base_name='nova-agents')
# router.register(r'^aggregates',
#                 AggregatesDataView,
#                 base_name='nova-aggregates')
# router.register(r'^availability_zones',
#                 AvailZonesDataView,
#                 base_name='nova-availability-zones')
# router.register(r'^cloudpipes',
#                 CloudpipesDataView,
#                 base_name='nova-cloudpipes')
# router.register(r'^flavors', FlavorsDataView, base_name='nova-flavors')
# router.register(r'^floating_ip_pools',
#                 FloatingIpPoolsDataView,
#                 base_name='nova-floating-ip-pools')
# router.register(r'^hosts', HostsDataView, base_name='nova-hosts')
# router.register(r'^hypervisors',
#                 HypervisorsDataView,
#                 base_name='nova-hypervisors')
# router.register(r'^networks', NetworksDataView, base_name='nova-networks')
# router.register(r'^security_groups',
#                 SecGroupsDataView,
#                 base_name='nova-security-groups')
# router.register(r'^servers', ServersDataView, base_name='nova-servers')
# router.register(r'^services', ServicesDataView, base_name='nova-services')

# Other views.
urlpatterns += patterns(
    '',
    url(r'^hypervisor/spawns/', SpawnsAggView.as_view()),
    )
