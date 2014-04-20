# vim: tabstop=4 shiftwidth=4 softtabstop=4

#
# Copyright 2014 Solinea, Inc.
#

from django.conf.urls import patterns, url
from .views import *

urlpatterns = patterns(
    '',
    # url(r'^discover[/]?$', DiscoverView.as_view(),
    #     name='cinder-discover-view'),
    url(r'^report[/]?$', ReportView.as_view(),
        name='neutron-report-view'),
    url(r'^agent_list_api_perf[/]?$', AgentListApiPerfView.as_view(),
        name='neutron-agent-list-api-perf'),
)
