# vim: tabstop=4 shiftwidth=4 softtabstop=4

#
# Copyright 2014 Solinea, Inc.
#

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
    # TODO simplify stats url space by using the parameter presence to
    # decide whether it is an instantaneous or range request
    url(r'^hypervisor/latest-stats[/]?$', LatestStatsView.as_view(),
        name='nova-hypervisor-latest-stats'),
    url(r'^zones[/]?$', ZonesView.as_view(),
        name='nova-zones'),
    url(r'^api_perf[/]?$', ApiPerfView.as_view(),
        name='nova-api-perf'),
)
