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
)
