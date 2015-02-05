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

"""

This module contains all url handlers for the OpenStack Nova application.

"""

from django.conf.urls import patterns, url

from .views import ReportView, SpawnsView, CpuView, MemoryView, \
    DiskView, LatestStatsView, ApiPerfView, AgentsDataView, \
    AggregatesDataView, AvailZonesDataView, CloudpipesDataView, \
    FlavorsDataView, FloatingIpPoolsDataView, HostsDataView, \
    HypervisorsDataView, NetworksDataView, SecGroupsDataView, ServersDataView, \
    ServicesDataView


urlpatterns = patterns(
    '',
    url(r'^report[/]?$', ReportView.as_view(),
        name='nova-report-view'),
    url(r'^hypervisor/spawns[/]?$', SpawnsView.as_view(),
        name='nova-spawn-view'),
    url(r'^hypervisor/cpu[/]?$', CpuView.as_view(),
        name='nova-hypervisor-cpu'),
    url(r'^hypervisor/mem[/]?$', MemoryView.as_view(),
        name='nova-hypervisor-mem'),
    url(r'^hypervisor/disk[/]?$', DiskView.as_view(),
        name='nova-hypervisor-disk'),
    url(r'^hypervisor/latest-stats[/]?$', LatestStatsView.as_view(),
        name='nova-hypervisor-latest-stats'),
    url(r'^api_perf[/]?$', ApiPerfView.as_view(),
        name='nova-api-perf'),
    url(r'^agents[/]?$', AgentsDataView.as_view(),
        name='nova-agents'),
    url(r'^aggregates[/]?$', AggregatesDataView.as_view(),
        name='nova-aggregates'),
    url(r'^availability_zones[/]?$', AvailZonesDataView.as_view(),
        name='nova-availability-zones'),
    url(r'^cloudpipes[/]?$', CloudpipesDataView.as_view(),
        name='nova-cloudpipes'),
    url(r'^flavors[/]?$', FlavorsDataView.as_view(),
        name='nova-flavors'),
    url(r'^floating_ip_pools[/]?$', FloatingIpPoolsDataView.as_view(),
        name='nova-floating-ip-pools'),
    url(r'^hosts[/]?$', HostsDataView.as_view(),
        name='nova-hosts'),
    url(r'^hypervisors[/]?$', HypervisorsDataView.as_view(),
        name='nova-hypervisors'),
    url(r'^networks[/]?$', NetworksDataView.as_view(),
        name='nova-networks'),
    url(r'^security_groups[/]?$', SecGroupsDataView.as_view(),
        name='nova-security-groups'),
    url(r'^servers[/]?$', ServersDataView.as_view(),
        name='nova-servers'),
    url(r'^services[/]?$', ServicesDataView.as_view(),
        name='nova-services'),
)
