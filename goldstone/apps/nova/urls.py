# Copyright 2014 Solinea, Inc.
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

from .views import *


urlpatterns = patterns(
    '',
    url(r'^discover[/]?$', DiscoverView.as_view(),
        name='nova-discover-view'),
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
)
