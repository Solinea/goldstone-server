# vim: tabstop=4 shiftwidth=4 softtabstop=4

#
# Copyright 2014 Solinea, Inc.
#

from django.conf.urls import patterns, include, url

from .views import *

urlpatterns = patterns(
    '',
    # view calls
    url(r'^search[/]?$', IntelSearchView.as_view(), name='intel-search'),
    # data calls
    url(r'^log/cockpit/data[/]?$',
        bad_event_histogram, name='bad-event-data'),
    # TODO GOLD-239 parameterize the log search data start/end time
    url(r'^log/search/data/(?P<start_time>\d+)/(?P<end_time>\d+)[/]?$',
        log_search_data, name='intel-log-search-data'),
    url(r'^compute/vcpu_stats[/]?$', get_virt_cpu_stats,
        name='compute_vcpu_stats'),
    url(r'^compute/cpu_stats[/]?$', get_phys_cpu_stats,
        name='compute_cpu_stats'),
    url(r'^compute/phys_mem_stats[/]?$', get_phys_mem_stats,
        name='compute_phys_mem_stats'),
    url(r'^compute/virt_mem_stats[/]?$', get_virt_mem_stats,
        name='compute_virt_mem_stats'),
    url(r'^compute/phys_disk_stats[/]?$', get_phys_disk_stats,
        name='compute_phys_disk_stats'),
    url(r'^compute/virt_disk_stats[/]?$', get_virt_disk_stats,
        name='compute_virt_disk_stats'),
    url(r'^host_presence_stats[/]?$', host_presence_stats,
        name='host_presence_stats')
)
