# vim: tabstop=4 shiftwidth=4 softtabstop=4

#
# Copyright 2014 Solinea, Inc.
#

from django.conf.urls import patterns, include, url

from .views import *
import waffle

urlpatterns = patterns(
    '',
    # view calls
    url(r'^search[/]?$', IntelSearchView.as_view(), name='intel-search'),
    # data calls
    url(r'^log/cockpit/data[/]?$',
        log_event_histogram, name='bad-event-data'),
    url(r'^log/search/data[/]?$', log_search_data,
        name='intel-log-search-data'),
    url(r'^compute/virt_cpu_stats[/]?$', get_virt_cpu_stats,
        name='compute_virt_cpu_stats'),
    url(r'^compute/phys_cpu_stats[/]?$', get_phys_cpu_stats,
        name='compute_phys_cpu_stats'),
    url(r'^compute/cpu_stats[/]?$', get_cpu_stats,
        name='compute_cpu_stats'),
    url(r'^compute/mem_stats[/]?$', get_mem_stats,
        name='compute_mem_stats'),
    url(r'^compute/disk_stats[/]?$', get_disk_stats,
        name='compute_disk_stats'),
    url(r'^compute/phys_mem_stats[/]?$', get_phys_mem_stats,
        name='compute_phys_mem_stats'),
    url(r'^compute/virt_mem_stats[/]?$', get_virt_mem_stats,
        name='compute_virt_mem_stats'),
    url(r'^compute/phys_disk_stats[/]?$', get_phys_disk_stats,
        name='compute_phys_disk_stats'),
    url(r'^host_presence_stats[/]?$', host_presence_stats,
        name='host_presence_stats'),
)

if waffle.switch_is_active('gse'):
    urlpatterns += patterns(url(r'^compute/vcpu_stats[/]?$',
                                compute_vcpu_stats, name='compute_cpu_stats'),)
